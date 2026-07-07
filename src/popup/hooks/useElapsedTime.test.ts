// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import type { Session } from "@domain/types";

vi.mock("@popup/hooks/useSettings", () => ({
  useSettings: (): { settings: { notificationsEnabled: boolean; minAlertSeconds: number } } => ({
    settings: { notificationsEnabled: true, minAlertSeconds: 5 },
  }),
}));

import { useElapsedTime } from "./useElapsedTime";

const session: Session = {
  id: "s1",
  objective: { text: "Estudar TypeScript", createdAt: 0 },
  startedAt: 0,
  endedAt: null,
  status: "active",
  distractionEvents: [],
};

describe("useElapsedTime", () => {
  it("calcula tempo total e focado a partir da sessão e das configurações carregadas", () => {
    const { result } = renderHook(() => useElapsedTime(session));

    expect(result.current.totalSeconds).toBeGreaterThanOrEqual(0);
    expect(result.current.focusedSeconds).toBe(result.current.totalSeconds);
    expect(result.current.distractedSeconds).toBe(0);
  });
});
