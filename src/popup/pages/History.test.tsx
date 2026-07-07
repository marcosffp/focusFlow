// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { HistoryEntry } from "@domain/types";
import History from "./History";

const onBackMock = vi.fn();

const entries: readonly HistoryEntry[] = [
  {
    session: {
      id: "s1",
      objective: { text: "Estudar TypeScript", createdAt: 0 },
      startedAt: 0,
      endedAt: 600_000,
      status: "finished",
      distractionEvents: [],
    },
    report: {
      totalSeconds: 600,
      focusedSeconds: 540,
      distractedSeconds: 60,
      confirmedDistractionCount: 1,
      topDomains: [{ domain: "youtube.com", seconds: 60 }],
      score: 94,
    },
  },
];

afterEach(() => {
  cleanup();
  onBackMock.mockClear();
});

describe("History", () => {
  it("exibe mensagem quando não há sessões no histórico", () => {
    render(<History entries={[]} onBack={onBackMock} />);

    expect(screen.getByText("Nenhuma sessão finalizada ainda.")).toBeInTheDocument();
  });

  it("lista o objetivo e a pontuação de cada sessão finalizada", () => {
    render(<History entries={entries} onBack={onBackMock} />);

    expect(screen.getByText("Estudar TypeScript")).toBeInTheDocument();
    expect(screen.getByText(/pontuação 94/)).toBeInTheDocument();
  });

  it("expande os detalhes ao clicar em um item, mostrando os sites mais acessados", () => {
    render(<History entries={entries} onBack={onBackMock} />);

    expect(screen.queryByText("youtube.com")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("Estudar TypeScript"));

    expect(screen.getByText("youtube.com")).toBeInTheDocument();
  });

  it("dispara onBack ao clicar em Voltar", () => {
    render(<History entries={entries} onBack={onBackMock} />);

    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));

    expect(onBackMock).toHaveBeenCalled();
  });
});
