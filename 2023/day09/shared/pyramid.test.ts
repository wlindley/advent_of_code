import { describe, expect, it } from 'vitest';
import { ExtrapolationResult, type ExtrapolationStrategy } from './strategy';
import { computeDifferences, DifferencePyramid, isAllZero } from './pyramid';

const FORWARD: ExtrapolationStrategy = {
  direction: 'forward',
  label: 'Forward',
  operatorSymbol: '+',
  anchorOf: (layer) => layer[layer.length - 1]!,
  combine: (anchor, below) => anchor + below,
};

const BACKWARD: ExtrapolationStrategy = {
  direction: 'backward',
  label: 'Backward',
  operatorSymbol: '-',
  anchorOf: (layer) => layer[0]!,
  combine: (anchor, below) => anchor - below,
};

describe('isAllZero and computeDifferences', () => {
  it('identifies all-zero rows without summing', () => {
    expect(isAllZero([0n, 0n, 0n])).toBe(true);
    expect(isAllZero([-1n, 0n, 1n])).toBe(false);
  });

  it('computes pairwise forward differences and freezes output', () => {
    const diffs = computeDifferences([0n, 3n, 6n, 9n]);
    expect(diffs).toEqual([3n, 3n, 3n]);
    expect(Object.isFrozen(diffs)).toBe(true);
  });

  it('rejects computeDifferences with fewer than two elements', () => {
    expect(() => computeDifferences([])).toThrow(/at least 2/i);
    expect(() => computeDifferences([7n])).toThrow(/at least 2/i);
  });
});

describe('ExtrapolationResult', () => {
  it('exposes frozen valuesByLayer and top-layer value', () => {
    const res = new ExtrapolationResult([18n, 3n, 0n]);
    expect(res.value).toBe(18n);
    expect(res.valuesByLayer).toEqual([18n, 3n, 0n]);
    expect(Object.isFrozen(res)).toBe(true);
    expect(Object.isFrozen(res.valuesByLayer)).toBe(true);
  });

  it('rejects empty valuesByLayer', () => {
    expect(() => new ExtrapolationResult([])).toThrow(/at least one/i);
  });
});

describe('DifferencePyramid', () => {
  it('builds difference layers down to all zeroes for polynomial histories', () => {
    const pyramid = DifferencePyramid.fromHistory([10n, 13n, 16n, 21n, 30n, 45n]);
    expect(Object.isFrozen(pyramid)).toBe(true);
    expect(Object.isFrozen(pyramid.layers)).toBe(true);
    expect(pyramid.history).toEqual([10n, 13n, 16n, 21n, 30n, 45n]);
    expect(pyramid.depth).toBe(5);
    expect(pyramid.degree).toBe(3);
    expect(pyramid.length).toBe(6);
    expect(pyramid.rightEdge).toEqual([45n, 15n, 6n, 2n, 0n]);
    expect(pyramid.leftEdge).toEqual([10n, 3n, 0n, 2n, 0n]);
  });

  it('handles an already all-zero history with depth 1 and degree 0', () => {
    const pyramid = DifferencePyramid.fromHistory([0n, 0n, 0n]);
    expect(pyramid.depth).toBe(1);
    expect(pyramid.degree).toBe(0);
    expect(pyramid.extrapolate(FORWARD).valuesByLayer).toEqual([0n]);
  });

  it('extrapolates forward and backward using strategy', () => {
    const p1 = DifferencePyramid.fromHistory([0n, 3n, 6n, 9n, 12n, 15n]);
    expect(p1.extrapolate(FORWARD).value).toBe(18n);
    expect(p1.extrapolate(BACKWARD).value).toBe(-3n);

    const p2 = DifferencePyramid.fromHistory([1n, 3n, 6n, 10n, 15n, 21n]);
    expect(p2.extrapolate(FORWARD).valuesByLayer).toEqual([28n, 7n, 1n, 0n]);

    const p3 = DifferencePyramid.fromHistory([10n, 13n, 16n, 21n, 30n, 45n]);
    expect(p3.extrapolate(FORWARD).value).toBe(68n);
    expect(p3.extrapolate(BACKWARD).value).toBe(5n);
  });

  it('rejects empty history or non-convergent short histories', () => {
    expect(() => DifferencePyramid.fromHistory([])).toThrow(/at least one/i);
    expect(() => DifferencePyramid.fromHistory([5n])).toThrow(/converge/i);
    expect(() => DifferencePyramid.fromHistory([1n, 2n])).toThrow(/converge/i);
  });
});
