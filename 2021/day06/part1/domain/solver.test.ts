import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { solver } from './index';

describe('2021 day 6 part 1 solver', () => {
  it('solves the official example across 80 days to 5934n', () => {
    expect(solver.days).toBe(80);
    const execution = executeSolver(solver, '3,4,3,1,2');
    expect(execution.answer).toBe(5934n);
  });

  it('produces 81 trace frames ending at 5934n and honors custom maxSteps', () => {
    const school = solver.parse('3,4,3,1,2');
    const fullFrames = solver.trace(school);
    expect(fullFrames).toHaveLength(81);
    expect(fullFrames[0]?.day).toBe(0);
    expect(fullFrames[0]?.totalPopulation).toBe(5n);
    expect(fullFrames[80]?.day).toBe(80);
    expect(fullFrames[80]?.totalPopulation).toBe(5934n);

    const sampled = solver.trace(school, { maxSteps: 9 });
    expect(sampled).toHaveLength(9);
    expect(sampled[0]?.day).toBe(0);
    expect(sampled[8]?.day).toBe(80);
  });

  it('propagates parse and trace option validation errors', () => {
    expect(() => executeSolver(solver, '')).toThrow(RangeError);
    expect(() => executeSolver(solver, '3,9,1')).toThrow(RangeError);
    expect(() => executeSolver(solver, '3,bad')).toThrow(SyntaxError);
    const school = solver.parse('3,4,3,1,2');
    expect(() => solver.trace(school, { maxSteps: 0 })).toThrow(RangeError);
  });
});
