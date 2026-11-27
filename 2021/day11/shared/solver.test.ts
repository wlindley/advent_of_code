import { describe, expect, it } from 'vitest';
import { FIRST_SYNC_STEP_POLICY, OctopusSolver, TOTAL_FLASHES_100_POLICY } from './index';

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

describe('OctopusSolver', () => {
  it('solves Part 1 and Part 2 policies and exposes frozen policy', () => {
    const part1 = new OctopusSolver(TOTAL_FLASHES_100_POLICY);
    expect(Object.isFrozen(part1)).toBe(true);
    expect(part1.policy).toBe(TOTAL_FLASHES_100_POLICY);
    const grid = part1.parse(OFFICIAL_10X10);
    expect(part1.solve(grid)).toBe(1656);

    const part2 = new OctopusSolver(FIRST_SYNC_STEP_POLICY);
    expect(part2.solve(grid)).toBe(195);
  });

  it('supports omitted, empty, and explicit maxSteps trace options', () => {
    const solver = new OctopusSolver(TOTAL_FLASHES_100_POLICY);
    const grid = solver.parse(OFFICIAL_10X10);

    const fullDefault = solver.trace(grid);
    expect(fullDefault).toHaveLength(101);
    expect(fullDefault[0]!.step).toBe(0);
    expect(fullDefault[100]!.totalFlashes).toBe(1656);

    const fullEmpty = solver.trace(grid, {});
    expect(fullEmpty).toHaveLength(101);

    const sampled = solver.trace(grid, { maxSteps: 11 });
    expect(sampled).toHaveLength(11);
    expect(sampled[0]!.step).toBe(0);
    expect(sampled[10]!.step).toBe(100);

    expect(() => solver.trace(grid, { maxSteps: 0 })).toThrow(RangeError);
  });
});
