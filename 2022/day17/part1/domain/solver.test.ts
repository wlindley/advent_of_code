import { describe, expect, it } from 'vitest';
import { PART1_ROCK_COUNT, solver } from './index';

const EXAMPLE_INPUT = '>>><<><>><<<>><>>><<<>>><<<><<<>><>><<>>';

describe('2022 Day 17 Part 1 solver', () => {
  it('solves the official example for 2,022 falling rocks', () => {
    expect(PART1_ROCK_COUNT).toBe(2022n);
    const parsed = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(parsed)).toBe(3068n);
  });

  it('produces bounded trace frames ending at the Part 1 answer', () => {
    const parsed = solver.parse(EXAMPLE_INPUT);
    const frames = solver.trace!(parsed, { maxSteps: 10 });
    expect(frames).toHaveLength(10);
    expect(frames[0]!.rockNumber).toBe(0n);
    expect(frames[frames.length - 1]!.rockNumber).toBe(2022n);
    expect(frames[frames.length - 1]!.towerHeight).toBe(3068n);
  });

  it('rejects malformed jet input at parse boundary', () => {
    expect(() => solver.parse('invalid')).toThrow();
  });
});
