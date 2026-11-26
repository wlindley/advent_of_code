import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { createHotSpringsSolver } from '../../shared';
import { PART1_UNFOLD_FACTOR, solver } from './index';

const EXAMPLE_INPUT = [
  '???.### 1,1,3',
  '.??..??...?##. 1,1,3',
  '?#?#?#?#?#?#?#? 1,3,1,6',
  '????.#...#... 4,1,1',
  '????.######..#####. 1,6,5',
  '?###???????? 3,2,1',
].join('\n');

describe('Day 12 Part 1 solver', () => {
  it('exposes PART1_UNFOLD_FACTOR = 1 and a frozen solver', () => {
    expect(PART1_UNFOLD_FACTOR).toBe(1);
    expect(Object.isFrozen(solver)).toBe(true);
  });

  it('solves the official 6-row example to 21n', () => {
    const parsed = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(parsed)).toBe(21n);
  });

  it('emits bounded traces with default and custom maxSteps', () => {
    const parsed = solver.parse(EXAMPLE_INPUT);
    const full = solver.trace?.(parsed);
    expect(full).toHaveLength(6);
    expect(full?.[5]?.cumulativeTotal).toBe(21n);

    const bounded = solver.trace?.(parsed, { maxSteps: 3 });
    expect(bounded).toHaveLength(3);
    expect(bounded?.[0]?.rowIndex).toBe(0);
    expect(bounded?.[2]?.rowIndex).toBe(5);
    expect(bounded?.[2]?.cumulativeTotal).toBe(21n);
  });

  it('runs cleanly through executeSolver', () => {
    const execution = executeSolver(solver, EXAMPLE_INPUT);
    expect(execution.answer).toBe(21n);
    expect(execution.runtime).toBe('main-thread');
    expect(execution.elapsedMs).toBeGreaterThanOrEqual(0);
  });

  it('rejects invalid unfold factors in createHotSpringsSolver', () => {
    expect(() => createHotSpringsSolver(0)).toThrow(RangeError);
  });
});
