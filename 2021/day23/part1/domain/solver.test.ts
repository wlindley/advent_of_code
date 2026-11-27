import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { solver } from './index';

const OFFICIAL_EXAMPLE = [
  '#############',
  '#...........#',
  '###B#C#B#D###',
  '  #A#D#C#A#',
  '  #########',
].join('\n');

describe('2021 Day 23 Part 1 solver', () => {
  it('solves the official Part 1 example to 12521', () => {
    expect(solver.policy.id).toBe('standard');
    expect(solver.policy.roomDepth).toBe(2);
    const result = executeSolver(solver, OFFICIAL_EXAMPLE);
    expect(result.answer).toBe(12521);
  });

  it('traces optimal moves cleanly with optional maxSteps cap', () => {
    const diagram = solver.parse(OFFICIAL_EXAMPLE);
    const full = solver.trace(diagram);
    expect(full[0]!.stepIndex).toBe(0);
    expect(full[full.length - 1]!.cumulativeEnergy).toBe(12521);
    expect(full[full.length - 1]!.isGoal).toBe(true);

    const bounded = solver.trace(diagram, { maxSteps: 5 });
    expect(bounded).toHaveLength(5);
    expect(bounded[4]!.cumulativeEnergy).toBe(12521);
  });

  it('rejects invalid inputs at the solver boundary', () => {
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('invalid')).toThrow();
  });
});
