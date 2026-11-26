import { describe, expect, it } from 'vitest';
import { AdapterChain } from './chain';
import { collectJoltSteps, countJoltDifferences, JoltHistogram, JoltStep } from './differences';

describe('JoltHistogram', () => {
  it('stores delta counts, derives totalSteps & part1Product, and increments branchlessly', () => {
    const h0 = new JoltHistogram(0, 0, 0);
    expect(h0.totalSteps).toBe(0);
    expect(h0.part1Product).toBe(0n);
    expect(Object.isFrozen(h0)).toBe(true);

    const h1 = h0.withDelta(1).withDelta(2).withDelta(3).withDelta(1);
    expect(h1.diff1).toBe(2);
    expect(h1.diff2).toBe(1);
    expect(h1.diff3).toBe(1);
    expect(h1.totalSteps).toBe(4);
    expect(h1.part1Product).toBe(2n);
    expect(Object.isFrozen(h1)).toBe(true);
  });

  it('rejects negative or non-safe-integer counts', () => {
    expect(() => new JoltHistogram(-1, 0, 0)).toThrow(RangeError);
    expect(() => new JoltHistogram(0, 1.5, 0)).toThrow(RangeError);
    expect(() => new JoltHistogram(0, 0, Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
  });
});

describe('JoltStep & difference collectors', () => {
  it('validates JoltStep toIndex >= 1 and derives fromIndex', () => {
    const step = new JoltStep(3, 2, new JoltHistogram(1, 1, 1));
    expect(step.fromIndex).toBe(2);
    expect(step.toIndex).toBe(3);
    expect(step.delta).toBe(2);
    expect(Object.isFrozen(step)).toBe(true);
    expect(() => new JoltStep(0, 1, new JoltHistogram(1, 0, 0))).toThrow(RangeError);
    expect(() => new JoltStep(1.5, 1, new JoltHistogram(1, 0, 0))).toThrow(RangeError);
  });

  it('counts 1/2/3-jolt steps on small example, larger example, and 2-jolt chain', () => {
    const small = new AdapterChain([16, 10, 15, 5, 1, 11, 7, 19, 6, 12, 4]);
    const smallHist = countJoltDifferences(small);
    expect(smallHist.diff1).toBe(7);
    expect(smallHist.diff2).toBe(0);
    expect(smallHist.diff3).toBe(5);
    expect(smallHist.part1Product).toBe(35n);

    const large = new AdapterChain([
      28, 33, 18, 42, 31, 14, 46, 20, 48, 47, 24, 23, 49, 45, 19, 38,
      39, 11, 1, 32, 25, 35, 8, 17, 7, 9, 4, 2, 34, 10, 3,
    ]);
    const largeHist = countJoltDifferences(large);
    expect(largeHist.diff1).toBe(22);
    expect(largeHist.diff3).toBe(10);
    expect(largeHist.part1Product).toBe(220n);

    const withTwo = new AdapterChain([2, 4, 6]);
    const steps = collectJoltSteps(withTwo);
    expect(steps.length).toBe(4);
    expect(Object.isFrozen(steps)).toBe(true);
    expect(steps[0]!.fromIndex).toBe(0);
    expect(steps[0]!.delta).toBe(2);
    expect(steps[3]!.histogram).toEqual(new JoltHistogram(0, 3, 1));
  });
});
