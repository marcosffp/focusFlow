import { describe, expect, it } from "vitest";
import type { DistractionEvent } from "@domain/types";
import { hasConfirmedDomain } from "./deduplication";

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

describe("hasConfirmedDomain", () => {
  it("retorna false quando não há nenhum evento para o domínio", () => {
    expect(hasConfirmedDomain([], "youtube.com")).toBe(false);
  });

  it("retorna false quando o domínio só tem eventos sem resposta 'sim'", () => {
    const events = [makeEvent({ answer: "no" }), makeEvent({ answer: "unanswered" })];

    expect(hasConfirmedDomain(events, "youtube.com")).toBe(false);
  });

  it("retorna true quando existe um evento respondido 'sim' para o domínio", () => {
    const events = [makeEvent({ answer: "yes" })];

    expect(hasConfirmedDomain(events, "youtube.com")).toBe(true);
  });

  it("não considera resposta 'sim' de outro domínio", () => {
    const events = [makeEvent({ domain: "reddit.com", answer: "yes" })];

    expect(hasConfirmedDomain(events, "youtube.com")).toBe(false);
  });

  it("é case-insensitive na comparação de domínio", () => {
    const events = [makeEvent({ domain: "YouTube.com", answer: "yes" })];

    expect(hasConfirmedDomain(events, "youtube.com")).toBe(true);
  });
});
