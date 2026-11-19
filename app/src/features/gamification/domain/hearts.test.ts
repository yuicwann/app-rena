import { deductHeart, recoverHeart, MAX_HEARTS, HeartsState } from './hearts';

describe('Hearts domain logic', () => {
  it('deducts a heart and records timestamp', () => {
    const initial: HeartsState = { current: 5, lastLostTimestamp: null };
    const next = deductHeart(initial);
    expect(next.current).toBe(4);
    expect(next.lastLostTimestamp).not.toBeNull();
  });

  it('does not deduct below zero', () => {
    const zeroHearts: HeartsState = { current: 0, lastLostTimestamp: 12345 };
    const next = deductHeart(zeroHearts);
    expect(next.current).toBe(0);
  });

  it('recovers heart up to MAX_HEARTS', () => {
    const threeHearts: HeartsState = { current: 3, lastLostTimestamp: 12345 };
    const four = recoverHeart(threeHearts);
    expect(four.current).toBe(4);

    const five = recoverHeart(four);
    expect(five.current).toBe(MAX_HEARTS);
    expect(five.lastLostTimestamp).toBeNull();

    const stillFive = recoverHeart(five);
    expect(stillFive.current).toBe(MAX_HEARTS);
  });
});
