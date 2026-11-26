import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver } from '../../../../shared/core';
import { part1Objective, solver } from './index';

const EXAMPLE_1 = [
  '###############',
  '#.......#....E#',
  '#.#.###.#.###.#',
  '#.....#.#...#.#',
  '#.###.#####.#.#',
  '#.#.#.......#.#',
  '#.#.#####.###.#',
  '#...........#.#',
  '###.#.#####.#.#',
  '#...#.....#.#.#',
  '#.#.#.###.#.#.#',
  '#.....#...#.#.#',
  '#.###.#.#.#.#.#',
  '#S..#.....#...#',
  '###############',
].join('\n');

const EXAMPLE_2 = [
  '#################',
  '#...#...#...#..E#',
  '#.#.#.#.#.#.#.#.#',
  '#.#.#.#...#...#.#',
  '#.#.#.#.###.#.#.#',
  '#...#.#.#.....#.#',
  '#.#.#.#.#.#####.#',
  '#.#...#.#.#.....#',
  '#.#.#####.#.###.#',
  '#.#.#.......#...#',
  '#.#.###.#####.###',
  '#.#.#...#.....#.#',
  '#.#.#.#####.###.#',
  '#.#.#.........#.#',
  '#.#.#.#########.#',
  '#S#.............#',
  '#################',
].join('\n');

describe('2024 Day 16 Part 1 solver', () => {
  it('solves Example 1 and Example 2 lowest scores', () => {
    expect(solver.solve(solver.parse(EXAMPLE_1))).toBe(7036);
    expect(solver.solve(solver.parse(EXAMPLE_2))).toBe(11048);
  });

  it('executes via executeSolver with a deterministic clock fake', () => {
    const ticks = [10, 22.5];
    let i = 0;
    const fakeClock: Clock = { nowMs: () => ticks[i++] ?? 22.5 };
    const exec = executeSolver(solver, EXAMPLE_1, fakeClock);
    expect(exec).toEqual({ answer: 7036, elapsedMs: 12.5, runtime: 'main-thread' });
  });

  it('produces bounded trace frames and throws when end E is unreachable', () => {
    const frames = solver.trace?.(solver.parse(EXAMPLE_1), { maxSteps: 12 });
    expect(frames).toBeDefined();
    expect(frames!.length).toBe(12);
    expect(frames![11]!.frontierCost).toBe(7036);

    const unreachable = solver.parse('#####\n#S#E#\n#####');
    expect(() => solver.solve(unreachable)).toThrow('End tile E is unreachable from start tile S');
    expect(part1Objective.extractAnswer).toBeTypeOf('function');
  });
});
