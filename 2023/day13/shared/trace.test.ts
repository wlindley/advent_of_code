import { describe, expect, it } from 'vitest';
import { MirrorPattern } from './pattern';
import { buildIncidenceTrace, DEFAULT_MAX_TRACE_STEPS } from './trace';

const VERT_ONE = new MirrorPattern(['..']);
const HORIZ_ONE = new MirrorPattern(['#', '#']);

describe('buildIncidenceTrace', () => {
  it('returns an empty frozen array for empty pattern input', () => {
    const frames = buildIncidenceTrace([], 0);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames).toEqual([]);
  });

  it('emits all frozen frames when count <= maxSteps (including omitted options)', () => {
    const patterns = [VERT_ONE, HORIZ_ONE];
    const frames = buildIncidenceTrace(patterns, 0);

    expect(DEFAULT_MAX_TRACE_STEPS).toBe(100);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames).toHaveLength(2);
    expect(Object.isFrozen(frames[0])).toBe(true);
    expect(frames[0]!.patternIndex).toBe(0);
    expect(frames[0]!.totalPatterns).toBe(2);
    expect(frames[0]!.match.score).toBe(1);
    expect(frames[0]!.cumulativeScore).toBe(1);
    expect(frames[1]!.patternIndex).toBe(1);
    expect(frames[1]!.cumulativeScore).toBe(101);
  });

  it('uniformly downsamples frames when count > maxSteps and supports maxSteps = 1', () => {
    const patterns = [VERT_ONE, HORIZ_ONE, VERT_ONE, HORIZ_ONE, VERT_ONE];

    const sampled = buildIncidenceTrace(patterns, 0, { maxSteps: 3 });
    expect(sampled.map((frame) => frame.patternIndex)).toEqual([0, 2, 4]);
    expect(sampled.map((frame) => frame.cumulativeScore)).toEqual([1, 102, 203]);

    const single = buildIncidenceTrace(patterns, 0, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]!.patternIndex).toBe(4);
    expect(single[0]!.cumulativeScore).toBe(203);
  });

  it('validates targetSmudges and maxSteps eagerly', () => {
    expect(() => buildIncidenceTrace([], -1)).toThrow(RangeError);
    expect(() => buildIncidenceTrace([], Number.NaN)).toThrow(RangeError);
    expect(() => buildIncidenceTrace([VERT_ONE], 0, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => buildIncidenceTrace([VERT_ONE], 0, { maxSteps: 1.5 })).toThrow(RangeError);
  });
});
