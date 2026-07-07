import { describe, expect, it } from "vitest";
import {
  dismissReport,
  endSession,
  startSession,
  type SessionMachineState,
} from "./sessionMachine";

const idle: SessionMachineState = { status: "idle" };
const objective = { text: "Estudar TypeScript", createdAt: 1_000 };

describe("startSession", () => {
  it("transiciona de idle para active criando a sessão", () => {
    const result = startSession(idle, { sessionId: "s1", objective, startedAt: 1_000 });

    expect(result).toEqual({
      ok: true,
      value: {
        status: "active",
        session: {
          id: "s1",
          objective,
          startedAt: 1_000,
          endedAt: null,
          status: "active",
          distractionEvents: [],
        },
      },
    });
  });

  it("rejeita iniciar uma sessão quando já existe uma ativa", () => {
    const active: SessionMachineState = {
      status: "active",
      session: {
        id: "s1",
        objective,
        startedAt: 1_000,
        endedAt: null,
        status: "active",
        distractionEvents: [],
      },
    };

    const result = startSession(active, { sessionId: "s2", objective, startedAt: 2_000 });

    expect(result.ok).toBe(false);
  });
});

describe("endSession", () => {
  it("transiciona de active para finished preenchendo endedAt e calculando o report", () => {
    const active: SessionMachineState = {
      status: "active",
      session: {
        id: "s1",
        objective,
        startedAt: 1_000,
        endedAt: null,
        status: "active",
        distractionEvents: [],
      },
    };

    const result = endSession(active, { endedAt: 5_000, minAlertSeconds: 5 });

    expect(result).toEqual({
      ok: true,
      value: {
        status: "finished",
        session: {
          id: "s1",
          objective,
          startedAt: 1_000,
          endedAt: 5_000,
          status: "finished",
          distractionEvents: [],
        },
        report: {
          totalSeconds: 4,
          focusedSeconds: 4,
          distractedSeconds: 0,
          confirmedDistractionCount: 0,
          topDomains: [],
          score: 100,
        },
      },
    });
  });

  it("rejeita finalizar uma sessão a partir do estado idle", () => {
    const result = endSession(idle, { endedAt: 5_000, minAlertSeconds: 5 });

    expect(result.ok).toBe(false);
  });
});

describe("dismissReport", () => {
  it("transiciona de finished para idle", () => {
    const finished: SessionMachineState = {
      status: "finished",
      session: {
        id: "s1",
        objective,
        startedAt: 1_000,
        endedAt: 5_000,
        status: "finished",
        distractionEvents: [],
      },
      report: {
        totalSeconds: 4,
        focusedSeconds: 4,
        distractedSeconds: 0,
        confirmedDistractionCount: 0,
        topDomains: [],
        score: 100,
      },
    };

    expect(dismissReport(finished)).toEqual({ ok: true, value: { status: "idle" } });
  });

  it("rejeita dispensar relatório a partir do estado active", () => {
    const active: SessionMachineState = {
      status: "active",
      session: {
        id: "s1",
        objective,
        startedAt: 1_000,
        endedAt: null,
        status: "active",
        distractionEvents: [],
      },
    };

    expect(dismissReport(active).ok).toBe(false);
  });
});
