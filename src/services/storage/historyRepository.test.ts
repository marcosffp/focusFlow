import { beforeEach, describe, expect, it } from "vitest";
import { installFakeChromeStorage } from "../../../tests/mocks/chromeStorage";
import { historyRepository } from "./historyRepository";

beforeEach(() => {
  installFakeChromeStorage();
});

describe("historyRepository", () => {
  it("retorna lista vazia na primeira execução (storage vazio)", async () => {
    expect(await historyRepository.get()).toEqual([]);
  });

  it("persiste sessões finalizadas adicionadas ao histórico", async () => {
    const entry = {
      session: {
        id: "s1",
        objective: { text: "Estudar TypeScript", createdAt: 1_000 },
        startedAt: 1_000,
        endedAt: 5_000,
        status: "finished" as const,
        distractionEvents: [],
      },
      report: {
        totalSeconds: 4,
        focusedSeconds: 4,
        distractedSeconds: 0,
        confirmedDistractionCount: 0,
        topDomains: [],
        score: 100,
      },
    };

    await historyRepository.set([entry]);

    expect(await historyRepository.get()).toEqual([entry]);
  });
});
