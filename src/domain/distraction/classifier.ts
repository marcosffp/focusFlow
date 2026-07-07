export type ClassifierDecision = "distraction" | "not-distraction" | "ask-user";

export interface DistractionClassifier {
  classify(input: { domain: string; url: string; title?: string }): Promise<ClassifierDecision>;
}
