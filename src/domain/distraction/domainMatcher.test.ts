import { describe, expect, it } from "vitest";
import { isDistractionDomain } from "./domainMatcher";

const distractionSites = ["youtube.com", "reddit.com"];

describe("isDistractionDomain", () => {
  it("reconhece o domínio raiz exato", () => {
    expect(isDistractionDomain("youtube.com", distractionSites)).toBe(true);
  });

  it("reconhece subdomínios do domínio de distração", () => {
    expect(isDistractionDomain("m.youtube.com", distractionSites)).toBe(true);
    expect(isDistractionDomain("www.reddit.com", distractionSites)).toBe(true);
  });

  it("não reconhece domínios que apenas contêm o nome como substring", () => {
    expect(isDistractionDomain("notyoutube.com", distractionSites)).toBe(false);
    expect(isDistractionDomain("youtube.com.br", distractionSites)).toBe(false);
  });

  it("não reconhece domínios fora da lista", () => {
    expect(isDistractionDomain("github.com", distractionSites)).toBe(false);
  });

  it("ignora diferenças de maiúsculas/minúsculas", () => {
    expect(isDistractionDomain("YouTube.com", distractionSites)).toBe(true);
  });
});
