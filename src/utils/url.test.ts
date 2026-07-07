import { describe, expect, it } from "vitest";
import { extractHostname } from "./url";

describe("extractHostname", () => {
  it("extrai o hostname de uma URL http", () => {
    expect(extractHostname("https://www.youtube.com/watch?v=1")).toBe("www.youtube.com");
  });

  it("normaliza para minúsculas", () => {
    expect(extractHostname("https://YouTube.com")).toBe("youtube.com");
  });

  it("retorna null para chrome://", () => {
    expect(extractHostname("chrome://extensions")).toBeNull();
  });

  it("retorna null para about:blank", () => {
    expect(extractHostname("about:blank")).toBeNull();
  });

  it("retorna null para uma URL inválida", () => {
    expect(extractHostname("não é uma url")).toBeNull();
  });
});
