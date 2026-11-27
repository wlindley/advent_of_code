import { describe, expect, it } from 'vitest';
import {
  buildElementBars,
  buildGrowthCurve,
  buildTopReactions,
  DEFAULT_TOP_REACTIONS,
  formatCompactBigInt,
  formatGroupedBigInt,
  scaleBigIntRatio,
  scaleValue,
} from './chart';
import { InsertionRule, PolymerFormula, PolymerState } from './polymer';
import { tracePolymerization } from './simulation';

describe('chart formatting and scaling helpers', () => {
  it('scales BigInt ratios safely across zero, equal, middle, and >2^1024 values', () => {
    expect(scaleBigIntRatio(0n, 0n)).toBe(0);
    expect(scaleBigIntRatio(0n, 100n)).toBe(0);
    expect(scaleBigIntRatio(100n, 100n)).toBe(1);
    expect(scaleBigIntRatio(150n, 100n)).toBe(1);
    expect(scaleBigIntRatio(25n, 100n)).toBe(0.25);

    const bigHalf = 1n << 1100n;
    const bigMax = 1n << 1101n;
    expect(scaleBigIntRatio(bigHalf, bigMax)).toBe(0.5);

    expect(() => scaleBigIntRatio(-1n, 10n)).toThrow(RangeError);
    expect(() => scaleBigIntRatio(1n, -1n)).toThrow(RangeError);
  });

  it('formats grouped and compact BigInts including scientific notation', () => {
    expect(formatGroupedBigInt(0n)).toBe('0');
    expect(formatGroupedBigInt(999n)).toBe('999');
    expect(formatGroupedBigInt(1234567n)).toBe('1,234,567');
    expect(formatGroupedBigInt(-1234n)).toBe('-1,234');

    expect(formatCompactBigInt(0n)).toBe('0');
    expect(formatCompactBigInt(999n)).toBe('999');
    expect(formatCompactBigInt(-1500n)).toBe('-1.5k');
    expect(formatCompactBigInt(1000n)).toBe('1k');
    expect(formatCompactBigInt(1749n)).toBe('1.7k');
    expect(formatCompactBigInt(2_000_000n)).toBe('2M');
    expect(formatCompactBigInt(1_500_000_000n)).toBe('1.5B');
    expect(formatCompactBigInt(2_500_000_000_000n)).toBe('2.5T');
    expect(formatCompactBigInt(10n ** 15n)).toBe('1.00e15');
    expect(formatCompactBigInt(1_234_567_890_123_456_789n)).toBe('1.23e18');
  });

  it('scales values in linear and log modes without NaN on 0 or 1', () => {
    expect(scaleValue(5n, 10n, Math.log2(11), 'linear')).toBe(0.5);
    expect(scaleValue(0n, 0n, 0, 'log')).toBe(0);
    expect(scaleValue(0n, 1n, 1, 'log')).toBe(0);
    expect(scaleValue(1n, 1n, 1, 'log')).toBe(1);
    const mid = scaleValue(7n, 63n, 6, 'log');
    expect(mid).toBeCloseTo(0.5, 6);
  });
});

describe('chart series builders', () => {
  it('builds element frequency bars with most, middle, and least roles', () => {
    const single = new PolymerState(new Map(), 'A');
    const singleBars = buildElementBars(single, 'log');
    expect(Object.isFrozen(singleBars)).toBe(true);
    expect(singleBars).toEqual([
      { element: 'A', count: 1n, ratio: 1, sharePercent: 100, role: 'most' },
    ]);

    const state = new PolymerState(
      new Map([
        ['AA', 3n],
        ['AB', 2n],
        ['BB', 1n],
        ['BC', 1n],
      ]),
      'C',
    );
    // Counts: A=5 (most), B=2 (middle), C=1 (least), total=8
    const bars = buildElementBars(state, 'linear');
    expect(bars.map((b) => [b.element, b.role])).toEqual([
      ['A', 'most'],
      ['B', 'middle'],
      ['C', 'least'],
    ]);
    expect(bars[0]?.ratio).toBe(1);
    expect(bars[1]?.ratio).toBe(0.4);
    expect(bars[2]?.ratio).toBe(0.2);
  });

  it('builds top active reactions up to limit and validates limit', () => {
    expect(DEFAULT_TOP_REACTIONS).toBe(8);
    expect(buildTopReactions([], DEFAULT_TOP_REACTIONS)).toEqual([]);
    expect(() => buildTopReactions([], 0)).toThrow(RangeError);
    expect(() => buildTopReactions([], 1.5)).toThrow(RangeError);

    const reactions = [
      { pair: 'NN', insert: 'C', count: 10n },
      { pair: 'NC', insert: 'B', count: 5n },
      { pair: 'CB', insert: 'H', count: 2n },
    ];
    const top2 = buildTopReactions(reactions, 2);
    expect(top2).toEqual([
      { pair: 'NN', insert: 'C', count: 10n, ratio: 1 },
      { pair: 'NC', insert: 'B', count: 5n, ratio: 0.5 },
    ]);
  });

  it('builds growth curve points for empty, constant, and expanding traces', () => {
    expect(buildGrowthCurve([], 'linear')).toEqual([]);

    const inertFormula = new PolymerFormula('A', []);
    const inertFrames = tracePolymerization(inertFormula, 2);
    const flatLog = buildGrowthCurve(inertFrames, 'log');
    expect(flatLog).toHaveLength(3);
    expect(flatLog[0]).toEqual({
      step: 0,
      totalLength: 1n,
      spread: 0n,
      lengthRatio: 1,
      spreadRatio: 0,
    });

    const growingFormula = new PolymerFormula('NNCB', [
      new InsertionRule('NN', 'C'),
      new InsertionRule('NC', 'B'),
      new InsertionRule('CB', 'H'),
      new InsertionRule('CN', 'C'),
    ]);
    const frames = tracePolymerization(growingFormula, 4);
    const curve = buildGrowthCurve(frames, 'log');
    expect(curve).toHaveLength(5);
    expect(curve[4]?.lengthRatio).toBe(1);
    expect(curve[4]?.spreadRatio).toBe(1);
  });
});
