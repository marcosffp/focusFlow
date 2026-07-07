import { describe, expect, it } from "vitest";
import { calculateFocusScore } from "./scoring";

describe("calculateFocusScore", () => {
  it("retorna 100 quando não há distrações", () => {
    expect(calculateFocusScore({ confirmedDistractionCount: 0, distractedSeconds: 0 })).toBe(100);
  });

  it("desconta 5 pontos por distração confirmada", () => {
    expect(calculateFocusScore({ confirmedDistractionCount: 2, distractedSeconds: 0 })).toBe(90);
  });

  it("desconta 1 ponto por minuto distraído", () => {
    expect(calculateFocusScore({ confirmedDistractionCount: 0, distractedSeconds: 300 })).toBe(95);
  });

  it("fraciona o desconto proporcionalmente para minutos parciais", () => {
    expect(calculateFocusScore({ confirmedDistractionCount: 0, distractedSeconds: 30 })).toBe(99.5);
  });

  it("nunca fica negativa, mesmo com muitas distrações", () => {
    expect(
      calculateFocusScore({ confirmedDistractionCount: 100, distractedSeconds: 100_000 }),
    ).toBe(0);
  });
});
