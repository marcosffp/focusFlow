import { describe, expect, it } from "vitest";
import type { DistractionEvent, Session } from "@domain/types";
import { calculateElapsedTime, computeSessionReport } from "./sessionMetrics";

const MIN_ALERT_SECONDS = 5;

function makeSession(distractionEvents: readonly DistractionEvent[]): Session {
  return {
    id: "s1",
    objective: { text: "Estudar TypeScript", createdAt: 0 },
    startedAt: 0,
    endedAt: null,
    status: "active",
    distractionEvents,
  };
}

function makeEvent(overrides: Partial<DistractionEvent>): DistractionEvent {
  return {
    id: "e1",
    domain: "youtube.com",
    enteredAt: 0,
    leftAt: null,
    answer: "unanswered",
    ...overrides,
  };
}

describe("calculateElapsedTime", () => {
  it("conta o tempo total como now - startedAt, sem descontar nada, quando não há eventos", () => {
    const session = makeSession([]);

    const result = calculateElapsedTime(session, 10_000, MIN_ALERT_SECONDS);

    expect(result).toEqual({ totalSeconds: 10, focusedSeconds: 10, distractedSeconds: 0 });
  });

  it("conta um evento respondido 'sim' inteiramente como focado", () => {
    const session = makeSession([makeEvent({ enteredAt: 1_000, leftAt: 6_000, answer: "yes" })]);

    const result = calculateElapsedTime(session, 10_000, MIN_ALERT_SECONDS);

    expect(result.distractedSeconds).toBe(0);
    expect(result.focusedSeconds).toBe(10);
  });

  it("conta um evento respondido 'não' inteiramente como distraído", () => {
    const session = makeSession([makeEvent({ enteredAt: 1_000, leftAt: 6_000, answer: "no" })]);

    const result = calculateElapsedTime(session, 10_000, MIN_ALERT_SECONDS);

    expect(result.distractedSeconds).toBe(5);
    expect(result.focusedSeconds).toBe(5);
  });

  it("conta um evento 'unanswered' já encerrado como distraído", () => {
    const session = makeSession([
      makeEvent({ enteredAt: 1_000, leftAt: 6_000, answer: "unanswered" }),
    ]);

    const result = calculateElapsedTime(session, 10_000, MIN_ALERT_SECONDS);

    expect(result.distractedSeconds).toBe(5);
  });

  it("conta um evento 'unanswered' ainda em andamento como focado (neutro, ainda não penaliza)", () => {
    const session = makeSession([
      makeEvent({ enteredAt: 1_000, leftAt: null, answer: "unanswered" }),
    ]);

    const result = calculateElapsedTime(session, 10_000, MIN_ALERT_SECONDS);

    expect(result.distractedSeconds).toBe(0);
    expect(result.focusedSeconds).toBe(10);
  });

  it("soma múltiplos eventos distraídos corretamente", () => {
    const session = makeSession([
      makeEvent({ id: "e1", enteredAt: 0, leftAt: 5_000, answer: "no" }),
      makeEvent({ id: "e2", enteredAt: 5_000, leftAt: 8_000, answer: "no" }),
    ]);

    const result = calculateElapsedTime(session, 10_000, MIN_ALERT_SECONDS);

    expect(result.distractedSeconds).toBe(8);
    expect(result.focusedSeconds).toBe(2);
  });
});

describe("computeSessionReport", () => {
  it("retorna pontuação máxima e zero distrações para uma sessão sem eventos", () => {
    const session = makeSession([]);

    const report = computeSessionReport(session, {
      endedAt: 10_000,
      minAlertSeconds: MIN_ALERT_SECONDS,
    });

    expect(report).toEqual({
      totalSeconds: 10,
      focusedSeconds: 10,
      distractedSeconds: 0,
      confirmedDistractionCount: 0,
      topDomains: [],
      score: 100,
    });
  });

  it("conta distração confirmada ('não') no total distraído, na contagem e na pontuação", () => {
    const session = makeSession([
      makeEvent({ domain: "youtube.com", enteredAt: 0, leftAt: 60_000, answer: "no" }),
    ]);

    const report = computeSessionReport(session, {
      endedAt: 60_000,
      minAlertSeconds: MIN_ALERT_SECONDS,
    });

    expect(report.distractedSeconds).toBe(60);
    expect(report.confirmedDistractionCount).toBe(1);
    // -5 (distração confirmada) - 1 (1 minuto distraído) = 94
    expect(report.score).toBe(94);
    expect(report.topDomains).toEqual([{ domain: "youtube.com", seconds: 60 }]);
  });

  it("não conta 'unanswered' encerrado como distração confirmada, mas penaliza o tempo", () => {
    const session = makeSession([
      makeEvent({ domain: "reddit.com", enteredAt: 0, leftAt: 30_000, answer: "unanswered" }),
    ]);

    const report = computeSessionReport(session, {
      endedAt: 30_000,
      minAlertSeconds: MIN_ALERT_SECONDS,
    });

    expect(report.confirmedDistractionCount).toBe(0);
    expect(report.distractedSeconds).toBe(30);
    expect(report.score).toBe(99.5);
  });

  it("fecha uma visita ainda aberta (leftAt null) usando o endedAt da sessão", () => {
    const session = makeSession([
      makeEvent({ domain: "youtube.com", enteredAt: 5_000, leftAt: null, answer: "no" }),
    ]);

    const report = computeSessionReport(session, {
      endedAt: 15_000,
      minAlertSeconds: MIN_ALERT_SECONDS,
    });

    expect(report.distractedSeconds).toBe(10);
    expect(report.topDomains).toEqual([{ domain: "youtube.com", seconds: 10 }]);
  });

  it("soma o tempo de múltiplas visitas ao mesmo domínio para o ranking de mais acessados", () => {
    const session = makeSession([
      makeEvent({ id: "e1", domain: "youtube.com", enteredAt: 0, leftAt: 5_000, answer: "yes" }),
      makeEvent({
        id: "e2",
        domain: "youtube.com",
        enteredAt: 5_000,
        leftAt: 8_000,
        answer: "no",
      }),
      makeEvent({ id: "e3", domain: "reddit.com", enteredAt: 8_000, leftAt: 9_000, answer: "no" }),
    ]);

    const report = computeSessionReport(session, {
      endedAt: 9_000,
      minAlertSeconds: MIN_ALERT_SECONDS,
    });

    expect(report.topDomains).toEqual([
      { domain: "youtube.com", seconds: 8 },
      { domain: "reddit.com", seconds: 1 },
    ]);
  });

  it("nunca deixa a pontuação ficar negativa mesmo com muitas distrações", () => {
    const session = makeSession(
      Array.from({ length: 30 }, (_, index) =>
        makeEvent({
          id: `e${index}`,
          domain: "youtube.com",
          enteredAt: index * 1_000,
          leftAt: index * 1_000 + 1_000,
          answer: "no",
        }),
      ),
    );

    const report = computeSessionReport(session, { endedAt: 30_000, minAlertSeconds: 5 });

    expect(report.score).toBe(0);
  });
});
