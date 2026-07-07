// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { DistractionSite, Settings as SettingsType } from "@domain/types";
import Settings from "./Settings";

const onBackMock = vi.fn();
const updateSettingsMock = vi.fn(() => Promise.resolve());
const addSiteMock = vi.fn(() => Promise.resolve());
const removeSiteMock = vi.fn(() => Promise.resolve());

const settings: SettingsType = { notificationsEnabled: true, minAlertSeconds: 5 };
const sites: readonly DistractionSite[] = [
  { domain: "youtube.com", isActive: true },
  { domain: "reddit.com", isActive: true },
];

afterEach(() => {
  cleanup();
  onBackMock.mockClear();
  updateSettingsMock.mockClear();
  addSiteMock.mockClear();
  removeSiteMock.mockClear();
});

function renderSettings(
  overrides: Partial<{ settings: SettingsType; sites: readonly DistractionSite[] }> = {},
): void {
  render(
    <Settings
      settings={overrides.settings ?? settings}
      sites={overrides.sites ?? sites}
      onBack={onBackMock}
      updateSettings={updateSettingsMock}
      addSite={addSiteMock}
      removeSite={removeSiteMock}
    />,
  );
}

describe("Settings", () => {
  it("lista os domínios de distração cadastrados", () => {
    renderSettings();

    expect(screen.getByText("youtube.com")).toBeInTheDocument();
    expect(screen.getByText("reddit.com")).toBeInTheDocument();
  });

  it("dispara addSite com o domínio digitado ao clicar em Adicionar", () => {
    renderSettings();

    fireEvent.change(screen.getByPlaceholderText("ex.: pinterest.com"), {
      target: { value: "pinterest.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(addSiteMock).toHaveBeenCalledWith("pinterest.com");
  });

  it("dispara removeSite com o domínio ao clicar em Remover", () => {
    renderSettings();

    const [firstRemoveButton] = screen.getAllByRole("button", { name: "Remover" });
    fireEvent.click(firstRemoveButton as HTMLElement);

    expect(removeSiteMock).toHaveBeenCalledWith("youtube.com");
  });

  it("dispara updateSettings ao alternar o toggle de notificações", () => {
    renderSettings();

    fireEvent.click(screen.getByRole("checkbox"));

    expect(updateSettingsMock).toHaveBeenCalledWith({ notificationsEnabled: false });
  });

  it("dispara updateSettings com o tempo mínimo de alerta ajustado", () => {
    renderSettings();

    fireEvent.change(screen.getByLabelText("Tempo mínimo para alerta (segundos)"), {
      target: { value: "10" },
    });

    expect(updateSettingsMock).toHaveBeenCalledWith({ minAlertSeconds: 10 });
  });

  it("dispara onBack ao clicar em Voltar", () => {
    renderSettings();

    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));

    expect(onBackMock).toHaveBeenCalled();
  });
});
