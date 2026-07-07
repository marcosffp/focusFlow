import type { Result } from "@shared-types/index";
import {
  startSession as startSessionMachine,
  endSession as endSessionMachine,
  dismissReport as dismissReportMachine,
} from "@domain/session/sessionMachine";
import { MAX_OBJECTIVE_LENGTH, type DistractionEvent, type Session } from "@domain/types";
import { isDistractionDomain } from "@domain/distraction/domainMatcher";
import { hasConfirmedDomain } from "@domain/distraction/deduplication";
import { sessionRepository } from "@services/storage/sessionRepository";
import {
  sessionRuntimeRepository,
  DEFAULT_SESSION_RUNTIME_STATE,
  type SessionRuntimeState,
} from "@services/storage/sessionRuntimeRepository";
import { settingsRepository } from "@services/storage/settingsRepository";
import { distractionSiteRepository } from "@services/storage/distractionSiteRepository";
import { historyRepository } from "@services/storage/historyRepository";
import { sendToTab } from "@services/messaging/overlay";
import { generateId } from "@utils/id";
import { extractHostname } from "@utils/url";
import { createSerializedQueue } from "@utils/serialized";

export const VISIT_ALERT_ALARM_PREFIX = "focusflow-visit-alert:";
export const HEARTBEAT_ALARM_NAME = "focusflow-heartbeat";
// Chrome limita chrome.alarms.create a no mínimo 1 minuto para extensões empacotadas
// (só permite frações de minuto em modo desenvolvedor/não empacotado). Pedimos 0.5 para
// ter a menor granularidade possível em dev; em produção o Chrome deve arredondar para
// 1 minuto. Isso é aceitável porque este alarme é só uma rede de segurança — o
// mecanismo primário do alerta é o alarme avulso por visita (VISIT_ALERT_ALARM_PREFIX),
// que não tem essa limitação por ser um alarme único (when), não periódico.
const HEARTBEAT_PERIOD_MINUTES = 0.5;

// Um id por visita (não tabId+timestamp) evita colisão quando o usuário sai e volta
// para a mesma aba dentro do mesmo milissegundo — cada visita precisa de um alarme
// com identidade própria para que um alarme atrasado/obsoleto possa ser descartado.
function alarmNameForVisit(): string {
  return `${VISIT_ALERT_ALARM_PREFIX}${generateId()}`;
}

// Eventos de tabs/janelas/alarmes do Chrome podem chegar em qualquer ordem e se
// sobrepor (o service worker processa um handler assíncrono por vez, mas dois
// handlers podem estar "em voo" simultaneamente). Sem serializar, duas chamadas
// concorrentes poderiam ler o mesmo estado de sessão antes de qualquer uma
// escrever de volta, perdendo uma delas. Toda mutação de sessão passa por aqui.
const serialized = createSerializedQueue();

async function updateActiveSession(mutate: (session: Session) => Session): Promise<void> {
  const sessionState = await sessionRepository.get();
  if (sessionState.status !== "active") {
    return;
  }
  await sessionRepository.set({ status: "active", session: mutate(sessionState.session) });
}

function appendDistractionEvent(event: DistractionEvent): Promise<void> {
  return updateActiveSession((session) => ({
    ...session,
    distractionEvents: [...session.distractionEvents, event],
  }));
}

function setDistractionEventLeftAt(eventId: string, leftAt: number): Promise<void> {
  return updateActiveSession((session) => ({
    ...session,
    distractionEvents: session.distractionEvents.map((event) =>
      event.id === eventId && event.leftAt === null ? { ...event, leftAt } : event,
    ),
  }));
}

async function closeCurrentVisit(runtime: SessionRuntimeState, now: number): Promise<void> {
  if (runtime.currentVisit === null) {
    return;
  }
  await chrome.alarms.clear(runtime.currentVisit.alarmName);
  if (runtime.currentVisit.alertedEventId !== null) {
    await setDistractionEventLeftAt(runtime.currentVisit.alertedEventId, now);
    // Se o usuário trocar de aba antes de responder, o overlay não deve continuar
    // pendurado na aba (que pode voltar a ficar ativa depois como uma visita nova).
    await sendToTab(runtime.currentVisit.tabId, { type: "HIDE_OVERLAY" });
  }
}

export function startSession(objective: string): Promise<Result<void>> {
  return serialized(async () => {
    const trimmedObjective = objective.trim();
    if (trimmedObjective.length === 0) {
      return { ok: false, reason: "objetivo não pode ser vazio" };
    }
    if (trimmedObjective.length > MAX_OBJECTIVE_LENGTH) {
      return {
        ok: false,
        reason: `objetivo não pode ter mais de ${MAX_OBJECTIVE_LENGTH} caracteres`,
      };
    }

    const currentState = await sessionRepository.get();
    const now = Date.now();
    const result = startSessionMachine(currentState, {
      sessionId: generateId(),
      objective: { text: trimmedObjective, createdAt: now },
      startedAt: now,
    });
    if (!result.ok) {
      return result;
    }
    await sessionRepository.set(result.value);
    await sessionRuntimeRepository.set(DEFAULT_SESSION_RUNTIME_STATE);
    await chrome.alarms.create(HEARTBEAT_ALARM_NAME, {
      periodInMinutes: HEARTBEAT_PERIOD_MINUTES,
    });

    const activeTab = await getFocusedActiveTab();
    if (activeTab !== null) {
      await applyActiveTabChanged(activeTab);
    }
    return { ok: true, value: undefined };
  });
}

export function endSession(): Promise<Result<void>> {
  return serialized(async () => {
    const runtime = await sessionRuntimeRepository.get();
    const now = Date.now();
    // Fecha a visita em andamento (se houver) antes de calcular o report, para que o
    // tempo dessa última visita entre na classificação em vez de ficar com leftAt nulo.
    await closeCurrentVisit(runtime, now);
    await chrome.alarms.clear(HEARTBEAT_ALARM_NAME);

    const currentState = await sessionRepository.get();
    const settings = await settingsRepository.get();
    const endedResult = endSessionMachine(currentState, {
      endedAt: now,
      minAlertSeconds: settings.minAlertSeconds,
    });
    if (!endedResult.ok) {
      return endedResult;
    }

    const history = await historyRepository.get();
    await historyRepository.set([
      ...history,
      { session: endedResult.value.session, report: endedResult.value.report },
    ]);
    await sessionRepository.set(endedResult.value);
    await sessionRuntimeRepository.set(DEFAULT_SESSION_RUNTIME_STATE);
    return { ok: true, value: undefined };
  });
}

export function dismissReport(): Promise<Result<void>> {
  return serialized(async () => {
    const currentState = await sessionRepository.get();
    const dismissedResult = dismissReportMachine(currentState);
    if (!dismissedResult.ok) {
      return dismissedResult;
    }
    await sessionRepository.set(dismissedResult.value);
    return { ok: true, value: undefined };
  });
}

async function applyActiveTabChanged(input: { tabId: number; url: string }): Promise<void> {
  const sessionState = await sessionRepository.get();
  if (sessionState.status !== "active") {
    return;
  }

  const domain = extractHostname(input.url);
  const now = Date.now();
  const runtime = await sessionRuntimeRepository.get();

  const isSameVisit =
    runtime.currentVisit !== null &&
    runtime.currentVisit.tabId === input.tabId &&
    runtime.currentVisit.domain === domain;
  if (isSameVisit) {
    return;
  }

  await closeCurrentVisit(runtime, now);

  if (domain === null) {
    await sessionRuntimeRepository.set({
      currentVisit: null,
      lastProductiveTab: runtime.lastProductiveTab,
    });
    return;
  }

  const [settings, distractionSites] = await Promise.all([
    settingsRepository.get(),
    distractionSiteRepository.get(),
  ]);
  const activeDistractionDomains = distractionSites
    .filter((site) => site.isActive)
    .map((site) => site.domain);
  const isDistraction = isDistractionDomain(domain, activeDistractionDomains);

  if (!isDistraction) {
    await sessionRuntimeRepository.set({
      currentVisit: null,
      lastProductiveTab: { tabId: input.tabId, domain },
    });
    return;
  }

  const alarmName = alarmNameForVisit();
  await sessionRuntimeRepository.set({
    currentVisit: { tabId: input.tabId, domain, enteredAt: now, alarmName, alertedEventId: null },
    lastProductiveTab: runtime.lastProductiveTab,
  });
  await chrome.alarms.create(alarmName, { when: now + settings.minAlertSeconds * 1000 });
}

export function handleActiveTabChanged(input: { tabId: number; url: string }): Promise<void> {
  return serialized(() => applyActiveTabChanged(input));
}

// Toda sessão começa com alguma aba já ativa (o usuário clicou no ícone da extensão a
// partir de uma aba real) — sem isso, se essa aba já for um domínio de distração, ela
// nunca seria percebida, porque `onActivated`/`onUpdated` só disparam em uma troca
// futura de aba ou URL, não no estado em que a aba já se encontra.
async function getFocusedActiveTab(): Promise<{ tabId: number; url: string } | null> {
  const activeTabs = await chrome.tabs.query({ active: true });
  for (const tab of activeTabs) {
    if (tab.id === undefined || !tab.url) {
      continue;
    }
    const window = await chrome.windows.get(tab.windowId);
    if (window.focused) {
      return { tabId: tab.id, url: tab.url };
    }
  }
  return null;
}

export function handleBrowserFocusLost(): Promise<void> {
  return serialized(async () => {
    const sessionState = await sessionRepository.get();
    if (sessionState.status !== "active") {
      return;
    }
    const runtime = await sessionRuntimeRepository.get();
    if (runtime.currentVisit === null) {
      return;
    }
    await closeCurrentVisit(runtime, Date.now());
    await sessionRuntimeRepository.set({
      currentVisit: null,
      lastProductiveTab: runtime.lastProductiveTab,
    });
  });
}

async function triggerAlert(session: Session, runtime: SessionRuntimeState): Promise<void> {
  if (runtime.currentVisit === null || runtime.currentVisit.alertedEventId !== null) {
    return;
  }

  const { tabId, domain, enteredAt, alarmName } = runtime.currentVisit;
  const alreadyConfirmed = hasConfirmedDomain(session.distractionEvents, domain);
  const event: DistractionEvent = {
    id: generateId(),
    domain,
    enteredAt,
    leftAt: null,
    answer: alreadyConfirmed ? "yes" : "unanswered",
  };
  await appendDistractionEvent(event);
  await sessionRuntimeRepository.set({
    currentVisit: { tabId, domain, enteredAt, alarmName, alertedEventId: event.id },
    lastProductiveTab: runtime.lastProductiveTab,
  });

  // Com notificações desativadas o usuário nunca vê o popup de confirmação, então o
  // evento permanece "unanswered" — o que já é classificado como distraído assim que a
  // visita termina (SOLUCAO.md seção 9 e regra de timeClassification), sem precisar de
  // um caminho separado para essa regra.
  const settings = await settingsRepository.get();
  if (!alreadyConfirmed && settings.notificationsEnabled) {
    await sendToTab(tabId, { type: "SHOW_ASK_OVERLAY", eventId: event.id, domain });
  }
}

export function handleAlertThresholdReached(alarmName: string): Promise<void> {
  return serialized(async () => {
    const sessionState = await sessionRepository.get();
    if (sessionState.status !== "active") {
      return;
    }

    const runtime = await sessionRuntimeRepository.get();
    if (runtime.currentVisit === null || runtime.currentVisit.alarmName !== alarmName) {
      // Alarme obsoleto: a visita já mudou.
      return;
    }

    await triggerAlert(sessionState.session, runtime);
  });
}

// Rede de segurança: o alarme avulso por visita (acima) é o mecanismo primário do
// alerta, mas se ele for perdido por algum motivo (ex.: o Chrome descartou o
// alarme), este heartbeat periódico reavalia se o tempo mínimo já passou e
// dispara o alerta mesmo assim.
export function handleHeartbeat(): Promise<void> {
  return serialized(async () => {
    const sessionState = await sessionRepository.get();
    if (sessionState.status !== "active") {
      return;
    }

    const runtime = await sessionRuntimeRepository.get();
    if (runtime.currentVisit === null || runtime.currentVisit.alertedEventId !== null) {
      return;
    }

    const settings = await settingsRepository.get();
    const elapsedSeconds = (Date.now() - runtime.currentVisit.enteredAt) / 1000;
    if (elapsedSeconds < settings.minAlertSeconds) {
      return;
    }

    await triggerAlert(sessionState.session, runtime);
  });
}

export function answerDistraction(eventId: string, answer: "yes" | "no"): Promise<Result<void>> {
  return serialized(async () => {
    const sessionState = await sessionRepository.get();
    if (sessionState.status !== "active") {
      return { ok: false, reason: "não há sessão ativa" };
    }
    const events = sessionState.session.distractionEvents;
    const eventIndex = events.findIndex((event) => event.id === eventId);
    if (eventIndex === -1) {
      return { ok: false, reason: "evento de distração não encontrado" };
    }

    const updatedEvents = events.map((event, index) =>
      index === eventIndex ? { ...event, answer } : event,
    );
    await sessionRepository.set({
      status: "active",
      session: { ...sessionState.session, distractionEvents: updatedEvents },
    });

    const runtime = await sessionRuntimeRepository.get();
    if (runtime.currentVisit?.alertedEventId === eventId) {
      await sendToTab(
        runtime.currentVisit.tabId,
        answer === "no" ? { type: "SHOW_LEFT_FOCUS_OVERLAY" } : { type: "HIDE_OVERLAY" },
      );
    }
    return { ok: true, value: undefined };
  });
}

export function returnToWork(): Promise<void> {
  return serialized(async () => {
    const runtime = await sessionRuntimeRepository.get();
    const productiveTab = runtime.lastProductiveTab;

    if (productiveTab !== null) {
      try {
        const tab = await chrome.tabs.get(productiveTab.tabId);
        const currentDomain = tab.url ? extractHostname(tab.url) : null;
        if (currentDomain === productiveTab.domain) {
          await chrome.tabs.update(productiveTab.tabId, { active: true });
          await chrome.windows.update(tab.windowId, { focused: true });
          return;
        }
      } catch {
        // aba produtiva não existe mais — cai para criar uma nova abaixo.
      }
    }
    await chrome.tabs.create({});
  });
}
