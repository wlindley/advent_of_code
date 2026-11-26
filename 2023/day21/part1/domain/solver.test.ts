import { describe, expect, it } from 'vitest';
import { PART1_STEPS, solver } from './index';

const OFFICIAL_11X11 = [
  '...........',
  '.....###.#.',
  '.###.##..#.',
  '..#.#...#..',
  '....#.#....',
  '.##..S####.',
  '.##..#...#.',
  '.......##..',
  '.##.#.####.',
  '.##..##.##.',
  '...........',
].join('\n');

describe('Day 21 Part 1 solver', () => {
  it('uses 64 steps and solves parsed garden maps via finite BFS', () => {
    expect(PART1_STEPS).toBe(64);
    const map = solver.parse(OFFICIAL_11X11);
    expect(solver.solve(map)).toBe(42);
  });

  it('produces default and maxSteps-bounded trace frames ending at PART1_STEPS', () => {
    const map = solver.parse(OFFICIAL_11X11);
    const full = solver.trace?.(map) ?? [];
    expect(full).toHaveLength(65);
    expect(full[0]!.step).toBe(0);
    expect(full[full.length - 1]!.step).toBe(64);
    expect(full[full.length - 1]!.reachableCount).toBe(42);

    const bounded = solver.trace?.(map, { maxSteps: 9 }) ?? [];
    expect(bounded).toHaveLength(9);
    expect(bounded[0]!.step).toBe(0);
    expect(bounded[bounded.length - 1]!.step).toBe(64);
    expect(bounded[bounded.length - 1]!.reachableCount).toBe(42);
  });
});
