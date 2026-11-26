import { describe, expect, it } from 'vitest';
import { solver } from './index';

describe('2019 Day 7 Part 1 solver', () => {
  it('solves all three official Part 1 examples', () => {
    const ex1 = '3,15,3,16,1002,16,10,16,1,16,15,15,4,15,99,0,0';
    const ex2 =
      '3,23,3,24,1002,24,10,24,1002,23,-1,23,101,5,23,23,1,24,23,23,4,23,99,0,0';
    const ex3 =
      '3,31,3,32,1002,32,10,32,1001,31,-2,31,1007,31,0,33,1002,33,7,33,1,33,31,31,1,32,31,31,4,31,99,0,0,0';

    expect(solver.solve(solver.parse(ex1))).toBe(43210n);
    expect(solver.solve(solver.parse(ex2))).toBe(54321n);
    expect(solver.solve(solver.parse(ex3))).toBe(65210n);
  });

  it('produces bounded trace frames for Part 1 Example 1', () => {
    const program = solver.parse('3,15,3,16,1002,16,10,16,1,16,15,15,4,15,99,0,0');
    const frames = solver.trace(program, { maxSteps: 12 });
    expect(frames).toHaveLength(12);
    expect(frames[11]!.bestEntry.run.thrusterSignal).toBe(43210n);
    expect(frames[11]!.bestEntry.run.phases).toEqual([4n, 3n, 2n, 1n, 0n]);
  });

  it('rejects malformed Intcode input', () => {
    expect(() => solver.parse('')).toThrow(/empty/i);
    expect(() => solver.parse('3,abc,99')).toThrow(/Invalid Intcode/);
  });
});
