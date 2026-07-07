import { beforeEach, describe, expect, it } from "vitest";
import { installFakeChromeStorage } from "../../tests/mocks/chromeStorage";
import { installFakeChromeBrowser } from "../../tests/mocks/chromeTabs";
import { sessionRepository } from "@services/storage/sessionRepository";
import { sessionRuntimeRepository } from "@services/storage/sessionRuntimeRepository";
import { settingsRepository } from "@services/storage/settingsRepository";
import type { DistractionEvent } from "@domain/types";
import {
  startSession,
  handleActiveTabChanged,
  handleAlertThresholdReached,
  handleBrowserFocusLost,
  handleHeartbeat,
  answerDistraction,
  returnToWork,
  VISIT_ALERT_ALARM_PREFIX,
} from "./sessionController";

function installBrowser(): ReturnType<typeof installFakeChromeBrowser> {
  installFakeChromeStorage();
  return installFakeChromeBrowser({
    tabs: [
      { id: 1, url: "https://example.com", active: true, windowId: 1 },
      { id: 2, url: "https://youtube.com", active: true, windowId: 1 },
    ],
    windows: [{ id: 1, focused: true }],
  });
}

async function getEvents(): Promise<readonly DistractionEvent[]> {
  const state = await sessionRepository.get();
  if (state.status !== "active") {
    throw new Error("sessão não está ativa");
  }
  return state.session.distractionEvents;
}

function countVisitAlarms(browser: ReturnType<typeof installFakeChromeBrowser>): number {
  return Array.from(browser.scheduledAlarms.keys()).filter((name) =>
    name.startsWith(VISIT_ALERT_ALARM_PREFIX),
  ).length;
}

function countAskOverlayMessages(
  browser: ReturnType<typeof installFakeChromeBrowser>,
  tabId: number,
): number {
  return (browser.tabMessages.get(tabId) ?? []).filter(
    (message) => message.type === "SHOW_ASK_OVERLAY",
  ).length;
}

async function getScheduledAlarmName(): Promise<string> {
  const runtime = await sessionRuntimeRepository.get();
  if (runtime.currentVisit === null) {
    throw new Error("não há uma visita atual com alarme agendado");
  }
  return runtime.currentVisit.alarmName;
}

function assertDefined<T>(value: T | undefined): asserts value is T {
  if (value === undefined) {
    throw new Error("valor esperado não pode ser undefined");
  }
}

describe("handleActiveTabChanged", () => {
  let browser: ReturnType<typeof installFakeChromeBrowser>;

  beforeEach(async () => {
    browser = installBrowser();
    await startSession("Estudar TypeScript");
  });

  it("é um no-op quando não há sessão ativa", async () => {
    await sessionRepository.set({ status: "idle" });

    await handleActiveTabChanged({ tabId: 2, url: "https://youtube.com" });

    expect(countVisitAlarms(browser)).toBe(0);
  });

  it("marca uma aba não-distração como última aba produtiva, sem criar evento", async () => {
    await handleActiveTabChanged({ tabId: 1, url: "https://example.com" });

    const runtime = await sessionRuntimeRepository.get();
    expect(runtime.lastProductiveTab).toEqual({ tabId: 1, domain: "example.com" });
    expect(runtime.currentVisit).toBeNull();
    expect(await getEvents()).toHaveLength(0);
  });

  it("agenda um alarme avulso ao entrar em um domínio de distração, sem criar evento ainda", async () => {
    await handleActiveTabChanged({ tabId: 2, url: "https://youtube.com" });

    expect(countVisitAlarms(browser)).toBe(1);
    expect(await getEvents()).toHaveLength(0);
  });

  it("fecha a visita anterior (leftAt) ao trocar de aba após o alerta já ter sido disparado", async () => {
    await handleActiveTabChanged({ tabId: 2, url: "https://youtube.com" });
    await handleAlertThresholdReached(await getScheduledAlarmName());

    await handleActiveTabChanged({ tabId: 1, url: "https://example.com" });

    const events = await getEvents();
    expect(events).toHaveLength(1);
    expect(events[0]?.leftAt).not.toBeNull();
  });

  it("cancela o alarme da visita anterior ao trocar de aba antes do alerta disparar", async () => {
    await handleActiveTabChanged({ tabId: 2, url: "https://youtube.com" });

    await handleActiveTabChanged({ tabId: 1, url: "https://example.com" });

    expect(countVisitAlarms(browser)).toBe(0);
  });

  it("um alarme obsoleto (de uma visita já substituída) não cria um evento indevido", async () => {
    await handleActiveTabChanged({ tabId: 2, url: "https://youtube.com" });
    const staleAlarmName = await getScheduledAlarmName();

    await handleActiveTabChanged({ tabId: 1, url: "https://example.com" });
    await handleActiveTabChanged({ tabId: 2, url: "https://youtube.com" });

    await handleAlertThresholdReached(staleAlarmName);

    expect(await getEvents()).toHaveLength(0);
  });

  it("ignora URLs não rastreáveis (chrome://) sem quebrar o estado atual", async () => {
    await handleActiveTabChanged({ tabId: 3, url: "chrome://extensions" });

    const runtime = await sessionRuntimeRepository.get();
    expect(runtime.currentVisit).toBeNull();
  });
});

describe("startSession detecta a aba já ativa no momento do início", () => {
  it("agenda o alarme avulso quando a sessão começa com a aba ativa já em domínio de distração", async () => {
    installFakeChromeStorage();
    const browser = installFakeChromeBrowser({
      tabs: [{ id: 1, url: "https://youtube.com", active: true, windowId: 1 }],
      windows: [{ id: 1, focused: true }],
    });

    await startSession("Estudar TypeScript");

    expect(countVisitAlarms(browser)).toBe(1);
    const runtime = await sessionRuntimeRepository.get();
    expect(runtime.currentVisit?.domain).toBe("youtube.com");
    expect(await getEvents()).toHaveLength(0);
  });

  it("registra a aba ativa não-distração como última aba produtiva ao iniciar a sessão", async () => {
    installFakeChromeStorage();
    installFakeChromeBrowser({
      tabs: [{ id: 1, url: "https://example.com", active: true, windowId: 1 }],
      windows: [{ id: 1, focused: true }],
    });

    await startSession("Estudar TypeScript");

    const runtime = await sessionRuntimeRepository.get();
    expect(runtime.lastProductiveTab).toEqual({ tabId: 1, domain: "example.com" });
    expect(runtime.currentVisit).toBeNull();
  });

  it("não detecta a aba ativa se ela estiver em uma janela sem foco do SO", async () => {
    installFakeChromeStorage();
    const browser = installFakeChromeBrowser({
      tabs: [{ id: 1, url: "https://youtube.com", active: true, windowId: 1 }],
      windows: [{ id: 1, focused: false }],
    });

    await startSession("Estudar TypeScript");

    expect(countVisitAlarms(browser)).toBe(0);
    const runtime = await sessionRuntimeRepository.get();
    expect(runtime.currentVisit).toBeNull();
    expect(runtime.lastProductiveTab).toBeNull();
  });
});

describe("handleBrowserFocusLost", () => {
  it("fecha a visita atual (leftAt) quando o Chrome perde o foco do sistema operacional", async () => {
    installBrowser();
    await startSession("Estudar TypeScript");
    await handleActiveTabChanged({ tabId: 2, url: "https://youtube.com" });
    await handleAlertThresholdReached(await getScheduledAlarmName());

    await handleBrowserFocusLost();

    const runtime = await sessionRuntimeRepository.get();
    expect(runtime.currentVisit).toBeNull();
    const events = await getEvents();
    expect(events[0]?.leftAt).not.toBeNull();
  });
});

describe("handleHeartbeat", () => {
  it("é uma rede de segurança: dispara o alerta se o alarme avulso da visita nunca chegou a rodar", async () => {
    const browser = installBrowser();
    await settingsRepository.set({ notificationsEnabled: true, minAlertSeconds: 0 });
    await startSession("Estudar TypeScript");
    await handleActiveTabChanged({ tabId: 2, url: "https://youtube.com" });
    const alarmName = await getScheduledAlarmName();
    browser.scheduledAlarms.delete(alarmName);

    await handleHeartbeat();

    const events = await getEvents();
    expect(events).toHaveLength(1);
    expect(events[0]?.answer).toBe("unanswered");
  });

  it("não faz nada quando o tempo mínimo para alerta ainda não passou", async () => {
    installBrowser();
    await startSession("Estudar TypeScript");
    await handleActiveTabChanged({ tabId: 2, url: "https://youtube.com" });

    await handleHeartbeat();

    expect(await getEvents()).toHaveLength(0);
  });

  it("não faz nada quando não há uma visita de distração em andamento", async () => {
    installBrowser();
    await startSession("Estudar TypeScript");

    await handleHeartbeat();

    expect(await getEvents()).toHaveLength(0);
  });
});

describe("handleAlertThresholdReached", () => {
  let browser: ReturnType<typeof installFakeChromeBrowser>;

  beforeEach(async () => {
    browser = installBrowser();
    await startSession("Estudar TypeScript");
  });

  it("cria um evento 'unanswered' e mostra o overlay de confirmação na aba", async () => {
    await handleActiveTabChanged({ tabId: 2, url: "https://youtube.com" });

    await handleAlertThresholdReached(await getScheduledAlarmName());

    const events = await getEvents();
    expect(events).toHaveLength(1);
    expect(events[0]?.answer).toBe("unanswered");
    expect(countAskOverlayMessages(browser, 2)).toBe(1);
  });

  it("não pergunta de novo (nem mostra o overlay) para um domínio já confirmado com 'sim' nesta sessão", async () => {
    await handleActiveTabChanged({ tabId: 2, url: "https://youtube.com" });
    await handleAlertThresholdReached(await getScheduledAlarmName());
    const [firstEvent] = await getEvents();
    assertDefined(firstEvent);
    await answerDistraction(firstEvent.id, "yes");

    await handleActiveTabChanged({ tabId: 1, url: "https://example.com" });
    await handleActiveTabChanged({ tabId: 2, url: "https://youtube.com" });
    await handleAlertThresholdReached(await getScheduledAlarmName());

    const events = await getEvents();
    expect(events).toHaveLength(2);
    expect(events[1]?.answer).toBe("yes");
    expect(countAskOverlayMessages(browser, 2)).toBe(1);
  });

  it("é idempotente: chamar de novo com o mesmo alarme não cria um segundo evento", async () => {
    await handleActiveTabChanged({ tabId: 2, url: "https://youtube.com" });
    const alarmName = await getScheduledAlarmName();

    await handleAlertThresholdReached(alarmName);
    await handleAlertThresholdReached(alarmName);

    expect(await getEvents()).toHaveLength(1);
  });

  it("com notificações desativadas, cria o evento mas não mostra o overlay", async () => {
    await settingsRepository.set({ notificationsEnabled: false, minAlertSeconds: 5 });
    await handleActiveTabChanged({ tabId: 2, url: "https://youtube.com" });

    await handleAlertThresholdReached(await getScheduledAlarmName());

    const events = await getEvents();
    expect(events).toHaveLength(1);
    expect(events[0]?.answer).toBe("unanswered");
    expect(countAskOverlayMessages(browser, 2)).toBe(0);
  });
});

describe("answerDistraction", () => {
  let browser: ReturnType<typeof installFakeChromeBrowser>;

  beforeEach(async () => {
    browser = installBrowser();
    await startSession("Estudar TypeScript");
  });

  it("retorna erro para um eventId desconhecido", async () => {
    const result = await answerDistraction("evento-inexistente", "yes");

    expect(result.ok).toBe(false);
  });

  it("atualiza a resposta do evento e mostra o overlay de 'saiu do foco' quando a resposta é 'não'", async () => {
    await handleActiveTabChanged({ tabId: 2, url: "https://youtube.com" });
    await handleAlertThresholdReached(await getScheduledAlarmName());
    const [event] = await getEvents();
    assertDefined(event);

    const result = await answerDistraction(event.id, "no");

    expect(result.ok).toBe(true);
    const events = await getEvents();
    expect(events[0]?.answer).toBe("no");
    expect(browser.tabMessages.get(2)).toContainEqual({ type: "SHOW_LEFT_FOCUS_OVERLAY" });
  });
});

describe("returnToWork", () => {
  it("ativa a última aba produtiva quando ela ainda existe e ainda mostra o mesmo domínio", async () => {
    const browser = installBrowser();
    await startSession("Estudar TypeScript");
    await handleActiveTabChanged({ tabId: 1, url: "https://example.com" });

    await returnToWork();

    expect(browser.tabs.get(1)?.active).toBe(true);
  });

  it("cria uma nova aba quando a última aba produtiva não existe mais", async () => {
    const browser = installBrowser();
    await startSession("Estudar TypeScript");
    await handleActiveTabChanged({ tabId: 1, url: "https://example.com" });
    browser.tabs.delete(1);

    await returnToWork();

    expect(browser.tabs.size).toBe(2);
  });

  it("cria uma nova aba quando a aba produtiva foi reaproveitada para o domínio de distração", async () => {
    const browser = installBrowser();
    await startSession("Estudar TypeScript");
    await handleActiveTabChanged({ tabId: 1, url: "https://example.com" });
    const reusedTab = browser.tabs.get(1);
    assertDefined(reusedTab);
    reusedTab.url = "https://youtube.com";

    await returnToWork();

    expect(browser.tabs.size).toBe(3);
  });

  it("cria uma nova aba quando nunca houve uma aba produtiva registrada", async () => {
    installFakeChromeStorage();
    // A única aba ativa já é de distração desde antes da sessão começar, então ela vira
    // `currentVisit`, nunca `lastProductiveTab` (nem mesmo via a detecção automática da
    // aba ativa que `startSession` faz ao iniciar).
    const browser = installFakeChromeBrowser({
      tabs: [{ id: 1, url: "https://youtube.com", active: true, windowId: 1 }],
      windows: [{ id: 1, focused: true }],
    });
    await startSession("Estudar TypeScript");

    await returnToWork();

    expect(browser.tabs.size).toBe(2);
  });
});
