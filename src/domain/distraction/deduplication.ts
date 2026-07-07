import type { DistractionEvent } from "@domain/types";

export function hasConfirmedDomain(events: readonly DistractionEvent[], domain: string): boolean {
  const normalizedDomain = domain.toLowerCase();
  return events.some(
    (event) => event.domain.toLowerCase() === normalizedDomain && event.answer === "yes",
  );
}
