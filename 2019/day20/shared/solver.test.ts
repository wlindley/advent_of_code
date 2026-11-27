import { describe, expect, it } from 'vitest';
import { FLAT_DONUT_POLICY, RECURSIVE_DONUT_POLICY } from './policy';
import { DEFAULT_MAX_TRACE_STEPS, DonutSolver } from './solver';

const EXAMPLE_1 = [
  '         A           ',
  '         A           ',
  '  #######.#########  ',
  '  #######.........#  ',
  '  #######.#######.#  ',
  '  #######.#######.#  ',
  '  #######.#######.#  ',
  '  #####  B    ###.#  ',
  'BC...##  C    ###.#  ',
  '  ##.##       ###.#  ',
  '  ##...DE  F  ###.#  ',
  '  #####    G  ###.#  ',
  '  #########.#####.#  ',
  'DE..#######...###.#  ',
  '  #.#########.###.#  ',
  'FG..#########.....#  ',
  '  ###########.#####  ',
  '             Z       ',
  '             Z       ',
].join('\n');

const RECURSIVE_DIVE_MINI = [
  '     A       ',
  '     A       ',
  '  ###.#####  ',
  '  #.......#  ',
  '  #####B###  ',
  '  #   #C# #  ',
  'BC....### #  ',
  '  #...#D# #  ',
  'DE....#E# #  ',
  '  #####.###  ',
  '  #.....###  ',
  '  ###.#####  ',
  '     Z       ',
  '     Z       ',
].join('\n');

const COLOCATED_MAZE = ['  ###  ', 'AA.ZZ  ', '  ###  '].join('\n');

describe('DonutSolver', () => {
  it('solves and emits exact full and sampled traces in flat mode', () => {
    const flatSolver = new DonutSolver(FLAT_DONUT_POLICY);
    const maze = flatSolver.parse(EXAMPLE_1);
    expect(flatSolver.solve(maze)).toBe(23);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(240);

    const full = flatSolver.trace(maze);
    expect(full.length).toBe(24);
    expect(full[0]!.stepIndex).toBe(0);
    expect(full[23]!.stepIndex).toBe(23);
    const warps = full[0]!.path.filter((s) => s.warpedVia !== null).map((s) => s.warpedVia);
    expect(warps).toEqual(['BC', 'DE', 'FG']);

    const sampled = flatSolver.trace(maze, { maxSteps: 10 });
    expect(sampled.length).toBe(10);
    expect(sampled[0]!.stepIndex).toBe(0);
    expect(sampled[sampled.length - 1]!.stepIndex).toBe(23);
    expect(Object.isFrozen(sampled)).toBe(true);
  });

  it('tracks depth changes in recursive mode and handles 0-step mazes', () => {
    const recSolver = new DonutSolver(RECURSIVE_DONUT_POLICY);
    const recMaze = recSolver.parse(RECURSIVE_DIVE_MINI);
    const recFrames = recSolver.trace(recMaze);
    const last = recFrames[recFrames.length - 1]!;
    expect(Math.max(...last.path.map((s) => s.depth))).toBe(1);
    expect(last.path[last.stepIndex]!.depth).toBe(0);

    const flatSolver = new DonutSolver(FLAT_DONUT_POLICY);
    const zeroFrames = flatSolver.trace(flatSolver.parse(COLOCATED_MAZE));
    expect(zeroFrames.length).toBe(1);
    expect(zeroFrames[0]!.stepIndex).toBe(0);
  });

  it('rejects invalid maxSteps trace options', () => {
    const flatSolver = new DonutSolver(FLAT_DONUT_POLICY);
    const maze = flatSolver.parse(COLOCATED_MAZE);
    expect(() => flatSolver.trace(maze, { maxSteps: 0 })).toThrow(RangeError);
  });
});
