import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { PACKET_MARKER_LENGTH, solver } from './solver';

const PART_1_EXAMPLES: readonly (readonly [string, number])[] = [
  ['mjqjpqmgbljsphdztnvjfqwrcgsmlb', 7],
  ['bvwbjplbgvbhsrlpgdmjqwftvncz', 5],
  ['nppdvjthqldpwncqszvftbrmjlhg', 6],
  ['nznrnfrfntjfmvfwmzdfjlvtqnbhcprsg', 10],
  ['zcfzfwzzqfrljwzlrfnpqdbhtmscgvjw', 11],
];

function createFakeClock(timesMs: readonly number[]): Clock {
  let idx = 0;
  return {
    nowMs: () => {
      const value = timesMs[idx] ?? timesMs[timesMs.length - 1] ?? 0;
      idx += 1;
      return value;
    },
  };
}

describe('2022 Day 6 Part 1 solver', () => {
  it('uses PACKET_MARKER_LENGTH = 4', () => {
    expect(PACKET_MARKER_LENGTH).toBe(4);
  });

  it('solves all five official Part 1 examples', () => {
    for (const [input, expected] of PART_1_EXAMPLES) {
      expect(solver.solve(solver.parse(` ${input}\n`))).toBe(expected);
    }
  });

  it('runs through executeSolver with a hand-written fake Clock', () => {
    const result = executeSolver(solver, PART_1_EXAMPLES[0]![0], createFakeClock([10, 15.5]));
    expect(result).toEqual({ answer: 7, elapsedMs: 5.5, runtime: 'main-thread' });
  });

  it('traces until locked at the start-of-packet marker', () => {
    const parsed = solver.parse(PART_1_EXAMPLES[4]![0]);
    const frames = solver.trace(parsed);
    const final = frames.at(-1)!;
    expect(final.isMarkerFound).toBe(true);
    expect(final.position).toBe(11);
    expect(final.windowLength).toBe(PACKET_MARKER_LENGTH);
    expect(final.windowText).toBe('zqfr');
  });

  it('propagates errors for invalid or marker-less inputs', () => {
    expect(() => solver.parse('')).toThrow(RangeError);
    expect(() => solver.parse('ABCD')).toThrow(RangeError);
    expect(() => solver.solve(solver.parse('abc'))).toThrow(RangeError);
    expect(() => solver.solve(solver.parse('aaaa'))).toThrow(RangeError);
  });
});
