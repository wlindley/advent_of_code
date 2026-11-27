import { describe, expect, it } from 'vitest';
import { solver } from './solver';

const EXAMPLE_INPUT = '104,1,104,2,104,3,104,6,104,5,104,4,99';
const BLOCK_DRAW_INPUT = '104,0,104,0,104,2,104,1,104,0,104,2,104,0,104,0,104,0,99';

describe('2019 Day 13 Part 1 solver', () => {
  it('parses, solves, and traces the official example and overwritten blocks', () => {
    const example = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(example)).toBe(0);

    const frames = solver.trace(example);
    expect(frames).toHaveLength(3);
    expect(frames[2]!.paddleX).toBe(1);
    expect(frames[2]!.ballX).toBe(6);

    const overwritten = solver.parse(BLOCK_DRAW_INPUT);
    expect(solver.solve(overwritten)).toBe(1);

    const bounded = solver.trace(overwritten, { maxSteps: 2 });
    expect(bounded).toHaveLength(2);
    expect(bounded[0]!.stepIndex).toBe(0);
    expect(bounded[1]!.stepIndex).toBe(3);
  });

  it('rejects invalid Intcode inputs and invalid trace options', () => {
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('1,2,bad')).toThrow();
    const halted = solver.parse('99');
    expect(() => solver.trace(halted, { maxSteps: 0 })).toThrow(RangeError);
  });
});
