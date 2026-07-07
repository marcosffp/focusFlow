import type { Result } from "@shared-types/index";
import type { Objective, Session, SessionReport } from "@domain/types";
import { computeSessionReport } from "@domain/session/sessionMetrics";

export type SessionMachineState =
  | { status: "idle" }
  | { status: "active"; session: Session }
  | { status: "finished"; session: Session; report: SessionReport };

export type FinishedSessionState = Extract<SessionMachineState, { status: "finished" }>;

export function startSession(
  state: SessionMachineState,
  input: { sessionId: string; objective: Objective; startedAt: number },
): Result<SessionMachineState> {
  if (state.status !== "idle") {
    return { ok: false, reason: "só é possível iniciar uma sessão a partir do estado idle" };
  }
  const session: Session = {
    id: input.sessionId,
    objective: input.objective,
    startedAt: input.startedAt,
    endedAt: null,
    status: "active",
    distractionEvents: [],
  };
  return { ok: true, value: { status: "active", session } };
}

export function endSession(
  state: SessionMachineState,
  input: { endedAt: number; minAlertSeconds: number },
): Result<FinishedSessionState> {
  if (state.status !== "active") {
    return { ok: false, reason: "só é possível finalizar uma sessão a partir do estado active" };
  }
  const session: Session = { ...state.session, endedAt: input.endedAt, status: "finished" };
  const report = computeSessionReport(session, {
    endedAt: input.endedAt,
    minAlertSeconds: input.minAlertSeconds,
  });
  return { ok: true, value: { status: "finished", session, report } };
}

export function dismissReport(state: SessionMachineState): Result<SessionMachineState> {
  if (state.status !== "finished") {
    return {
      ok: false,
      reason: "só é possível dispensar o relatório a partir do estado finished",
    };
  }
  return { ok: true, value: { status: "idle" } };
}
