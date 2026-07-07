import type { DistractionAnswer, TimeClassificationResult } from "@domain/types";

export function classifyDomainTime(input: {
  isDistractionDomain: boolean;
  answer: DistractionAnswer;
  visitDurationSeconds: number;
  minAlertSeconds: number;
  isVisitOngoing: boolean;
}): TimeClassificationResult {
  if (!input.isDistractionDomain) {
    return "focused";
  }
  if (input.answer === "yes") {
    return "focused";
  }
  if (input.answer === "no") {
    return "distracted";
  }

  const alertThresholdReached = input.visitDurationSeconds >= input.minAlertSeconds;
  if (!alertThresholdReached) {
    return input.isVisitOngoing ? "neutral" : "focused";
  }
  return input.isVisitOngoing ? "neutral" : "distracted";
}
