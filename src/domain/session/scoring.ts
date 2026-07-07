export const STARTING_SCORE = 100;
export const MIN_SCORE = 0;
export const MAX_SCORE = 100;
export const POINTS_PER_CONFIRMED_DISTRACTION = 5;
export const POINTS_PER_DISTRACTED_MINUTE = 1;

export function calculateFocusScore(input: {
  confirmedDistractionCount: number;
  distractedSeconds: number;
}): number {
  const distractedMinutes = input.distractedSeconds / 60;
  const penalty =
    input.confirmedDistractionCount * POINTS_PER_CONFIRMED_DISTRACTION +
    distractedMinutes * POINTS_PER_DISTRACTED_MINUTE;
  const score = STARTING_SCORE - penalty;
  return Math.min(MAX_SCORE, Math.max(MIN_SCORE, score));
}
