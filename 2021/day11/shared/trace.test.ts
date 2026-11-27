import { describe, expect, it } from 'vitest';
import { parseOctopusGrid } from './parser';
import { captureSampledTrace, DEFAULT_TRACE_MAX_STEPS, OctopusStepFrame } from './trace';

describe('OctopusStepFrame', () => {
  it('derives stepFlashes, totalFlashes, isSynchronized, and flashedAt without stored derived state', () => {
    const grid0 = parseOctopusGrid('09\n12');
    const history = [2, 4];
    const frame0 = new OctopusStepFrame(0, grid0, history);
    expect(Object.isFrozen(frame0)).toBe(true);
    expect(Object.isFrozen(frame0.flashHistory)).toBe(true);
    expect(frame0.stepFlashes).toBe(0);
    expect(frame0.totalFlashes).toBe(0);
    expect(frame0.isSynchronized).toBe(false);
    expect(frame0.flashedAt(0, 0)).toBe(false);
    expect(() => frame0.flashedAt(-1, 0)).toThrow(RangeError);

    const grid1 = parseOctopusGrid('10\n23');
    const frame1 = new OctopusStepFrame(1, grid1, Object.freeze([2, 4]));
    expect(frame1.stepFlashes).toBe(2);
    expect(frame1.totalFlashes).toBe(2);
    expect(frame1.isSynchronized).toBe(false);
    expect(frame1.flashedAt(0, 1)).toBe(true);
    expect(frame1.flashedAt(0, 0)).toBe(false);

    const grid2 = parseOctopusGrid('00\n00');
    const frame2 = new OctopusStepFrame(2, grid2, [2, 4]);
    expect(frame2.stepFlashes).toBe(4);
    expect(frame2.totalFlashes).toBe(6);
    expect(frame2.isSynchronized).toBe(true);
  });

  it('rejects invalid step indices or out-of-range flashHistory entries', () => {
    const grid = parseOctopusGrid('12\n34');
    expect(() => new OctopusStepFrame(-1, grid, [1])).toThrow(RangeError);
    expect(() => new OctopusStepFrame(2, grid, [1])).toThrow(RangeError);
    expect(() => new OctopusStepFrame(0.5, grid, [1])).toThrow(RangeError);
    expect(() => new OctopusStepFrame(0, grid, [-1])).toThrow(RangeError);
    expect(() => new OctopusStepFrame(0, grid, [5])).toThrow(RangeError);
    expect(() => new OctopusStepFrame(0, grid, [1.2])).toThrow(RangeError);
  });
});

describe('captureSampledTrace', () => {
  it('captures every step when within maxSteps and samples endpoints when capped', () => {
    expect(DEFAULT_TRACE_MAX_STEPS).toBe(250);
    const grid = parseOctopusGrid('11111\n19991\n19191\n19991\n11111');
    const history = [9, 0, 0];

    const full = captureSampledTrace(grid, history, 10);
    expect(full.map((f) => f.step)).toEqual([0, 1, 2, 3]);
    expect(full[1]!.stepFlashes).toBe(9);
    expect(full[2]!.stepFlashes).toBe(0);

    const sampled = captureSampledTrace(grid, [9, 0, 0, 0, 0, 0], 3);
    expect(sampled.map((f) => f.step)).toEqual([0, 3, 6]);

    const single = captureSampledTrace(grid, history, 1);
    expect(single.map((f) => f.step)).toEqual([3]);
  });

  it('rejects invalid maxSteps', () => {
    const grid = parseOctopusGrid('9');
    expect(() => captureSampledTrace(grid, [1], 0)).toThrow(RangeError);
    expect(() => captureSampledTrace(grid, [1], 1.5)).toThrow(RangeError);
  });
});
