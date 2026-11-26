import { describe, expect, it } from 'vitest';
import {
  BananaSequenceCandidate,
  BuyerOutcome,
  DEFAULT_PRICE_WINDOW_SIZE,
  DELTA_BASE,
  DELTA_KEY_SPACE,
  DELTA_MAX,
  DELTA_MIN,
  DELTA_OFFSET,
  DELTA_ROLL_MOD,
  MIN_PRICE_WINDOW_SIZE,
  MarketOptimizationResult,
  MarketPriceWindow,
  SecretSumResult,
  decodeDeltaSequence,
  encodeDeltaSequence,
} from './model';

describe('delta constants and sequence codec', () => {
  it('exposes exact base-19 delta encoding constants', () => {
    expect(DELTA_MIN).toBe(-9);
    expect(DELTA_MAX).toBe(9);
    expect(DELTA_OFFSET).toBe(9);
    expect(DELTA_BASE).toBe(19);
    expect(DELTA_KEY_SPACE).toBe(130_321);
    expect(DELTA_ROLL_MOD).toBe(6_859);
    expect(MIN_PRICE_WINDOW_SIZE).toBe(8);
    expect(DEFAULT_PRICE_WINDOW_SIZE).toBe(40);
  });

  it('round-trips valid 4-delta sequences and rejects out-of-range inputs', () => {
    const seq = [-2, 1, -1, 3] as const;
    const key = encodeDeltaSequence(seq);
    expect(decodeDeltaSequence(key)).toEqual(seq);
    expect(encodeDeltaSequence([-9, -9, -9, -9])).toBe(0);
    expect(encodeDeltaSequence([9, 9, 9, 9])).toBe(DELTA_KEY_SPACE - 1);
    expect(decodeDeltaSequence(0)).toEqual([-9, -9, -9, -9]);
    expect(decodeDeltaSequence(DELTA_KEY_SPACE - 1)).toEqual([9, 9, 9, 9]);

    expect(() => encodeDeltaSequence([-10, 0, 0, 0])).toThrow(RangeError);
    expect(() => encodeDeltaSequence([0, 10, 0, 0])).toThrow(RangeError);
    expect(() => encodeDeltaSequence([0, 0, 1.5, 0])).toThrow(RangeError);
    expect(() => decodeDeltaSequence(-1)).toThrow(RangeError);
    expect(() => decodeDeltaSequence(DELTA_KEY_SPACE)).toThrow(RangeError);
    expect(() => decodeDeltaSequence(1.2)).toThrow(RangeError);
  });
});

describe('market domain value objects', () => {
  it('computes derived getters dynamically on BuyerOutcome and SecretSumResult', () => {
    const b0 = new BuyerOutcome(0, 1, 8_685_429);
    const b1 = new BuyerOutcome(1, 2024, 8_667_524);
    expect(b0.finalPrice).toBe(9);
    expect(b1.finalPrice).toBe(4);
    expect(Object.isFrozen(b0)).toBe(true);

    const res = new SecretSumResult(2_000, [b0, b1]);
    expect(res.totalFinalSecret).toBe(17_352_953n);
    expect(Object.isFrozen(res.buyers)).toBe(true);
    expect(() => new SecretSumResult(-1, [])).toThrow(RangeError);
  });

  it('exposes candidate deltas, label, and optimization result getters', () => {
    const key = encodeDeltaSequence([-2, 1, -1, 3]);
    const c1 = new BananaSequenceCandidate(key, 23, 3);
    expect(c1.deltas).toEqual([-2, 1, -1, 3]);
    expect(c1.label).toBe('-2,1,-1,3');

    const emptyOpt = new MarketOptimizationResult(3, 4, []);
    expect(emptyOpt.bestCandidate).toBeNull();
    expect(emptyOpt.maxBananas).toBe(0);

    const opt = new MarketOptimizationResult(2_000, 4, [c1]);
    expect(opt.bestCandidate).toBe(c1);
    expect(opt.maxBananas).toBe(23);
  });

  it('validates MarketPriceWindow and derives endStep, deltas, matchedPrice, and matchedDeltas', () => {
    const unmatched = new MarketPriceWindow(0, [3, 0, 6, 5, 4], null);
    expect(unmatched.endStep).toBe(4);
    expect(unmatched.deltas).toEqual([null, -3, 6, -1, -1]);
    expect(unmatched.matchedPrice).toBeNull();
    expect(unmatched.matchedDeltas).toBeNull();

    const matched = new MarketPriceWindow(2, [5, 4, 4, 6, 4, 4, 2, 4], 8);
    expect(matched.endStep).toBe(9);
    expect(matched.matchedPrice).toBe(2);
    expect(matched.matchedDeltas).toEqual([2, -2, 0, -2]);

    expect(() => new MarketPriceWindow(0, [], null)).toThrow(RangeError);
    expect(() => new MarketPriceWindow(0, [10], null)).toThrow(RangeError);
    expect(() => new MarketPriceWindow(0, [1, 2, 3, 4, 5], 3)).toThrow(RangeError);
    expect(() => new MarketPriceWindow(0, [1, 2, 3, 4, 5], 5)).toThrow(RangeError);
    expect(() => new MarketPriceWindow(0, [1, 2, 3, 4, 5], 4.5)).toThrow(RangeError);
  });
});
