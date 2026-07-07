// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { installFakeChromeStorage } from "../../../tests/mocks/chromeStorage";
import { useDistractionSites } from "./useDistractionSites";

describe("useDistractionSites", () => {
  it("carrega a lista default de domínios de distração", async () => {
    installFakeChromeStorage();

    const { result } = renderHook(() => useDistractionSites());

    await waitFor(() => {
      expect(result.current.sites).not.toBeNull();
    });
    expect(result.current.sites?.length).toBe(10);
  });

  it("adiciona um novo domínio normalizado (trim + minúsculas)", async () => {
    installFakeChromeStorage();
    const { result } = renderHook(() => useDistractionSites());
    await waitFor(() => expect(result.current.sites).not.toBeNull());

    await result.current.addSite("  Pinterest.COM  ");

    await waitFor(() => {
      expect(result.current.sites?.some((site) => site.domain === "pinterest.com")).toBe(true);
    });
  });

  it("não duplica um domínio já existente na lista", async () => {
    installFakeChromeStorage();
    const { result } = renderHook(() => useDistractionSites());
    await waitFor(() => expect(result.current.sites).not.toBeNull());
    const initialLength = result.current.sites?.length ?? 0;

    await result.current.addSite("youtube.com");

    expect(result.current.sites?.length).toBe(initialLength);
  });

  it("ignora tentativa de adicionar domínio vazio", async () => {
    installFakeChromeStorage();
    const { result } = renderHook(() => useDistractionSites());
    await waitFor(() => expect(result.current.sites).not.toBeNull());
    const initialLength = result.current.sites?.length ?? 0;

    await result.current.addSite("   ");

    expect(result.current.sites?.length).toBe(initialLength);
  });

  it("remove um domínio da lista", async () => {
    installFakeChromeStorage();
    const { result } = renderHook(() => useDistractionSites());
    await waitFor(() => expect(result.current.sites).not.toBeNull());

    await result.current.removeSite("youtube.com");

    await waitFor(() => {
      expect(result.current.sites?.some((site) => site.domain === "youtube.com")).toBe(false);
    });
  });
});
