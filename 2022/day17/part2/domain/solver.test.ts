import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver } from '../../../../shared/core';
import { DEFAULT_TRACE_MAX_STEPS } from '../../shared';
import { PART2_ROCK_COUNT, solver } from './index';

const EXAMPLE_INPUT = '>>><<><>><<<>><>>><<<>>><<<><<<>><>><<>>';
const EXPECTED_EXAMPLE = 1_514_285_714_288n;

class StubClock implements Clock {
  private index = 0;

  constructor(private readonly readings: readonly number[]) {}

  nowMs(): number {
    const value = this.readings[this.index] ?? this.readings[this.readings.length - 1]!;
    this.index += 1;
    return value;
  }
}

describe('2022 Day 17 Part 2 solver', () => {
  it('solves the official example for 1,000,000,000,000 rocks', () => {
    expect(PART2_ROCK_COUNT).toBe(1_000_000_000_000n);
    const parsed = solver.parse(`  \n${EXAMPLE_INPUT}\t `);
    expect(solver.solve(parsed)).toBe(EXPECTED_EXAMPLE);
  });

  it('executes via executeSolver with a deterministic clock', () => {
    const result = executeSolver(solver, EXAMPLE_INPUT, new StubClock([10, 27]));
    expect(result).toEqual({ answer: EXPECTED_EXAMPLE, elapsedMs: 17, runtime: 'main-thread' });
  });

  it('produces bounded trace frames with cycle metadata', () => {
    const parsed = solver.parse(EXAMPLE_INPUT);
    const frames = solver.trace!(parsed, { maxSteps: 10 });
    expect(frames).toHaveLength(10);
    expect(frames[0]).toMatchObject({ rockNumber: 0n, towerHeight: 0n, cycle: null });
    expect(frames[frames.length - 1]).toMatchObject({
      rockNumber: PART2_ROCK_COUNT,
      towerHeight: EXPECTED_EXAMPLE,
      cycle: { cycleLength: 35n, cycleHeightGain: 53n },
    });
    expect(frames[frames.length - 1]!.cycle!.skippedCycles).toBeGreaterThan(0n);
  });

  it('uses DEFAULT_TRACE_MAX_STEPS when trace options are omitted', () => {
    const frames = solver.trace!(solver.parse(EXAMPLE_INPUT));
    expect(frames.length).toBeLessThanOrEqual(DEFAULT_TRACE_MAX_STEPS);
    expect(frames[frames.length - 1]!.towerHeight).toBe(EXPECTED_EXAMPLE);
  });

  it.each(['', '  \n ', '>>>x<<<', '>> <<'])('rejects malformed input %j', (raw) => {
    expect(() => solver.parse(raw)).toThrow();
  });

  it.each([0, -1, 1.5])('rejects invalid maxSteps %s', (maxSteps) => {
    const parsed = solver.parse(EXAMPLE_INPUT);
    expect(() => solver.trace!(parsed, { maxSteps })).toThrow();
  });
});
