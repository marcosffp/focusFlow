// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { installFakeChromeStorage } from "../../../tests/mocks/chromeStorage";
import { useSettings } from "./useSettings";

describe("useSettings", () => {
  it("carrega os valores default de settings quando o storage está vazio", async () => {
    installFakeChromeStorage();

    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.settings).not.toBeNull();
    });

    expect(result.current.settings).toEqual({
      notificationsEnabled: true,
      minAlertSeconds: 5,
    });
  });

  it("atualiza parcialmente as settings preservando os demais campos", async () => {
    installFakeChromeStorage();

    const { result } = renderHook(() => useSettings());
    await waitFor(() => {
      expect(result.current.settings).not.toBeNull();
    });

    await result.current.updateSettings({ minAlertSeconds: 10 });

    await waitFor(() => {
      expect(result.current.settings).toEqual({
        notificationsEnabled: true,
        minAlertSeconds: 10,
      });
    });
  });
});
