// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { installFakeChromeStorage } from "../../../tests/mocks/chromeStorage";
import { createChromeStorageRepository } from "@services/storage/repository";
import { useRepositoryState } from "./useRepositoryState";

describe("useRepositoryState", () => {
  it("carrega o valor default quando o storage está vazio", async () => {
    installFakeChromeStorage();
    const repository = createChromeStorageRepository({
      storageKey: "test-key",
      defaultValue: { count: 0 },
    });

    const { result } = renderHook(() => useRepositoryState(repository));

    await waitFor(() => {
      expect(result.current).toEqual({ count: 0 });
    });
  });

  it("reflete mudanças persistidas via onChange", async () => {
    installFakeChromeStorage();
    const repository = createChromeStorageRepository({
      storageKey: "test-key",
      defaultValue: { count: 0 },
    });
    const { result } = renderHook(() => useRepositoryState(repository));
    await waitFor(() => expect(result.current).toEqual({ count: 0 }));

    await repository.set({ count: 5 });

    await waitFor(() => {
      expect(result.current).toEqual({ count: 5 });
    });
  });
});
