import type { ClassifierDecision, DistractionClassifier } from "@domain/distraction/classifier";
import { isDistractionDomain } from "@domain/distraction/domainMatcher";

export function createRuleBasedClassifier(
  distractionSites: readonly string[],
): DistractionClassifier {
  return {
    async classify(input): Promise<ClassifierDecision> {
      return isDistractionDomain(input.domain, distractionSites) ? "ask-user" : "not-distraction";
    },
  };
}
