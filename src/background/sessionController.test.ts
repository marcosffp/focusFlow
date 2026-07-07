import { beforeEach, describe, expect, it } from "vitest";
import { installFakeChromeStorage } from "../../tests/mocks/chromeStorage";
import { installFakeChromeBrowser } from "../../tests/mocks/chromeTabs";
import { sessionRepository } from "@services/storage/sessionRepository";
import { historyRepository } from "@services/storage/historyRepository";
import { startSession, endSession, dismissReport } from "./sessionController";

beforeEach(() => {
  installFakeChromeStorage();
  installFakeChromeBrowser({});
});

describe("startSession", () => {
  it("rejeita objetivo vazio", async () => {
    const result = await startSession("   ");

    expect(result).toEqual({ ok: false, reason: expect.any(String) });
    expect(await sessionRepository.get()).toEqual({ status: "idle" });
  });

  it("rejeita objetivo maior que o limite máximo", async () => {
    const result = await startSession("a".repeat(141));

    expect(result.ok).toBe(false);
  });

  it("cria e persiste uma sessão ativa com objetivo válido", async () => {
    const result = await startSession("  Estudar TypeScript  ");

    expect(result.ok).toBe(true);
    const state = await sessionRepository.get();
    expect(state.status).toBe("active");
    if (state.status === "active") {
      expect(state.session.objective.text).toBe("Estudar TypeScript");
      expect(state.session.status).toBe("active");
    }
  });

  it("rejeita iniciar uma segunda sessão enquanto uma já está ativa", async () => {
    await startSession("primeira sessão");

    const result = await startSession("segunda sessão");

    expect(result.ok).toBe(false);
  });
});

describe("endSession", () => {
  it("rejeita finalizar quando não há sessão ativa", async () => {
    const result = await endSession();

    expect(result.ok).toBe(false);
  });

  it("finaliza a sessão ativa e move o estado para finished com o report", async () => {
    await startSession("Estudar TypeScript");

    const result = await endSession();

    expect(result.ok).toBe(true);
    const state = await sessionRepository.get();
    expect(state.status).toBe("finished");
    if (state.status === "finished") {
      expect(state.session.status).toBe("finished");
      expect(state.report.score).toBe(100);
    }
  });

  it("persiste a sessão finalizada no histórico", async () => {
    await startSession("Estudar TypeScript");

    await endSession();

    const history = await historyRepository.get();
    expect(history).toHaveLength(1);
    expect(history[0]?.session.objective.text).toBe("Estudar TypeScript");
    expect(history[0]?.report.score).toBe(100);
  });
});

describe("dismissReport", () => {
  it("rejeita dispensar quando não há relatório (sessão idle)", async () => {
    const result = await dismissReport();

    expect(result.ok).toBe(false);
  });

  it("move o estado de finished para idle", async () => {
    await startSession("Estudar TypeScript");
    await endSession();

    const result = await dismissReport();

    expect(result.ok).toBe(true);
    expect(await sessionRepository.get()).toEqual({ status: "idle" });
  });
});
