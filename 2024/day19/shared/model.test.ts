import { describe, expect, it } from 'vitest';
import {
  DesignAnalysis,
  LinenLayout,
  STRIPE_COLORS,
  STRIPE_COUNT,
  assertValidStripeSequence,
  stripeToIndex,
} from './model';

describe('stripe color helpers', () => {
  it('exposes the 5 canonical stripe colors and maps each to its index', () => {
    expect(STRIPE_COUNT).toBe(5);
    expect(STRIPE_COLORS).toEqual(['w', 'u', 'b', 'r', 'g']);
    expect(STRIPE_COLORS.map((ch) => stripeToIndex(ch))).toEqual([0, 1, 2, 3, 4]);
  });

  it('rejects invalid stripe characters and empty or malformed sequences', () => {
    expect(() => stripeToIndex('')).toThrow(RangeError);
    expect(() => stripeToIndex('x')).toThrow(RangeError);
    expect(() => stripeToIndex('W')).toThrow(RangeError);
    expect(() => stripeToIndex('ww')).toThrow(RangeError);

    expect(() => assertValidStripeSequence('', 'pattern')).toThrow(RangeError);
    expect(() => assertValidStripeSequence('wrx', 'design')).toThrow(RangeError);
    expect(() => assertValidStripeSequence('wubrg', 'design')).not.toThrow();
  });
});

describe('LinenLayout', () => {
  it('freezes collections and computes derived counts and max lengths dynamically', () => {
    const patterns = ['r', 'wr', 'bwu'];
    const designs = ['brwrr', 'wr', 'brwrr'];
    const layout = new LinenLayout(patterns, designs);

    expect(Object.isFrozen(layout)).toBe(true);
    expect(Object.isFrozen(layout.patterns)).toBe(true);
    expect(Object.isFrozen(layout.designs)).toBe(true);
    expect(layout.patternCount).toBe(3);
    expect(layout.designCount).toBe(3);
    expect(layout.maxPatternLength).toBe(3);
    expect(layout.maxDesignLength).toBe(5);
  });

  it('rejects empty lists, invalid characters, and duplicate patterns', () => {
    expect(() => new LinenLayout([], ['r'])).toThrow(RangeError);
    expect(() => new LinenLayout(['r'], [])).toThrow(RangeError);
    expect(() => new LinenLayout(['r', ''], ['r'])).toThrow(RangeError);
    expect(() => new LinenLayout(['r'], ['rx'])).toThrow(RangeError);
    expect(() => new LinenLayout(['r', 'wr', 'r'], ['wr'])).toThrow(Error);
  });
});

describe('DesignAnalysis', () => {
  it('computes wayCount, possible, and furthestReachable dynamically for possible and blocked designs', () => {
    const possible = new DesignAnalysis('brwrr', [1n, 0n, 1n, 1n, 2n, 2n], ['b', 'r', 'wr', 'r']);
    expect(Object.isFrozen(possible)).toBe(true);
    expect(Object.isFrozen(possible.prefixWays)).toBe(true);
    expect(Object.isFrozen(possible.witnessDecomposition)).toBe(true);
    expect(possible.wayCount).toBe(2n);
    expect(possible.possible).toBe(true);
    expect(possible.furthestReachable).toBe(5);

    const partial = new DesignAnalysis('ubwu', [1n, 1n, 1n, 0n, 0n], null);
    expect(partial.wayCount).toBe(0n);
    expect(partial.possible).toBe(false);
    expect(partial.furthestReachable).toBe(2);

    const stuckAtZero = new DesignAnalysis('ug', [1n, 0n, 0n], null);
    expect(stuckAtZero.wayCount).toBe(0n);
    expect(stuckAtZero.possible).toBe(false);
    expect(stuckAtZero.furthestReachable).toBe(0);
  });

  it('validates prefixWays and witness invariants', () => {
    expect(() => new DesignAnalysis('', [1n], [])).toThrow(RangeError);
    expect(() => new DesignAnalysis('rg', [1n, 0n], null)).toThrow(RangeError);
    expect(() => new DesignAnalysis('rg', [0n, 1n, 1n], ['rg'])).toThrow(RangeError);
    expect(() => new DesignAnalysis('rg', [1n, -1n, 0n], null)).toThrow(RangeError);
    expect(() => new DesignAnalysis('rg', [1n, 1n, 0n], ['r'])).toThrow(RangeError);
    expect(() => new DesignAnalysis('rg', [1n, 1n, 1n], null)).toThrow(RangeError);
    expect(() => new DesignAnalysis('rg', [1n, 1n, 1n], ['r', '', 'g'])).toThrow(RangeError);
    expect(() => new DesignAnalysis('rg', [1n, 1n, 1n], ['r', 'b'])).toThrow(RangeError);
  });
});
