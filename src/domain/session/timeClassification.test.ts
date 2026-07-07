import { describe, expect, it } from "vitest";
import { classifyDomainTime } from "./timeClassification";

const base = {
  isDistractionDomain: true,
  answer: "unanswered" as const,
  visitDurationSeconds: 0,
  minAlertSeconds: 5,
  isVisitOngoing: false,
};

describe("classifyDomainTime", () => {
  it("classifica como focado quando o domínio não está na lista de distração", () => {
    expect(classifyDomainTime({ ...base, isDistractionDomain: false, answer: "no" })).toBe(
      "focused",
    );
  });

  it("classifica como focado quando a resposta é sim", () => {
    expect(classifyDomainTime({ ...base, answer: "yes", visitDurationSeconds: 120 })).toBe(
      "focused",
    );
  });

  it("classifica como distraído quando a resposta é não", () => {
    expect(classifyDomainTime({ ...base, answer: "no", visitDurationSeconds: 120 })).toBe(
      "distracted",
    );
  });

  it("classifica distração de 0 segundos sem resposta como focado (passagem rápida)", () => {
    expect(classifyDomainTime({ ...base, visitDurationSeconds: 0 })).toBe("focused");
  });

  it("classifica como focado quando a visita termina antes do tempo mínimo de alerta", () => {
    expect(classifyDomainTime({ ...base, visitDurationSeconds: 4, isVisitOngoing: false })).toBe(
      "focused",
    );
  });

  it("classifica como neutro quando a visita ainda está em andamento e não atingiu o tempo mínimo", () => {
    expect(classifyDomainTime({ ...base, visitDurationSeconds: 4, isVisitOngoing: true })).toBe(
      "neutral",
    );
  });

  it("classifica como neutro quando o alerta está pendente de resposta e a visita ainda está em andamento", () => {
    expect(classifyDomainTime({ ...base, visitDurationSeconds: 10, isVisitOngoing: true })).toBe(
      "neutral",
    );
  });

  it("classifica como distraído quando o tempo mínimo foi atingido e a visita termina sem resposta", () => {
    expect(classifyDomainTime({ ...base, visitDurationSeconds: 10, isVisitOngoing: false })).toBe(
      "distracted",
    );
  });

  it("considera o tempo mínimo atingido exatamente no limite", () => {
    expect(classifyDomainTime({ ...base, visitDurationSeconds: 5, isVisitOngoing: false })).toBe(
      "distracted",
    );
  });
});
