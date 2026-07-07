import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installFakeChromeStorage } from "../../tests/mocks/chromeStorage";
import { installFakeChromeBrowser } from "../../tests/mocks/chromeTabs";
import type { SessionMachineState } from "@domain/session/sessionMachine";
import type { CurrentVisit, SessionRuntimeState } from "@services/storage/sessionRuntimeRepository";

// Estes testes simulam o cenário de SOLUCAO.md 5.2.1: o Chrome fecha/crasha com uma
// sessão ativa e, ao reabrir, o service worker é recriado do zero. Usamos
// `vi.resetModules()` + `import()` dinâmico para forçar uma nova instância dos módulos
// (perdendo qualquer estado em memória, como a fila `serialized`), mantendo apenas o
// `chrome.storage.local` fake (que representa o disco, não a memória do worker) — é a
// forma mais fiel de provar que nada depende de estado em memória do service worker.
async function importFreshSessionController(): Promise<typeof import("./sessionController")> {
  vi.resetModules();
  return import("./sessionController");
}

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

function assertActiveSession(
  state: SessionMachineState,
): asserts state is Extract<SessionMachineState, { status: "active" }> {
  if (state.status !== "active") {
    throw new Error("sessão deveria estar ativa");
  }
}

function assertHasCurrentVisit(
  runtime: SessionRuntimeState,
): asserts runtime is SessionRuntimeState & { currentVisit: CurrentVisit } {
  if (runtime.currentVisit === null) {
    throw new Error("deveria haver uma visita em andamento");
  }
}

describe("continuidade após reinício do service worker (SOLUCAO.md 5.2.1)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("o tempo decorrido continua correto após o módulo ser recarregado do zero", async () => {
    installBrowser();
    const before = await importFreshSessionController();
    await before.startSession("Estudar TypeScript");

    const tenMinutesMs = 10 * 60 * 1000;
    vi.advanceTimersByTime(tenMinutesMs);

    // Simula o Chrome encerrando e recriando o service worker: nova instância dos
    // módulos, mesmo storage local.
    const after = await importFreshSessionController();
    const { sessionRepository } = await import("@services/storage/sessionRepository");
    const { calculateElapsedTime } = await import("@domain/session/sessionMetrics");

    const state = await sessionRepository.get();
    assertActiveSession(state);

    const elapsed = calculateElapsedTime(state.session, Date.now(), 5);
    expect(elapsed.totalSeconds).toBeCloseTo(tenMinutesMs / 1000, 0);

    // A nova instância do controller também consegue operar normalmente sobre o
    // mesmo estado persistido (ex.: finalizar a sessão).
    const endResult = await after.endSession();
    expect(endResult.ok).toBe(true);
  });

  it("uma visita de distração em andamento é retomada corretamente pela nova instância", async () => {
    const browser = installBrowser();
    const before = await importFreshSessionController();
    await before.startSession("Estudar TypeScript");
    await before.handleActiveTabChanged({ tabId: 2, url: "https://youtube.com" });

    const runtimeBefore = await (
      await import("@services/storage/sessionRuntimeRepository")
    ).sessionRuntimeRepository.get();
    assertHasCurrentVisit(runtimeBefore);
    const { alarmName } = runtimeBefore.currentVisit;
    // O alarme avulso (`when`) continua agendado no Chrome mesmo com o worker
    // reiniciado — quem muda é só a instância dos módulos JS.
    expect(browser.scheduledAlarms.has(alarmName)).toBe(true);

    vi.advanceTimersByTime(10_000);

    // Simula o Chrome recriando o service worker e entregando o alarme (que já
    // estava agendado antes do reinício) para a nova instância.
    const after = await importFreshSessionController();
    await after.handleAlertThresholdReached(alarmName);

    const sessionAfter = await (
      await import("@services/storage/sessionRepository")
    ).sessionRepository.get();
    assertActiveSession(sessionAfter);
    expect(sessionAfter.session.distractionEvents).toHaveLength(1);
    expect(sessionAfter.session.distractionEvents[0]?.answer).toBe("unanswered");
  });

  it("o heartbeat da nova instância continua funcionando como rede de segurança", async () => {
    installBrowser();
    const { settingsRepository } = await import("@services/storage/settingsRepository");
    await settingsRepository.set({ notificationsEnabled: true, minAlertSeconds: 5 });

    const before = await importFreshSessionController();
    await before.startSession("Estudar TypeScript");
    await before.handleActiveTabChanged({ tabId: 2, url: "https://youtube.com" });

    vi.advanceTimersByTime(6_000);

    const after = await importFreshSessionController();
    await after.handleHeartbeat();

    const sessionAfter = await (
      await import("@services/storage/sessionRepository")
    ).sessionRepository.get();
    assertActiveSession(sessionAfter);
    expect(sessionAfter.session.distractionEvents).toHaveLength(1);
  });
});

describe("múltiplas janelas do Chrome com troca de foco (SOLUCAO.md 5.3 e 14)", () => {
  // Diferente dos testes de listeners/tabs.test.ts e listeners/windows.test.ts (que
  // mockam sessionController para testar só o roteamento de eventos), aqui a integração
  // completa é exercitada: registerTabListeners + registerWindowListeners reais
  // conectados ao sessionController real, provando que a fiação entre as duas janelas
  // produz o resultado correto de ponta a ponta, não só por peça isolada.
  it("segue a aba ativa da janela com foco do SO e ignora trocas de aba em janela sem foco", async () => {
    installFakeChromeStorage();
    const browser = installFakeChromeBrowser({
      tabs: [
        { id: 1, url: "https://youtube.com", active: true, windowId: 1 },
        { id: 2, url: "https://example.com", active: true, windowId: 2 },
      ],
      windows: [
        { id: 1, focused: true },
        { id: 2, focused: false },
      ],
    });
    const { registerTabListeners } = await import("./listeners/tabs");
    const { registerWindowListeners } = await import("./listeners/windows");
    const { startSession, VISIT_ALERT_ALARM_PREFIX } = await import("./sessionController");
    const { sessionRuntimeRepository } = await import("@services/storage/sessionRuntimeRepository");
    const { sessionRepository } = await import("@services/storage/sessionRepository");
    registerTabListeners();
    registerWindowListeners();
    await startSession("Estudar TypeScript");

    // Janela 1 (com foco) ativa sua aba de distração.
    browser.fireTabActivated({ tabId: 1, windowId: 1 });
    await vi.waitFor(async () => {
      const runtime = await sessionRuntimeRepository.get();
      expect(runtime.currentVisit?.domain).toBe("youtube.com");
    });

    // O SO troca o foco para a janela 2 (produtiva) — a visita de distração da
    // janela 1 deve ser fechada mesmo sem o usuário ter respondido ao alerta.
    const window1 = browser.windows.get(1);
    const window2 = browser.windows.get(2);
    if (window1) window1.focused = false;
    if (window2) window2.focused = true;
    browser.fireWindowFocusChanged(2);
    await vi.waitFor(async () => {
      const runtime = await sessionRuntimeRepository.get();
      expect(runtime.lastProductiveTab).toEqual({ tabId: 2, domain: "example.com" });
    });
    let runtime = await sessionRuntimeRepository.get();
    expect(runtime.currentVisit).toBeNull();
    // Só o heartbeat periódico deve restar agendado; o alarme avulso da visita
    // encerrada precisa ter sido cancelado.
    const remainingVisitAlarms = Array.from(browser.scheduledAlarms.keys()).filter((name) =>
      name.startsWith(VISIT_ALERT_ALARM_PREFIX),
    );
    expect(remainingVisitAlarms).toHaveLength(0);

    // Uma troca de aba dentro da janela 1, que ficou em segundo plano, não deve
    // gerar rastreamento algum (SOLUCAO.md 5.3: só a janela com foco do SO conta).
    // É uma asserção negativa, então não há nada para `vi.waitFor` aguardar
    // (ela já seria verdadeira antes do handler rodar) — em vez de contar um
    // número fixo de flushes de microtask (frágil a mudanças na cadeia de
    // `await` de isWindowFocused), aguardamos um tempo real pequeno, garantindo
    // folga suficiente para qualquer profundidade de encadeamento assíncrono.
    browser.fireTabActivated({ tabId: 1, windowId: 1 });
    await new Promise((resolve) => setTimeout(resolve, 10));

    runtime = await sessionRuntimeRepository.get();
    expect(runtime.lastProductiveTab).toEqual({ tabId: 2, domain: "example.com" });

    const state = await sessionRepository.get();
    assertActiveSession(state);
    expect(state.session.distractionEvents).toHaveLength(0);
  });
});
