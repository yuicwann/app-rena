export const MAX_HEARTS = 5;

export interface HeartsState {
  current: number;
  lastLostTimestamp: number | null;
}

export function deductHeart(state: HeartsState): HeartsState {
  return {
    current: Math.max(0, state.current - 1),
    lastLostTimestamp: Date.now(),
  };
}

export function recoverHeart(state: HeartsState): HeartsState {
  return {
    current: Math.min(MAX_HEARTS, state.current + 1),
    lastLostTimestamp: state.current + 1 >= MAX_HEARTS ? null : state.lastLostTimestamp,
  };
}
