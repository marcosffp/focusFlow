export const MAX_OBJECTIVE_LENGTH = 140;

export interface Objective {
  readonly text: string;
  readonly createdAt: number;
}

export type DistractionAnswer = "yes" | "no" | "unanswered";

export type TimeClassificationResult = "focused" | "distracted" | "neutral";

export interface DistractionEvent {
  readonly id: string;
  readonly domain: string;
  readonly enteredAt: number;
  readonly leftAt: number | null;
  readonly answer: DistractionAnswer;
}

export type SessionStatus = "idle" | "active" | "finished";

export interface Session {
  readonly id: string;
  readonly objective: Objective;
  readonly startedAt: number;
  readonly endedAt: number | null;
  readonly status: SessionStatus;
  readonly distractionEvents: readonly DistractionEvent[];
}

export interface Settings {
  readonly notificationsEnabled: boolean;
  readonly minAlertSeconds: number;
}

export interface DistractionSite {
  readonly domain: string;
  readonly isActive: boolean;
}

export interface DomainTimeBreakdown {
  readonly domain: string;
  readonly seconds: number;
}

export interface SessionReport {
  readonly totalSeconds: number;
  readonly focusedSeconds: number;
  readonly distractedSeconds: number;
  readonly confirmedDistractionCount: number;
  readonly topDomains: readonly DomainTimeBreakdown[];
  readonly score: number;
}

export interface HistoryEntry {
  readonly session: Session;
  readonly report: SessionReport;
}
