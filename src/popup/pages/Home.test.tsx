// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import Home from "./Home";

const startSessionMock = vi.fn(() => Promise.resolve({ ok: true as const, value: undefined }));
const onOpenHistoryMock = vi.fn();
const onOpenSettingsMock = vi.fn();

afterEach(() => {
  cleanup();
  startSessionMock.mockClear();
  onOpenHistoryMock.mockClear();
  onOpenSettingsMock.mockClear();
});

describe("Home", () => {
  it("desabilita o botão de iniciar sessão quando o objetivo está vazio", () => {
    render(
      <Home
        startSession={startSessionMock}
        onOpenHistory={onOpenHistoryMock}
        onOpenSettings={onOpenSettingsMock}
      />,
    );

    expect(screen.getByRole("button", { name: "Iniciar sessão" })).toBeDisabled();
  });

  it("desabilita o botão quando o objetivo contém só espaços em branco", () => {
    render(
      <Home
        startSession={startSessionMock}
        onOpenHistory={onOpenHistoryMock}
        onOpenSettings={onOpenSettingsMock}
      />,
    );

    fireEvent.change(screen.getByLabelText("Qual é o objetivo desta sessão?"), {
      target: { value: "   " },
    });

    expect(screen.getByRole("button", { name: "Iniciar sessão" })).toBeDisabled();
  });

  it("habilita o botão e dispara startSession com um objetivo válido", () => {
    render(
      <Home
        startSession={startSessionMock}
        onOpenHistory={onOpenHistoryMock}
        onOpenSettings={onOpenSettingsMock}
      />,
    );

    fireEvent.change(screen.getByLabelText("Qual é o objetivo desta sessão?"), {
      target: { value: "Estudar TypeScript" },
    });
    const button = screen.getByRole("button", { name: "Iniciar sessão" });
    expect(button).not.toBeDisabled();

    fireEvent.click(button);

    expect(startSessionMock).toHaveBeenCalledWith("Estudar TypeScript");
  });

  it("dispara onOpenHistory ao clicar em Histórico", () => {
    render(
      <Home
        startSession={startSessionMock}
        onOpenHistory={onOpenHistoryMock}
        onOpenSettings={onOpenSettingsMock}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Histórico" }));

    expect(onOpenHistoryMock).toHaveBeenCalled();
  });

  it("dispara onOpenSettings ao clicar em Configurações", () => {
    render(
      <Home
        startSession={startSessionMock}
        onOpenHistory={onOpenHistoryMock}
        onOpenSettings={onOpenSettingsMock}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Configurações" }));

    expect(onOpenSettingsMock).toHaveBeenCalled();
  });
});
