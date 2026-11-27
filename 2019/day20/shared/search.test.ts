import { describe, expect, it } from 'vitest';
import { DIRS_4 } from '../../../shared/core';
import { parseDonutMaze, type DonutMaze } from './maze';
import { FLAT_DONUT_POLICY, RECURSIVE_DONUT_POLICY, type DonutPolicy } from './policy';
import { solveDonutMaze } from './search';

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

const EXAMPLE_2 = [
  '                   A               ',
  '                   A               ',
  '  #################.#############  ',
  '  #.#...#...................#.#.#  ',
  '  #.#.#.###.###.###.#########.#.#  ',
  '  #.#.#.......#...#.....#.#.#...#  ',
  '  #.#########.###.#####.#.#.###.#  ',
  '  #.............#.#.....#.......#  ',
  '  ###.###########.###.#####.#.#.#  ',
  '  #.....#        A   C    #.#.#.#  ',
  '  #######        S   P    #####.#  ',
  '  #.#...#                 #......VT',
  '  #.#.#.#                 #.#####  ',
  '  #...#.#               YN....#.#  ',
  '  #.###.#                 #####.#  ',
  'DI....#.#                 #.....#  ',
  '  #####.#                 #.###.#  ',
  'ZZ......#               QG....#..AS',
  '  ###.###                 #######  ',
  'JO..#.#.#                 #.....#  ',
  '  #.#.#.#                 ###.#.#  ',
  '  #...#..DI             BU....#..LF',
  '  #####.#                 #.#####  ',
  'YN......#               VT..#....QG',
  '  #.###.#                 #.###.#  ',
  '  #.#...#                 #.....#  ',
  '  ###.###    J L     J    #.#.###  ',
  '  #.....#    O F     P    #.#...#  ',
  '  #.###.#####.#.#####.#####.###.#  ',
  '  #...#.#.#...#.....#.....#.#...#  ',
  '  #.#####.###.###.#.#.#########.#  ',
  '  #...#.#.....#...#.#.#.#.....#.#  ',
  '  #.###.#####.###.###.#.#.#######  ',
  '  #.#.........#...#.............#  ',
  '  #########.###.###.#############  ',
  '           B   J   C               ',
  '           U   P   P               ',
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

const DIAMOND_STALE_HEAP = [
  '     A     ',
  '     A     ',
  '  ###.###  ',
  '  #.....#  ',
  '  ###B#.#  ',
  '  ###C#.#  ',
  '  #####.#  ',
  '  ###D#.#  ',
  'BC..#E#.#  ',
  '  #.....#  ',
  '  #######  ',
  'DE........#',
  '  #######.#',
  '         Z ',
  '         Z ',
].join('\n');

const COLOCATED_MAZE = ['  ###  ', 'AA.ZZ  ', '  ###  '].join('\n');
const DISCONNECTED_MAZE = ['  A   Z  ', '  A   Z  ', ' #.# #.# ', ' ### ### '].join('\n');

function rawGridBfsOracle(maze: DonutMaze, policy: DonutPolicy): number | null {
  const maxDepth = policy.maxDepthFor(maze.portals.length);
  const stride = maze.rows * maze.cols;
  const seen = new Uint8Array(stride * (maxDepth + 1));
  const warpByCell = new Map(maze.portals.filter((p) => p.pairId >= 0).map((p) => [p.row * maze.cols + p.col, p] as const));
  const start = maze.portals[maze.startId]!;
  const goal = maze.portals[maze.goalId]!;
  const q: number[] = [start.row, start.col, 0, 0];
  seen[start.row * maze.cols + start.col] = 1;
  for (let i = 0; i < q.length; i += 4) {
    const [r, c, d, steps] = [q[i]!, q[i + 1]!, q[i + 2]!, q[i + 3]!];
    if (r === goal.row && c === goal.col && policy.isGoalDepth(d)) return steps;
    for (const [dr, dc] of DIRS_4) {
      const [nr, nc] = [r + dr, c + dc];
      const idx = d * stride + nr * maze.cols + nc;
      if (!maze.isOpen(nr, nc) || seen[idx] === 1) continue;
      seen[idx] = 1;
      q.push(nr, nc, d, steps + 1);
    }
    const p = warpByCell.get(r * maze.cols + c);
    if (!p) continue;
    const nd = policy.nextDepth(d, p.side, maxDepth);
    if (nd === null) continue;
    const target = maze.portals[p.pairId]!;
    const idx = nd * stride + target.row * maze.cols + target.col;
    if (seen[idx] === 1) continue;
    seen[idx] = 1;
    q.push(target.row, target.col, nd, steps + 1);
  }
  return null;
}

describe('solveDonutMaze', () => {
  it('solves official Example 1 in flat (23) and recursive (26) modes matching grid oracle', () => {
    const maze = parseDonutMaze(EXAMPLE_1);
    const flat = solveDonutMaze(maze, FLAT_DONUT_POLICY);
    const rec = solveDonutMaze(maze, RECURSIVE_DONUT_POLICY);
    expect(flat.totalSteps).toBe(23);
    expect(flat.maxDepthReached).toBe(0);
    expect(rec.totalSteps).toBe(26);
    expect(flat.totalSteps).toBe(rawGridBfsOracle(maze, FLAT_DONUT_POLICY));
    expect(rec.totalSteps).toBe(rawGridBfsOracle(maze, RECURSIVE_DONUT_POLICY));
  });

  it('solves official Example 2 in flat mode (58) and throws in recursive mode', () => {
    const maze = parseDonutMaze(EXAMPLE_2);
    const flat = solveDonutMaze(maze, FLAT_DONUT_POLICY);
    expect(flat.totalSteps).toBe(58);
    expect(flat.totalSteps).toBe(rawGridBfsOracle(maze, FLAT_DONUT_POLICY));
    expect(() => solveDonutMaze(maze, RECURSIVE_DONUT_POLICY)).toThrow(/No path found from AA to ZZ/);
    expect(rawGridBfsOracle(maze, RECURSIVE_DONUT_POLICY)).toBeNull();
  });

  it('handles diamond stale-heap entries, 0-step co-located AA/ZZ, and disconnected throws', () => {
    const diamond = parseDonutMaze(DIAMOND_STALE_HEAP);
    expect(solveDonutMaze(diamond, FLAT_DONUT_POLICY).totalSteps).toBe(
      rawGridBfsOracle(diamond, FLAT_DONUT_POLICY),
    );
    const colocatedMaze = parseDonutMaze(COLOCATED_MAZE);
    const colocated = solveDonutMaze(colocatedMaze, FLAT_DONUT_POLICY);
    expect(colocated.totalSteps).toBe(0);
    expect(colocated.hops).toEqual([
      { fromPortalId: colocatedMaze.startId, toPortalId: colocatedMaze.goalId, walkSteps: 0, warpedVia: null, depthAfter: 0 },
    ]);
    expect(() => solveDonutMaze(parseDonutMaze(DISCONNECTED_MAZE), FLAT_DONUT_POLICY)).toThrow(/No path found from AA to ZZ/);
  });

  it('dives into inner portals and resurfaces in recursive mode', () => {
    const maze = parseDonutMaze(RECURSIVE_DIVE_MINI);
    const flat = solveDonutMaze(maze, FLAT_DONUT_POLICY);
    const rec = solveDonutMaze(maze, RECURSIVE_DONUT_POLICY);
    expect(rec.maxDepthReached).toBe(1);
    expect(flat.totalSteps).toBe(rawGridBfsOracle(maze, FLAT_DONUT_POLICY));
    expect(rec.totalSteps).toBe(rawGridBfsOracle(maze, RECURSIVE_DONUT_POLICY));
  });
});
