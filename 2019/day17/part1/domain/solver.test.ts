import { describe, expect, it } from 'vitest';
import { solver } from './index';

const OFFICIAL_EXAMPLE_ROM =
  '4,15,1001,1,1,1,1008,1,113,14,1006,14,0,99,0,46,46,35,46,46,46,46,46,46,46,46,46,46,10,46,46,35,46,46,46,46,46,46,46,46,46,46,10,35,35,35,35,35,35,35,46,46,46,35,35,35,10,35,46,35,46,46,46,35,46,46,46,35,46,35,10,35,35,35,35,35,35,35,35,35,35,35,35,35,10,46,46,35,46,46,46,35,46,46,46,35,46,46,10,46,46,35,35,35,35,35,46,46,46,94,46,46,10';

describe('2019 Day 17 Part 1 solver', () => {
  it('parses, solves, and traces the official example scaffold grid', () => {
    const program = solver.parse(OFFICIAL_EXAMPLE_ROM);
    expect(solver.solve(program)).toBe(76n);

    const frames = solver.trace(program);
    expect(frames).toHaveLength(7);
    expect(frames[0]!.phase).toBe('scan');
    expect(frames[0]!.revealedRows).toBe(1);
    expect(frames[6]!.revealedRows).toBe(7);
    expect(frames[6]!.map.alignmentParameterSum).toBe(76n);

    const bounded = solver.trace(program, { maxSteps: 3 });
    expect(bounded).toHaveLength(3);
  });

  it('rejects invalid Intcode inputs and invalid trace limits', () => {
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('1,2,bad')).toThrow();
    const program = solver.parse(OFFICIAL_EXAMPLE_ROM);
    expect(() => solver.trace(program, { maxSteps: 0 })).toThrow(RangeError);
  });
});
