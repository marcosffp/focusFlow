// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { installFakeChromeStorage } from "../../../tests/mocks/chromeStorage";
import { historyRepository } from "@services/storage/historyRepository";
import type { HistoryEntry } from "@domain/types";
import { useHistory } from "./useHistory";

function makeEntry(overrides: { id: string; startedAt: number }): HistoryEntry {
  return {
    session: {
      id: overrides.id,
      objective: { text: `Objetivo ${overrides.id}`, createdAt: overrides.startedAt },
      startedAt: overrides.startedAt,
      endedAt: overrides.startedAt + 1_000,
      status: "finished",
      distractionEvents: [],
    },
    report: {
      totalSeconds: 1,
      focusedSeconds: 1,
      distractedSeconds: 0,
      confirmedDistractionCount: 0,
      topDomains: [],
      score: 100,
    },
  };
}

describe("useHistory", () => {
  it("retorna lista vazia quando não há sessões finalizadas", async () => {
    installFakeChromeStorage();

    const { result } = renderHook(() => useHistory());

    await waitFor(() => {
      expect(result.current.entries).not.toBeNull();
    });
    expect(result.current.entries).toEqual([]);
  });

  it("ordena as sessões da mais recente para a mais antiga", async () => {
    installFakeChromeStorage();
    await historyRepository.set([
      makeEntry({ id: "older", startedAt: 1_000 }),
      makeEntry({ id: "newer", startedAt: 5_000 }),
    ]);

    const { result } = renderHook(() => useHistory());

    await waitFor(() => {
      expect(result.current.entries).toHaveLength(2);
    });
    expect(result.current.entries?.map((entry) => entry.session.id)).toEqual(["newer", "older"]);
  });
});
