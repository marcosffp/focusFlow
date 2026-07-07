import { describe, expect, it } from "vitest";
import { formatDuration } from "./formatDuration";

describe("formatDuration", () => {
  it("formata segundos abaixo de um minuto como mm:ss", () => {
    expect(formatDuration(5)).toBe("00:05");
  });

  it("formata minutos e segundos", () => {
    expect(formatDuration(125)).toBe("02:05");
  });

  it("formata horas quando o total passa de 60 minutos", () => {
    expect(formatDuration(3661)).toBe("1:01:01");
  });

  it("nunca formata um valor negativo (trata como zero)", () => {
    expect(formatDuration(-5)).toBe("00:00");
  });

  it("arredonda para baixo segundos fracionados", () => {
    expect(formatDuration(59.9)).toBe("00:59");
  });
});
