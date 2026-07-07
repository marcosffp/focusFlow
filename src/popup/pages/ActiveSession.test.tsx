// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { Session } from "@domain/types";

vi.mock("@popup/hooks/useSettings", () => ({
  useSettings: (): { settings: { notificationsEnabled: boolean; minAlertSeconds: number } } => ({
    settings: { notificationsEnabled: true, minAlertSeconds: 5 },
  }),
}));

import ActiveSession from "./ActiveSession";

const endSessionMock = vi.fn(() => Promise.resolve({ ok: true as const, value: undefined }));

const session: Session = {
  id: "s1",
  objective: { text: "Estudar TypeScript", createdAt: 0 },
  startedAt: 0,
  endedAt: null,
  status: "active",
  distractionEvents: [],
};

afterEach(() => {
  cleanup();
  endSessionMock.mockClear();
});

describe("ActiveSession", () => {
  it("exibe o objetivo da sessão atual", () => {
    render(<ActiveSession session={session} endSession={endSessionMock} />);

    expect(screen.getByText("Estudar TypeScript")).toBeInTheDocument();
  });

  it("exibe o tempo total e o tempo focado calculados a partir da sessão", () => {
    render(<ActiveSession session={session} endSession={endSessionMock} />);

    expect(screen.getByText("Tempo total")).toBeInTheDocument();
    expect(screen.getByText("Tempo focado")).toBeInTheDocument();
  });

  it("dispara endSession ao clicar em Finalizar sessão", () => {
    render(<ActiveSession session={session} endSession={endSessionMock} />);

    fireEvent.click(screen.getByRole("button", { name: "Finalizar sessão" }));

    expect(endSessionMock).toHaveBeenCalled();
  });
});
