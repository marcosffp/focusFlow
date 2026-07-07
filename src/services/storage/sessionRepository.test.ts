import { beforeEach, describe, expect, it } from "vitest";
import { installFakeChromeStorage } from "../../../tests/mocks/chromeStorage";
import { sessionRepository } from "./sessionRepository";

beforeEach(() => {
  installFakeChromeStorage();
});

describe("sessionRepository", () => {
  it("retorna estado idle na primeira execução (storage vazio)", async () => {
    expect(await sessionRepository.get()).toEqual({ status: "idle" });
  });

  it("persiste e recupera uma sessão ativa", async () => {
    const activeState = {
      status: "active" as const,
      session: {
        id: "s1",
        objective: { text: "Estudar TypeScript", createdAt: 1_000 },
        startedAt: 1_000,
        endedAt: null,
        status: "active" as const,
        distractionEvents: [],
      },
    };

    await sessionRepository.set(activeState);

    expect(await sessionRepository.get()).toEqual(activeState);
  });
});
