import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../shared/core';
import { ALL_YES_POLICY, ANY_YES_POLICY } from './policy';
import { CustomsSolver } from './solver';

const SAMPLE_RAW = 'abc\n\na\nb\nc\n\nab\nac\n\na\na\na\na\n\nb';

describe('2020 day06 shared CustomsSolver', () => {
  it('freezes the solver instance and solves both ANY_YES_POLICY and ALL_YES_POLICY', () => {
    const part1Solver = new CustomsSolver(ANY_YES_POLICY);
    const part2Solver = new CustomsSolver(ALL_YES_POLICY);

    expect(Object.isFrozen(part1Solver)).toBe(true);
    expect(part1Solver.policy).toBe(ANY_YES_POLICY);
    expect(part2Solver.policy).toBe(ALL_YES_POLICY);

    expect(executeSolver(part1Solver, SAMPLE_RAW).answer).toBe(11);
    expect(executeSolver(part2Solver, SAMPLE_RAW).answer).toBe(6);
  });

  it('produces traces with omitted options, empty options object, and explicit maxSteps', () => {
    const solver = new CustomsSolver(ANY_YES_POLICY);
    const batch = solver.parse(SAMPLE_RAW);

    const omitted = solver.trace(batch);
    const emptyOpts = solver.trace(batch, {});
    const capped = solver.trace(batch, { maxSteps: 2 });

    expect(omitted).toHaveLength(5);
    expect(emptyOpts).toHaveLength(5);
    expect(capped).toHaveLength(2);
    expect(capped[0]?.groupNumber).toBe(1);
    expect(capped[1]?.groupNumber).toBe(5);
    expect(capped[1]?.runningSum).toBe(11);
  });
});
