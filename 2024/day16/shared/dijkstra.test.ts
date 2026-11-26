import { describe, expect, it } from 'vitest';
import { analyzeReindeerMaze } from './dijkstra';
import { parseReindeerMaze } from './parse';
import { DIR_EAST, DIR_NORTH, DIR_SOUTH, DIR_WEST, STEP_COST, TURN_COST } from './types';

export const EXAMPLE_1 = [
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

export const EXAMPLE_2 = [
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

describe('analyzeReindeerMaze', () => {
  it('solves Example 1 and Example 2 scores and optimal tile counts', () => {
    const a1 = analyzeReindeerMaze(parseReindeerMaze(EXAMPLE_1));
    expect(Object.isFrozen(a1)).toBe(true);
    expect(a1.isReachable).toBe(true);
    expect(a1.bestScore).toBe(7036);
    expect(a1.optimalTileCount).toBe(45);
    expect(a1.settledCount).toBeGreaterThan(45);
    expect(a1.settledCellAt(0)).toBe(a1.maze.startCell);

    const path1 = a1.extractCanonicalPath();
    expect(Object.isFrozen(path1)).toBe(true);
    expect(path1[0]).toEqual({ row: 13, col: 1, dir: DIR_EAST, cost: 0 });
    expect(path1[path1.length - 1]!.cost).toBe(7036);

    const a2 = analyzeReindeerMaze(parseReindeerMaze(EXAMPLE_2));
    expect(a2.bestScore).toBe(11048);
    expect(a2.optimalTileCount).toBe(64);
  });

  it('handles unreachable targets and walled-off starts cleanly', () => {
    const unreachable = analyzeReindeerMaze(parseReindeerMaze(['#####', '#S#E#', '#####'].join('\n')));
    expect(unreachable.isReachable).toBe(false);
    expect(unreachable.bestScore).toBe(Infinity);
    expect(unreachable.optimalTileCount).toBe(0);
    expect(unreachable.settledCount).toBe(1);
    expect(unreachable.extractCanonicalPath()).toEqual([]);
    expect(unreachable.minCellDist(1, 3)).toBe(Infinity);
    expect(unreachable.stateDist(1, 1, DIR_EAST)).toBe(0);
    expect(unreachable.stateDist(1, 1, DIR_WEST)).toBe(2000);
    expect(unreachable.isOptimalTile(1, 1)).toBe(false);
    expect(unreachable.isOptimalCell(unreachable.maze.startCell)).toBe(false);
  });

  it('covers reverse CW/CCW canonical tie-breaking and boundary validation', () => {
    // Straight west requires 2 turns (2000) + 2 steps = 2002; both CW & CCW turns tie
    const westLine = analyzeReindeerMaze(parseReindeerMaze(['#####', '#E.S#', '#####'].join('\n')));
    expect(westLine.bestScore).toBe(2 * TURN_COST + 2 * STEP_COST);
    expect(westLine.optimalTileCount).toBe(3);
    const path = westLine.extractCanonicalPath();
    expect(path[0]!.dir).toBe(DIR_EAST);
    expect(path[path.length - 1]!.dir).toBe(DIR_WEST);

    // Multi-heading arrival at E: North-facing vs South-facing diamond tie
    const diamond = analyzeReindeerMaze(
      parseReindeerMaze(['#######', '#.....#', '#.S#E.#', '#.....#', '#######'].join('\n')),
    );
    expect(diamond.bestScore).toBe(3004);
    expect(diamond.optimalTileCount).toBe(8);
    expect(diamond.stateDist(2, 4, DIR_NORTH)).toBe(3004);
    expect(diamond.stateDist(2, 4, DIR_SOUTH)).toBe(3004);

    // Arrival facing South via CW turn
    const southPath = analyzeReindeerMaze(parseReindeerMaze(['###', '#S#', '#E#', '###'].join('\n')));
    expect(southPath.bestScore).toBe(1001);
    expect(southPath.extractCanonicalPath().at(-1)!.dir).toBe(DIR_SOUTH);

    expect(() => diamond.settledCellAt(-1)).toThrow(RangeError);
    expect(() => diamond.settledCellAt(diamond.settledCount)).toThrow(RangeError);
    expect(() => diamond.minCellDistAt(-1)).toThrow(RangeError);
    expect(() => diamond.isOptimalCell(99)).toThrow(RangeError);
  });
});
