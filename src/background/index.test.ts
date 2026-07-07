import { describe, expect, it, vi } from "vitest";

type MessageListener = (
  message: unknown,
  sender: unknown,
  sendResponse: (response: unknown) => void,
) => boolean | undefined;

vi.mock("@background/messageRouter", () => ({
  routeMessage: vi.fn(() => {
    throw new Error("erro inesperado do domínio");
  }),
}));

vi.mock("@background/listeners", () => ({
  registerBackgroundListeners: vi.fn(),
}));

describe("background/index message listener", () => {
  it("nunca deixa uma exceção síncrona de routeMessage travar a resposta da mensagem", async () => {
    const captured: { listener: MessageListener | null } = { listener: null };
    globalThis.chrome = {
      runtime: {
        onMessage: {
          addListener: (listener: MessageListener) => {
            captured.listener = listener;
          },
        },
      },
    } as unknown as typeof chrome;

    await import("./index");

    expect(captured.listener).not.toBeNull();

    const sendResponse = vi.fn();
    captured.listener?.({ type: "START_SESSION", objective: "x" }, {}, sendResponse);

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalled();
    });

    expect(sendResponse).toHaveBeenCalledWith({ ok: false, reason: "erro inesperado do domínio" });
  });
});
