import { describe, expect, it } from 'vitest';
import { analyzeReindeerMaze } from './dijkstra';
import { parseReindeerMaze } from './parse';
import {
  DIR_DELTAS,
  DIR_EAST,
  type Direction,
  type PathStep,
  ReindeerMaze,
  STEP_COST,
  TURN_COST,
  turnCcw,
  turnCw,
} from './types';

interface OracleResult {
  readonly isReachable: boolean;
  readonly bestScore: number;
  readonly optimalGrid: boolean[][];
  readonly optimalTileCount: number;
}

function spfaOracle(maze: ReindeerMaze): OracleResult {
  const totalStates = maze.cellCount * 4;
  const dist = new Array<number>(totalStates).fill(Infinity);
  const inQueue = new Array<boolean>(totalStates).fill(false);
  const reverseAdj: Array<Array<[number, number]>> = Array.from({ length: totalStates }, () => []);
  const queue: number[] = [];
  const startState = (maze.startCell << 2) | DIR_EAST;
  dist[startState] = 0;
  queue.push(startState);
  inQueue[startState] = true;

  for (let cell = 0; cell < maze.cellCount; cell += 1) {
    if (maze.isWallCell(cell)) continue;
    for (let d = 0; d < 4; d += 1) {
      const dir = d as Direction;
      const u = (cell << 2) | dir;
      reverseAdj[(cell << 2) | turnCw(dir)]!.push([u, TURN_COST]);
      reverseAdj[(cell << 2) | turnCcw(dir)]!.push([u, TURN_COST]);
      const next = maze.neighborCell(cell, dir);
      if (next !== -1) reverseAdj[(next << 2) | dir]!.push([u, STEP_COST]);
    }
  }
  for (let head = 0; head < queue.length; head += 1) {
    const u = queue[head]!;
    inQueue[u] = false;
    const du = dist[u]!;
    const cell = u >> 2;
    const dir = (u & 3) as Direction;
    const edges: Array<[number, number]> = [[(cell << 2) | turnCw(dir), TURN_COST], [(cell << 2) | turnCcw(dir), TURN_COST]];
    const next = maze.neighborCell(cell, dir);
    if (next !== -1) edges.push([(next << 2) | dir, STEP_COST]);
    for (const [v, w] of edges) {
      if (du + w < dist[v]!) {
        dist[v] = du + w;
        if (!inQueue[v]) { inQueue[v] = true; queue.push(v); }
      }
    }
  }
  let bestScore = Infinity;
  for (let d = 0; d < 4; d += 1) bestScore = Math.min(bestScore, dist[(maze.endCell << 2) | d]!);
  const optimalGrid = Array.from({ length: maze.height }, () => new Array<boolean>(maze.width).fill(false));
  let optimalTileCount = 0;
  if (Number.isFinite(bestScore)) {
    const seen = new Array<boolean>(totalStates).fill(false);
    const bfs: number[] = [];
    for (let d = 0; d < 4; d += 1) {
      const s = (maze.endCell << 2) | d;
      if (dist[s] === bestScore) { seen[s] = true; bfs.push(s); }
    }
    for (let i = 0; i < bfs.length; i += 1) {
      const v = bfs[i]!;
      const r = maze.rowOf(v >> 2);
      const c = maze.colOf(v >> 2);
      if (!optimalGrid[r]![c]) { optimalGrid[r]![c] = true; optimalTileCount += 1; }
      for (const [u, w] of reverseAdj[v]!) {
        if (!seen[u] && dist[u]! + w === dist[v]!) { seen[u] = true; bfs.push(u); }
      }
    }
  }
  return { isReachable: Number.isFinite(bestScore), bestScore, optimalGrid, optimalTileCount };
}

function assertLegalCanonicalPath(maze: ReindeerMaze, path: readonly PathStep[], bestScore: number): void {
  if (!Number.isFinite(bestScore)) { expect(path).toEqual([]); return; }
  expect(path.length).toBeGreaterThanOrEqual(2);
  expect(path[0]).toEqual({ row: maze.rowOf(maze.startCell), col: maze.colOf(maze.startCell), dir: DIR_EAST, cost: 0 });
  const last = path[path.length - 1]!;
  expect(maze.cellIndex(last.row, last.col)).toBe(maze.endCell);
  expect(last.cost).toBe(bestScore);
  for (let i = 1; i < path.length; i += 1) {
    const prev = path[i - 1]!;
    const cur = path[i]!;
    expect(maze.isWall(cur.row, cur.col)).toBe(false);
    if (cur.row === prev.row && cur.col === prev.col) {
      expect(cur.cost - prev.cost).toBe(TURN_COST);
      expect(cur.dir === turnCw(prev.dir) || cur.dir === turnCcw(prev.dir)).toBe(true);
    } else {
      const [dr, dc] = DIR_DELTAS[prev.dir];
      expect(cur.dir).toBe(prev.dir);
      expect(cur.row - prev.row).toBe(dr);
      expect(cur.col - prev.col).toBe(dc);
      expect(cur.cost - prev.cost).toBe(STEP_COST);
    }
  }
}

function verifyAgainstOracle(raw: string): void {
  const maze = parseReindeerMaze(raw);
  const actual = analyzeReindeerMaze(maze);
  const expected = spfaOracle(maze);
  expect(actual.isReachable).toBe(expected.isReachable);
  expect(actual.bestScore).toBe(expected.bestScore);
  expect(actual.optimalTileCount).toBe(expected.optimalTileCount);
  for (let r = 0; r < maze.height; r += 1) {
    for (let c = 0; c < maze.width; c += 1) expect(actual.isOptimalTile(r, c)).toBe(expected.optimalGrid[r]![c]);
  }
  assertLegalCanonicalPath(maze, actual.extractCanonicalPath(), expected.bestScore);
}

function makeSeededMaze(seed: number): string {
  let s = seed >>> 0;
  const next = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 0x100000000);
  const h = 7 + (seed % 5);
  const w = 7 + ((seed * 3) % 5);
  const rows: string[][] = Array.from({ length: h }, (_, r) =>
    Array.from({ length: w }, (_, c) => (r === 0 || r === h - 1 || c === 0 || c === w - 1 || next() < 0.28 ? '#' : '.')),
  );
  rows[h - 2]![1] = 'S';
  rows[1]![w - 2] = 'E';
  return rows.map((row) => row.join('')).join('\n');
}

describe('analyzeReindeerMaze differential oracle', () => {
  it('matches SPFA oracle on official examples and edge cases', () => {
    const cases = [
      '###############\n#.......#....E#\n#.#.###.#.###.#\n#.....#.#...#.#\n#.###.#####.#.#\n#.#.#.......#.#\n#.#.#####.###.#\n#...........#.#\n###.#.#####.#.#\n#...#.....#.#.#\n#.#.#.###.#.#.#\n#.....#...#.#.#\n#.###.#.#.#.#.#\n#S..#.....#...#\n###############',
      '#################\n#...#...#...#..E#\n#.#.#.#.#.#.#.#.#\n#.#.#.#...#...#.#\n#.#.#.#.###.#.#.#\n#...#.#.#.....#.#\n#.#.#.#.#.#####.#\n#.#...#.#.#.....#\n#.#.#####.#.###.#\n#.#.#.......#...#\n#.#.###.#####.###\n#.#.#...#.....#.#\n#.#.#.#####.###.#\n#.#.#.........#.#\n#.#.#.#########.#\n#S#.............#\n#################',
      '#####\n#S.E#\n#####', '#####\n#E.S#\n#####',
      '###\n#E#\n#.#\n#S#\n###', '###\n#S#\n#.#\n#E#\n###',
      '#######\n#.....#\n#.S#E.#\n#.....#\n#######', '#####\n#S#E#\n#####', '####\n#S##\n##E#\n####',
    ];
    for (const raw of cases) verifyAgainstOracle(raw);
  });

  it('matches SPFA oracle across 40 seeded random mazes', () => {
    for (let seed = 1; seed <= 40; seed += 1) verifyAgainstOracle(makeSeededMaze(seed));
  });
});
