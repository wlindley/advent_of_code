import { describe, expect, it } from 'vitest';
import { LinenLayout } from './model';
import { parseLinenLayout } from './parser';
import { DEFAULT_MAX_TRACE_STEPS, buildLinenTrace } from './trace';

const EXAMPLE_INPUT = [
  'r, wr, b, g, bwu, rb, gb, br',
  '',
  'brwrr',
  'bggr',
  'gbbr',
  'rrbgbr',
  'ubwu',
  'bwurrg',
  'brgr',
  'bbrgwb',
].join('\n');

describe('buildLinenTrace', () => {
  it('emits full per-design frames with running cumulative totals when within maxSteps', () => {
    const layout = parseLinenLayout(EXAMPLE_INPUT);
    const frames = buildLinenTrace(layout);

    expect(DEFAULT_MAX_TRACE_STEPS).toBe(80);
    expect(frames.length).toBe(8);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(Object.isFrozen(frames[0])).toBe(true);

    expect(frames[0]!.designIndex).toBe(0);
    expect(frames[0]!.totalDesigns).toBe(8);
    expect(frames[0]!.cumulativePossible).toBe(1);
    expect(frames[0]!.cumulativeArrangements).toBe(2n);

    expect(frames[4]!.analysis.possible).toBe(false);
    expect(frames[4]!.cumulativePossible).toBe(4);
    expect(frames[4]!.cumulativeArrangements).toBe(13n);

    const last = frames[frames.length - 1]!;
    expect(last.designIndex).toBe(7);
    expect(last.cumulativePossible).toBe(6);
    expect(last.cumulativeArrangements).toBe(16n);
  });

  it('samples endpoints cleanly and preserves exact final totals even when maxSteps = 1 or default-capped', () => {
    const designs = Array.from({ length: 120 }, (_, i) => (i % 3 === 0 ? 'u' : 'r'));
    const layout = new LinenLayout(['r'], designs);

    const defaultFrames = buildLinenTrace(layout);
    expect(defaultFrames.length).toBe(DEFAULT_MAX_TRACE_STEPS);
    expect(defaultFrames[0]!.designIndex).toBe(0);
    const defaultLast = defaultFrames[defaultFrames.length - 1]!;
    expect(defaultLast.designIndex).toBe(119);
    expect(defaultLast.cumulativePossible).toBe(80);
    expect(defaultLast.cumulativeArrangements).toBe(80n);

    const singleFrame = buildLinenTrace(layout, { maxSteps: 1 });
    expect(singleFrame.length).toBe(1);
    expect(singleFrame[0]!.designIndex).toBe(119);
    expect(singleFrame[0]!.cumulativePossible).toBe(80);
    expect(singleFrame[0]!.cumulativeArrangements).toBe(80n);
  });

  it('rejects invalid maxSteps options', () => {
    const layout = new LinenLayout(['r'], ['r']);
    expect(() => buildLinenTrace(layout, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => buildLinenTrace(layout, { maxSteps: 1.5 })).toThrow(RangeError);
  });
});
