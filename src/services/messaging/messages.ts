export type Message =
  | { type: "START_SESSION"; objective: string }
  | { type: "END_SESSION" }
  | { type: "DISMISS_REPORT" }
  | { type: "ANSWER_DISTRACTION"; eventId: string; answer: "yes" | "no" }
  | { type: "RETURN_TO_WORK" };
