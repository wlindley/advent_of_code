import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { DEFAULT_MAX_TRACE_STEPS } from '../../shared';
import { solver } from './index';

const EXAMPLE_INPUT = 'COM)B\nB)C\nC)D\nD)E\nE)F\nB)G\nG)H\nD)I\nE)J\nJ)K\nK)L';

describe('2019 Day 6 Part 1 solver', () => {
  it('solves the official example (42) via executeSolver', () => {
    const execution = executeSolver(solver, EXAMPLE_INPUT);
    expect(execution.answer).toBe(42);
    expect(execution.elapsedMs).toBeGreaterThanOrEqual(0);
  });

  it('produces depth-sweep traces with omitted, empty, and capped options', () => {
    const map = solver.parse(EXAMPLE_INPUT);
    expect(solver.trace(map)).toHaveLength(8);
    expect(solver.trace(map, {})).toHaveLength(8);

    const deepRaw = Array.from({ length: 120 }, (_, i) =>
      `${i === 0 ? 'COM' : `N${i}`})N${i + 1}`,
    ).join('\n');
    const deep = solver.parse(deepRaw);
    expect(solver.solve(deep)).toBe((120 * 121) / 2);
    expect(solver.trace(deep)).toHaveLength(DEFAULT_MAX_TRACE_STEPS);
    expect(solver.trace(deep, { maxSteps: 6 })).toHaveLength(6);
  });

  it('propagates parse and trace errors', () => {
    expect(() => executeSolver(solver, 'COM)A\nB)C')).toThrow(RangeError);
    expect(() => executeSolver(solver, 'BAD_LINE')).toThrow(SyntaxError);
    expect(() => solver.trace(solver.parse('COM)A'), { maxSteps: -1 })).toThrow(RangeError);
  });
});
