import { describe, expect, it, vi } from "vitest";

vi.mock("./sessionController", () => ({
  startSession: vi.fn(async () => ({ ok: true as const, value: undefined })),
  endSession: vi.fn(async () => ({ ok: true as const, value: undefined })),
  dismissReport: vi.fn(async () => ({ ok: true as const, value: undefined })),
  answerDistraction: vi.fn(async () => ({ ok: true as const, value: undefined })),
  returnToWork: vi.fn(async () => undefined),
}));

import {
  startSession,
  endSession,
  dismissReport,
  answerDistraction,
  returnToWork,
} from "./sessionController";
import { routeMessage } from "./messageRouter";

describe("routeMessage", () => {
  it("delega START_SESSION para sessionController.startSession com o objetivo", async () => {
    await routeMessage({ type: "START_SESSION", objective: "estudar" });

    expect(startSession).toHaveBeenCalledWith("estudar");
  });

  it("delega END_SESSION para sessionController.endSession", async () => {
    await routeMessage({ type: "END_SESSION" });

    expect(endSession).toHaveBeenCalled();
  });

  it("delega ANSWER_DISTRACTION para sessionController.answerDistraction com eventId e resposta", async () => {
    await routeMessage({ type: "ANSWER_DISTRACTION", eventId: "e1", answer: "no" });

    expect(answerDistraction).toHaveBeenCalledWith("e1", "no");
  });

  it("delega DISMISS_REPORT para sessionController.dismissReport", async () => {
    await routeMessage({ type: "DISMISS_REPORT" });

    expect(dismissReport).toHaveBeenCalled();
  });

  it("delega RETURN_TO_WORK para sessionController.returnToWork", async () => {
    const result = await routeMessage({ type: "RETURN_TO_WORK" });

    expect(returnToWork).toHaveBeenCalled();
    expect(result).toEqual({ ok: true, value: undefined });
  });
});
