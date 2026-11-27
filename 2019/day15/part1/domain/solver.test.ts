import { describe, expect, it } from 'vitest';
import { solver } from './solver';

const OFFICIAL_EXAMPLE_INPUT =
  '3,50,1001,50,57,7,1,0,51,53,1001,50,62,15,1,0,52,54,1002,54,5,55,1,55,53,55,1001,55,67,31,1001,0,0,56,4,56,1006,56,0,1001,53,0,51,1001,54,0,52,1105,1,0,0,2,1,0,0,0,0,0,0,0,-1,1,0,-1,1,0,0,0,0,0,0,0,0,0,1,1,0,0,2,1,0,0,0,0,0,0,0';

describe('2019 Day 15 Part 1 solver', () => {
  it('parses, solves, and traces the official example compartment', () => {
    const program = solver.parse(OFFICIAL_EXAMPLE_INPUT);
    expect(solver.solve(program)).toBe(2);

    const frames = solver.trace(program);
    expect(frames.length).toBeGreaterThan(2);
    expect(frames[0]!.phase).toBe('explore');
    const lastFrame = frames[frames.length - 1]!;
    expect(lastFrame.phase).toBe('solve');
    expect(lastFrame.shortestPath).toHaveLength(3);

    const bounded = solver.trace(program, { maxSteps: 2 });
    expect(bounded).toHaveLength(2);
  });

  it('rejects invalid Intcode inputs and invalid trace options', () => {
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('1,2,bad')).toThrow();
    const program = solver.parse(OFFICIAL_EXAMPLE_INPUT);
    expect(() => solver.trace(program, { maxSteps: 0 })).toThrow(RangeError);
  });
});
