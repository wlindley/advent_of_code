import { describe, expect, it } from 'vitest';
import { parseSeatingLayout } from './layout';
import { ADJACENT_SEATING_RULE } from './rules';
import {
  DEFAULT_MAX_TRACE_STEPS,
  diffSeatStates,
  SeatingTraceFrame,
  traceSeating,
} from './trace';

const EXAMPLE_10X10 = [
  'L.LL.LL.LL',
  'LLLLLLL.LL',
  'L.L.L..L..',
  'LLLL.LL.LL',
  'L.LL.LL.LL',
  'L.LLLLL.LL',
  '..L.L.....',
  'LLLLLLLLLL',
  'L.LLLLLL.L',
  'L.LLLLL.LL',
].join('\n');

describe('traceSeating and SeatingTraceFrame', () => {
  it('captures full round-by-round visual diff frames within DEFAULT_MAX_TRACE_STEPS', () => {
    const layout = parseSeatingLayout(EXAMPLE_10X10);
    const frames = traceSeating(layout, ADJACENT_SEATING_RULE, DEFAULT_MAX_TRACE_STEPS);

    expect(frames).toHaveLength(6);
    expect(frames[0]!.round).toBe(0);
    expect(frames[0]!.totalRounds).toBe(5);
    expect(frames[0]!.seatCount).toBe(71);
    expect(frames[0]!.occupiedCount).toBe(0);
    expect(frames[0]!.emptyCount).toBe(71);
    expect(frames[0]!.changedCount).toBe(0);
    expect(frames[0]!.isStable).toBe(false);

    // Round 1: all 71 empty seats become newly occupied (state 2)
    expect(frames[1]!.occupiedCount).toBe(71);
    expect(frames[1]!.newlyOccupiedCount).toBe(71);
    expect(frames[1]!.newlyVacatedCount).toBe(0);
    expect(frames[1]!.changedCount).toBe(71);
    expect(frames[1]!.stateAt(0)).toBe(2);

    // Round 2: stays occupied (1) and newly vacated (3) both appear
    expect(frames[2]!.occupiedCount).toBe(20);
    expect(frames[2]!.newlyOccupiedCount).toBe(0);
    expect(frames[2]!.newlyVacatedCount).toBe(51);
    expect(frames[2]!.stateAt(0)).toBe(1);
    expect(frames[2]!.stateAt(2)).toBe(3);

    const last = frames[frames.length - 1]!;
    expect(last.round).toBe(5);
    expect(last.occupiedCount).toBe(37);
    expect(last.emptyCount).toBe(34);
    expect(last.isStable).toBe(true);
  });

  it('downsamples frames for maxSteps: 3 and maxSteps: 1 while preserving endpoints', () => {
    const layout = parseSeatingLayout(EXAMPLE_10X10);

    const sampled3 = traceSeating(layout, ADJACENT_SEATING_RULE, 3);
    expect(sampled3.map((f) => f.round)).toEqual([0, 3, 5]);
    expect(sampled3[2]!.isStable).toBe(true);

    const sampled1 = traceSeating(layout, ADJACENT_SEATING_RULE, 1);
    expect(sampled1).toHaveLength(1);
    expect(sampled1[0]!.round).toBe(5);
    expect(sampled1[0]!.isStable).toBe(true);
    expect(sampled1[0]!.occupiedCount).toBe(37);
  });

  it('handles zero-round layouts and propagates cycle errors', () => {
    const floor = traceSeating(parseSeatingLayout('..'), ADJACENT_SEATING_RULE, DEFAULT_MAX_TRACE_STEPS);
    expect(floor).toHaveLength(1);
    expect(floor[0]!.round).toBe(0);
    expect(floor[0]!.totalRounds).toBe(0);
    expect(floor[0]!.isStable).toBe(true);
    expect(floor[0]!.seatCount).toBe(0);

    const stable = traceSeating(parseSeatingLayout('#.#'), ADJACENT_SEATING_RULE, DEFAULT_MAX_TRACE_STEPS);
    expect(stable).toHaveLength(1);
    expect(stable[0]!.occupiedCount).toBe(2);
    expect(stable[0]!.stateAt(0)).toBe(1);

    const octagon = parseSeatingLayout('.LL.\nLLLL\nLLLL\n.LL.');
    expect(() => traceSeating(octagon, ADJACENT_SEATING_RULE, DEFAULT_MAX_TRACE_STEPS)).toThrow('cycle');
  });

  it('computes diffSeatStates and validates trace boundaries', () => {
    const prev = new Uint8Array([0, 1, 0, 1]);
    const curr = new Uint8Array([0, 1, 1, 0]);
    expect(Array.from(diffSeatStates(prev, curr))).toEqual([0, 1, 2, 3]);

    const layout = parseSeatingLayout('L');
    expect(() => traceSeating(layout, ADJACENT_SEATING_RULE, 0)).toThrow(RangeError);
    expect(() => traceSeating(layout, ADJACENT_SEATING_RULE, -2)).toThrow(RangeError);
    expect(() => traceSeating(layout, ADJACENT_SEATING_RULE, 1.5)).toThrow(RangeError);

    expect(() => new SeatingTraceFrame(-1, 2, new Uint8Array([0]))).toThrow(RangeError);
    expect(() => new SeatingTraceFrame(0.5, 2, new Uint8Array([0]))).toThrow(RangeError);
    expect(() => new SeatingTraceFrame(3, 2, new Uint8Array([0]))).toThrow(RangeError);
    expect(() => new SeatingTraceFrame(1, 1.5, new Uint8Array([0]))).toThrow(RangeError);

    const frame = new SeatingTraceFrame(0, 0, new Uint8Array([0]));
    expect(() => frame.stateAt(-1)).toThrow(RangeError);
    expect(() => frame.stateAt(1)).toThrow(RangeError);
    expect(() => frame.stateAt(0.5)).toThrow(RangeError);
  });
});
