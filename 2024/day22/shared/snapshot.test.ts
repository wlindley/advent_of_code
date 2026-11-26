import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MAX_TRACE_STEPS,
  MarketSnapshot,
  buildBananaOptimizationTrace,
  buildSecretSumTrace,
} from './snapshot';

describe('buildSecretSumTrace', () => {
  it('builds step and complete frames with dynamic snapshot getters', () => {
    const frames = buildSecretSumTrace([1, 10, 100, 2024], 2_000);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(48);
    expect(frames).toHaveLength(5);

    const first = frames[0]!;
    expect(first).toBeInstanceOf(MarketSnapshot);
    expect(first.phase).toBe('step');
    expect(first.isComplete).toBe(false);
    expect(first.optimization).toBeNull();
    expect(first.totalBuyers).toBe(4);
    expect(first.activeBuyer.initialSecret).toBe(1);
    expect(first.revealedSecretSum).toBe(8_685_429n);
    expect(first.totalFinalSecret).toBe(37_327_623n);
    expect(first.activeWindow.matchedStep).toBeNull();

    const last = frames[frames.length - 1]!;
    expect(last.phase).toBe('complete');
    expect(last.isComplete).toBe(true);
    expect(last.revealedBuyerCount).toBe(4);
    expect(last.revealedSecretSum).toBe(37_327_623n);
  });

  it('bounds trace frames via maxSteps including maxSteps = 1 and rejects invalid inputs', () => {
    const seeds = Array.from({ length: 60 }, (_, i) => i + 1);
    const bounded = buildSecretSumTrace(seeds, 10, { maxSteps: 10 });
    expect(bounded).toHaveLength(10);
    expect(bounded[0]!.activeBuyerIndex).toBe(0);
    expect(bounded[bounded.length - 1]!.isComplete).toBe(true);
    expect(bounded[bounded.length - 1]!.activeBuyerIndex).toBe(59);

    const single = buildSecretSumTrace([1, 10], 10, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]!.isComplete).toBe(true);

    expect(() => buildSecretSumTrace([], 10)).toThrow(RangeError);
    expect(() => buildSecretSumTrace([1], 10, { maxSteps: 0 })).toThrow(RangeError);
  });
});

describe('buildBananaOptimizationTrace', () => {
  it('attaches optimization leaderboard and highlights matched buyer price windows', () => {
    const frames = buildBananaOptimizationTrace([1, 2, 3, 2024], 2_000, 3);
    expect(frames).toHaveLength(5);
    const last = frames[frames.length - 1]!;
    expect(last.optimization?.maxBananas).toBe(23);
    expect(last.optimization?.bestCandidate?.deltas).toEqual([-2, 1, -1, 3]);
    expect(last.activeWindow.matchedStep).not.toBeNull();
    expect(last.activeWindow.matchedDeltas).toEqual([-2, 1, -1, 3]);

    const shortFrames = buildBananaOptimizationTrace([123], 3, 2);
    expect(shortFrames[shortFrames.length - 1]!.optimization?.bestCandidate).toBeNull();
    expect(shortFrames[0]!.activeWindow.matchedStep).toBeNull();
    expect(() => buildBananaOptimizationTrace([], 10, 3)).toThrow(RangeError);
  });
});
