// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook } from "@testing-library/react";

let onChangeCallback: ((state: unknown) => void) | null = null;
let resolveGet: ((state: unknown) => void) | null = null;

vi.mock("@services/storage/sessionRepository", () => ({
  sessionRepository: {
    get: vi.fn(
      () =>
        new Promise((resolve) => {
          resolveGet = resolve;
        }),
    ),
    onChange: vi.fn((callback: (state: unknown) => void) => {
      onChangeCallback = callback;
      return (): void => {
        onChangeCallback = null;
      };
    }),
  },
}));

import { useSessionState } from "./useSessionState";

afterEach(() => {
  cleanup();
  onChangeCallback = null;
  resolveGet = null;
  vi.clearAllMocks();
});

describe("useSessionState", () => {
  it("não deixa uma leitura inicial atrasada sobrescrever uma mudança mais recente vinda de onChange", async () => {
    const { result } = renderHook(() => useSessionState());

    expect(onChangeCallback).not.toBeNull();
    onChangeCallback?.({ status: "active" });

    resolveGet?.({ status: "idle" });
    await Promise.resolve();
    await Promise.resolve();

    expect(result.current.state).toEqual({ status: "active" });
  });
});
