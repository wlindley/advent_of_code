import { describe, expect, it } from 'vitest';
import { ClosedInterval } from '../../../../shared/core';
import { Almanac, RangeMap, RangeRule, parseAlmanac } from '../../shared';
import { FlowRibbon } from './intervals';
import {
  DEFAULT_MAX_TRACE_STEPS,
  IntervalStageFrame,
  findLowestRangeLocation,
  traceAlmanacRanges,
} from './trace';

describe('IntervalStageFrame', () => {
  const rule = RangeRule.fromTriple(50n, 10n, 5n);
  const ribbons = [
    new FlowRibbon(new ClosedInterval(5n, 9n), undefined),
    new FlowRibbon(new ClosedInterval(10n, 12n), rule),
  ];

  it('computes dynamic input, output, minOutput, and ribbon counts and freezes itself', () => {
    const frame = new IntervalStageFrame(0, 3, 'seed', 'soil', ribbons);
    expect(Object.isFrozen(frame)).toBe(true);
    expect(Object.isFrozen(frame.ribbons)).toBe(true);
    expect(frame.stageIndex).toBe(0);
    expect(frame.totalStages).toBe(3);
    expect(frame.sourceCategory).toBe('seed');
    expect(frame.destCategory).toBe('soil');
    expect(frame.input.intervals.map((iv) => [iv.start, iv.end])).toEqual([[5n, 12n]]);
    expect(frame.output.intervals.map((iv) => [iv.start, iv.end])).toEqual([
      [5n, 9n],
      [50n, 52n],
    ]);
    expect(frame.minOutput).toBe(5n);
    expect(frame.matchedRibbonCount).toBe(1);
    expect(frame.identityRibbonCount).toBe(1);
  });

  it('rejects out-of-range stageIndex and empty ribbons', () => {
    expect(() => new IntervalStageFrame(-1, 3, 'seed', 'soil', ribbons)).toThrow(RangeError);
    expect(() => new IntervalStageFrame(3, 3, 'seed', 'soil', ribbons)).toThrow(RangeError);
    expect(() => new IntervalStageFrame(0, 3, 'seed', 'soil', [])).toThrow(RangeError);
  });
});

describe('findLowestRangeLocation & traceAlmanacRanges', () => {
  const sampleRaw = [
    'seeds: 10 5 20 3',
    '',
    'seed-to-soil map:',
    '0 12 2',
    '',
    'soil-to-fertilizer map:',
    '100 10 2',
    '',
    'fertilizer-to-water map:',
    '30 20 3',
    '',
    'water-to-light map:',
    '5 30 1',
  ].join('\n');

  it('finds lowest location including 0n winner and propagates invalid seed ranges', () => {
    const almanac = parseAlmanac(sampleRaw);
    expect(findLowestRangeLocation(almanac)).toBe(0n);

    const oddSeeds = new Almanac([1n, 2n, 3n], [new RangeMap('seed', 'loc', [RangeRule.fromTriple(1n, 1n, 1n)])]);
    expect(() => findLowestRangeLocation(oddSeeds)).toThrow(RangeError);
  });

  it('traces all stages by default and samples when maxSteps is smaller than stage count', () => {
    const almanac = parseAlmanac(sampleRaw);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(200);

    const full = traceAlmanacRanges(almanac);
    expect(full.map((f) => f.stageIndex)).toEqual([0, 1, 2, 3]);
    expect(full[0]!.minOutput).toBe(0n);
    expect(full[3]!.minOutput).toBe(0n);

    const three = traceAlmanacRanges(almanac, { maxSteps: 3 });
    expect(three.map((f) => f.stageIndex)).toEqual([0, 2, 3]);

    const one = traceAlmanacRanges(almanac, { maxSteps: 1 });
    expect(one.map((f) => f.stageIndex)).toEqual([3]);
    expect(one[0]!.minOutput).toBe(0n);
  });

  it('rejects invalid maxSteps values', () => {
    const almanac = parseAlmanac(sampleRaw);
    expect(() => traceAlmanacRanges(almanac, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceAlmanacRanges(almanac, { maxSteps: -2 })).toThrow(RangeError);
    expect(() => traceAlmanacRanges(almanac, { maxSteps: 1.5 })).toThrow(RangeError);
  });
});
