import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MAX_TRACE_STEPS,
  evaluateTotalMetric,
  MAX_REACHABLE_CELLS,
  parseTopographicMap,
  traceTrailheads,
  type PeakContributionMetric,
} from './index';

const SCORE_LIKE: PeakContributionMetric = {
  mode: 'score',
  peakValue: () => 1,
};

const RATING_LIKE: PeakContributionMetric = {
  mode: 'rating',
  peakValue: (pathCount) => pathCount,
};

describe('evaluateTotalMetric & traceTrailheads', () => {
  it('distinguishes score-like and rating-like metrics on a diamond grid', () => {
    const map = parseTopographicMap(
      [
        '0123',
        '1234',
        '2345',
        '3456',
        '4567',
        '5678',
        '6789',
      ].join('\n'),
    );

    expect(DEFAULT_MAX_TRACE_STEPS).toBe(80);
    expect(MAX_REACHABLE_CELLS).toBe(181);
    expect(evaluateTotalMetric(map, SCORE_LIKE)).toBe(1);
    // C(9, 3) = 84 distinct monotonic paths from (0,0) to (6,3).
    expect(evaluateTotalMetric(map, RATING_LIKE)).toBe(84);

    const frames = traceTrailheads(map, RATING_LIKE);
    expect(frames).toHaveLength(1);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(Object.isFrozen(frames[0])).toBe(true);
    expect(frames[0]!.peaks).toEqual([{ index: map.indexOf(6, 3), pathCount: 84, contribution: 84 }]);
    expect(frames[0]!.reachableIndices.length).toBe(28);
    expect(frames[0]!.trailheadContribution).toBe(84);
    expect(frames[0]!.cumulativeTotal).toBe(84);
  });

  it('handles zero trailheads cleanly', () => {
    const map = parseTopographicMap('123\n456\n789');
    expect(evaluateTotalMetric(map, SCORE_LIKE)).toBe(0);
    const frames = traceTrailheads(map, SCORE_LIKE);
    expect(frames).toEqual([]);
    expect(Object.isFrozen(frames)).toBe(true);
  });

  it('records dead-end trailheads with zero peaks', () => {
    const map = parseTopographicMap('012\n543\n67.');
    expect(evaluateTotalMetric(map, SCORE_LIKE)).toBe(0);
    const frames = traceTrailheads(map, SCORE_LIKE);
    expect(frames).toHaveLength(1);
    expect(frames[0]!.peaks).toEqual([]);
    expect(frames[0]!.trailheadContribution).toBe(0);
    expect(frames[0]!.cumulativeTotal).toBe(0);
    expect(frames[0]!.reachableIndices).toHaveLength(8);
  });

  it('blocks diagonal, flat, downhill, jump, and impassable steps', () => {
    const diagonalOnly = parseTopographicMap('0.\n.1\n23\n45\n67\n89');
    expect(evaluateTotalMetric(diagonalOnly, SCORE_LIKE)).toBe(0);

    const blockedMoves = parseTopographicMap(
      [
        '002.', // flat 0->0, jump 0->2, impassable '.'
        '19.9', // (0,0)->(1,0)=1, isolated 9s
        '2345', // (1,0)->(2,0)..(2,3), downhill (1,1)=9 not entered from 1
        '9876', // (2,3)->(3,3)..(3,0)=9
      ].join('\n'),
    );
    expect(evaluateTotalMetric(blockedMoves, SCORE_LIKE)).toBe(1);
  });

  it('evaluates multiple trailheads sharing the same 9 peak independently', () => {
    const map = parseTopographicMap(
      [
        '0123456789',
        '.........8',
        '..01234567',
      ].join('\n'),
    );
    expect(evaluateTotalMetric(map, SCORE_LIKE)).toBe(2);
  });

  it('samples trace frames while preserving cumulative totals across all trailheads', () => {
    const row = '0123456789';
    const map = parseTopographicMap([row, row, row, row, row].join('\n'));

    const full = traceTrailheads(map, SCORE_LIKE, { maxSteps: 10 });
    expect(full).toHaveLength(5);
    expect(full.map((f) => f.trailheadOrder)).toEqual([0, 1, 2, 3, 4]);
    expect(full.map((f) => f.cumulativeTotal)).toEqual([1, 2, 3, 4, 5]);

    const sampled = traceTrailheads(map, SCORE_LIKE, { maxSteps: 3 });
    expect(sampled).toHaveLength(3);
    expect(sampled.map((f) => f.trailheadOrder)).toEqual([0, 2, 4]);
    expect(sampled.map((f) => f.cumulativeTotal)).toEqual([1, 3, 5]);

    const single = traceTrailheads(map, SCORE_LIKE, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]!.trailheadOrder).toBe(4);
    expect(single[0]!.totalTrailheads).toBe(5);
    expect(single[0]!.cumulativeTotal).toBe(5);
  });

  it('validates maxSteps before returning on zero-trailhead maps', () => {
    const noTrailheads = parseTopographicMap('12\n34');
    expect(() => traceTrailheads(noTrailheads, SCORE_LIKE, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceTrailheads(noTrailheads, SCORE_LIKE, { maxSteps: -2 })).toThrow(RangeError);
    expect(() => traceTrailheads(noTrailheads, SCORE_LIKE, { maxSteps: 1.5 })).toThrow(RangeError);
    expect(() => traceTrailheads(noTrailheads, SCORE_LIKE, { maxSteps: Number.NaN })).toThrow(
      RangeError,
    );
  });
});
