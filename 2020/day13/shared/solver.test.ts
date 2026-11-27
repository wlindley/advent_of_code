import { describe, expect, it } from 'vitest';
import { CONSECUTIVE_ALIGNMENT_POLICY, EARLIEST_BUS_POLICY } from './policies';
import { DEFAULT_MAX_TRACE_STEPS, ShuttleSolver } from './solver';

describe('ShuttleSolver', () => {
  it('delegates parse, solve, and bounded trace for a ShuttlePolicy', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(200);
    const part1 = new ShuttleSolver(EARLIEST_BUS_POLICY);
    expect(Object.isFrozen(part1)).toBe(true);
    expect(part1.policy).toBe(EARLIEST_BUS_POLICY);

    const schedule = part1.parse('939\n7,13,x,x,59,x,31,19');
    expect(part1.solve(schedule)).toBe(295n);
    expect(part1.trace(schedule)).toHaveLength(5);
    expect(part1.trace(schedule, {})).toHaveLength(5);
    expect(part1.trace(schedule, { maxSteps: 2 })).toHaveLength(2);

    const part2 = new ShuttleSolver(CONSECUTIVE_ALIGNMENT_POLICY);
    expect(part2.solve(schedule)).toBe(1068781n);
    expect(part2.trace(schedule, { maxSteps: 3 })).toHaveLength(3);
  });

  it('rejects invalid raw input and invalid trace maxSteps', () => {
    const solver = new ShuttleSolver(EARLIEST_BUS_POLICY);
    const schedule = solver.parse('939\n7,13');
    expect(() => solver.parse('939')).toThrow();
    expect(() => solver.trace(schedule, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => solver.trace(schedule, { maxSteps: -2 })).toThrow(RangeError);
    expect(() => solver.trace(schedule, { maxSteps: 1.5 })).toThrow(RangeError);
  });
});
