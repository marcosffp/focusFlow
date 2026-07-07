import { beforeEach, describe, expect, it } from "vitest";
import { installFakeChromeStorage } from "../../../tests/mocks/chromeStorage";
import {
  DEFAULT_DISTRACTION_DOMAINS,
  distractionSiteRepository,
} from "./distractionSiteRepository";

beforeEach(() => {
  installFakeChromeStorage();
});

describe("distractionSiteRepository", () => {
  it("retorna a lista default dos 10 domínios de distração na primeira execução", async () => {
    const sites = await distractionSiteRepository.get();

    expect(sites).toHaveLength(10);
    expect(sites.map((site) => site.domain)).toEqual([...DEFAULT_DISTRACTION_DOMAINS]);
    expect(sites.every((site) => site.isActive)).toBe(true);
  });

  it("persiste a lista depois de adicionar um domínio", async () => {
    const current = await distractionSiteRepository.get();

    await distractionSiteRepository.set([...current, { domain: "example.com", isActive: true }]);

    const updated = await distractionSiteRepository.get();
    expect(updated).toHaveLength(11);
    expect(updated.at(-1)).toEqual({ domain: "example.com", isActive: true });
  });
});
