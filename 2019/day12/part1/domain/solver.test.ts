import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { solver } from './solver';

const EXAMPLE_1 = [
  '<x=-1, y=0, z=2>',
  '<x=2, y=-10, z=-7>',
  '<x=4, y=-8, z=8>',
  '<x=3, y=5, z=-1>',
].join('\n');

describe('2019 Day 12 Part 1 solver', () => {
  it('computes 1000-step total energy and bounded orbit trace', () => {
    const result = executeSolver(solver, EXAMPLE_1);
    expect(result.answer).toBe(183);

    const parsed = solver.parse(EXAMPLE_1);
    const trace = solver.trace(parsed, { maxSteps: 12 });
    expect(trace.length).toBe(12);
    expect(trace[0]!.step).toBe(0);
    expect(trace[11]!.step).toBe(1000);
  });
});
