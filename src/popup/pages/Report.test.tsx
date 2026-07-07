// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { Session, SessionReport } from "@domain/types";
import Report from "./Report";

const dismissReportMock = vi.fn(() => Promise.resolve({ ok: true as const, value: undefined }));

const session: Session = {
  id: "s1",
  objective: { text: "Estudar TypeScript", createdAt: 0 },
  startedAt: 0,
  endedAt: 600_000,
  status: "finished",
  distractionEvents: [],
};

const report: SessionReport = {
  totalSeconds: 600,
  focusedSeconds: 540,
  distractedSeconds: 60,
  confirmedDistractionCount: 2,
  topDomains: [{ domain: "youtube.com", seconds: 60 }],
  score: 89,
};

afterEach(() => {
  cleanup();
  dismissReportMock.mockClear();
});

describe("Report", () => {
  it("exibe o objetivo e a pontuação final da sessão", () => {
    render(<Report session={session} report={report} dismissReport={dismissReportMock} />);

    expect(screen.getByText("Estudar TypeScript")).toBeInTheDocument();
    expect(screen.getByText("89")).toBeInTheDocument();
  });

  it("exibe a quantidade de distrações confirmadas e os sites mais acessados", () => {
    render(<Report session={session} report={report} dismissReport={dismissReportMock} />);

    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("youtube.com")).toBeInTheDocument();
  });

  it("exibe mensagem apropriada quando não há sites de distração acessados", () => {
    render(
      <Report
        session={session}
        report={{ ...report, topDomains: [] }}
        dismissReport={dismissReportMock}
      />,
    );

    expect(screen.getByText("Nenhum site de distração acessado.")).toBeInTheDocument();
  });

  it("dispara dismissReport ao clicar em Nova sessão", () => {
    render(<Report session={session} report={report} dismissReport={dismissReportMock} />);

    fireEvent.click(screen.getByRole("button", { name: "Nova sessão" }));

    expect(dismissReportMock).toHaveBeenCalled();
  });
});
