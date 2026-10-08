import type { FeatureScoredEvent } from '@/types/match';

export const SCORE_EVENT_DISPLAY_MS = 2400;
export const FINAL_SCORE_EVENT_DISPLAY_MS = 3600;
export const FINAL_SCORE_MEEPLE_RETURN_DELAY_MS = 1500;

export const getScoreEventDisplayMs = (event: FeatureScoredEvent): number => (
  event.payload.scoringPhase === 'final'
    ? FINAL_SCORE_EVENT_DISPLAY_MS
    : SCORE_EVENT_DISPLAY_MS
);

export const getScoreEventMeepleReturnDelayMs = (
  event: FeatureScoredEvent,
): number => (
  event.payload.scoringPhase === 'final'
    ? FINAL_SCORE_MEEPLE_RETURN_DELAY_MS
    : 0
);
