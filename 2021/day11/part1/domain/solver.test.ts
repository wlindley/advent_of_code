import { describe, expect, it } from 'vitest';
import { solver } from './index';

const OFFICIAL_10X10 = [
  '5483143223',
  '2745854711',
  '5264556173',
  '6141336146',
  '6357385478',
  '4167524645',
  '2176841721',
  '6882881134',
  '4846848554',
  '5283751526',
].join('\n');

describe('2021 Day 11 Part 1 solver', () => {
  it('computes 1656 total flashes after 100 steps and traces step endpoints 0..100', () => {
    const grid = solver.parse(OFFICIAL_10X10);
    expect(solver.solve(grid)).toBe(1656);

    const frames = solver.trace(grid, { maxSteps: 21 });
    expect(frames).toHaveLength(21);
    expect(frames[0]!.step).toBe(0);
    expect(frames[0]!.totalFlashes).toBe(0);
    expect(frames[20]!.step).toBe(100);
    expect(frames[20]!.totalFlashes).toBe(1656);
  });

  it('rejects invalid puzzle input', () => {
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('12x4')).toThrow(RangeError);
  });
});
