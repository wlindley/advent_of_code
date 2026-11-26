import { describe, expect, it } from 'vitest';
import {
  DIR_EAST, type Direction, oppositeDir, type ReindeerMaze,
  STEP_COST, TURN_COST, turnCcw, turnCw,
} from '../../shared';
import { solver } from './index';

interface HeapItem { readonly state: number; readonly cost: number; }

class SimpleMinHeap {
  private readonly items: HeapItem[] = [];
  get size(): number { return this.items.length; }
  push(state: number, cost: number): void {
    this.items.push({ state, cost });
    let i = this.items.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.items[p]!.cost <= this.items[i]!.cost) break;
      const tmp = this.items[p]!; this.items[p] = this.items[i]!; this.items[i] = tmp;
      i = p;
    }
  }
  pop(): HeapItem {
    const top = this.items[0]!;
    const last = this.items.pop()!;
    if (this.items.length > 0) { this.items[0] = last; this.siftDown(0); }
    return top;
  }
  private siftDown(i: number): void {
    const n = this.items.length;
    while (true) {
      let best = i;
      const l = 2 * i + 1;
      const r = l + 1;
      if (l < n && this.items[l]!.cost < this.items[best]!.cost) best = l;
      if (r < n && this.items[r]!.cost < this.items[best]!.cost) best = r;
      if (best === i) break;
      const tmp = this.items[i]!; this.items[i] = this.items[best]!; this.items[best] = tmp;
      i = best;
    }
  }
}

function runDijkstra(maze: ReindeerMaze, seeds: readonly number[], reverse: boolean): Float64Array {
  const dist = new Float64Array(maze.cellCount * 4).fill(Infinity);
  const heap = new SimpleMinHeap();
  for (const s of seeds) { dist[s] = 0; heap.push(s, 0); }
  while (heap.size > 0) {
    const { state, cost } = heap.pop();
    if (cost > dist[state]!) continue;
    const cell = state >> 2;
    const dir = (state & 3) as Direction;
    const adjCell = maze.neighborCell(cell, reverse ? oppositeDir(dir) : dir);
    if (adjCell !== -1) relax(heap, dist, (adjCell << 2) | dir, cost + STEP_COST);
    relax(heap, dist, (cell << 2) | turnCw(dir), cost + TURN_COST);
    relax(heap, dist, (cell << 2) | turnCcw(dir), cost + TURN_COST);
  }
  return dist;
}

function relax(heap: SimpleMinHeap, dist: Float64Array, next: number, cost: number): void {
  if (cost < dist[next]!) { dist[next] = cost; heap.push(next, cost); }
}

function bidirectionalOracleCount(maze: ReindeerMaze): number {
  const distStart = runDijkstra(maze, [(maze.startCell << 2) | DIR_EAST], false);
  const endSeeds = [0, 1, 2, 3].map((d) => (maze.endCell << 2) | d);
  const distEnd = runDijkstra(maze, endSeeds, true);
  let bestScore = Infinity;
  for (const s of endSeeds) bestScore = Math.min(bestScore, distStart[s]!);
  if (!Number.isFinite(bestScore)) return 0;
  let seats = 0;
  for (let c = 0; c < maze.cellCount; c += 1) {
    const base = c << 2;
    const onOptimal = [0, 1, 2, 3].some((d) => distStart[base + d]! + distEnd[base + d]! === bestScore);
    if (onOptimal) seats += 1;
  }
  return seats;
}

interface DfsContext {
  readonly maze: ReindeerMaze;
  readonly onPath: Uint8Array;
  readonly bestAtState: Float64Array;
  readonly pathCells: number[];
  readonly optimalCells: Set<number>;
  bestScore: number;
}

function dfsVisit(ctx: DfsContext, state: number, cost: number): void {
  if (cost > ctx.bestScore || cost > ctx.bestAtState[state]! || ctx.onPath[state]! !== 0) return;
  ctx.bestAtState[state] = cost;
  const cell = state >> 2;
  ctx.onPath[state] = 1;
  ctx.pathCells.push(cell);
  if (cell === ctx.maze.endCell) {
    if (cost < ctx.bestScore) { ctx.bestScore = cost; ctx.optimalCells.clear(); }
    for (const c of ctx.pathCells) ctx.optimalCells.add(c);
  } else {
    const dir = (state & 3) as Direction;
    const nextCell = ctx.maze.neighborCell(cell, dir);
    if (nextCell !== -1) dfsVisit(ctx, (nextCell << 2) | dir, cost + STEP_COST);
    dfsVisit(ctx, (cell << 2) | turnCw(dir), cost + TURN_COST);
    dfsVisit(ctx, (cell << 2) | turnCcw(dir), cost + TURN_COST);
  }
  ctx.pathCells.pop();
  ctx.onPath[state] = 0;
}

function exhaustiveDfsOracleCount(maze: ReindeerMaze): number {
  const ctx: DfsContext = {
    maze,
    onPath: new Uint8Array(maze.cellCount * 4),
    bestAtState: new Float64Array(maze.cellCount * 4).fill(Infinity),
    pathCells: [],
    optimalCells: new Set<number>(),
    bestScore: Infinity,
  };
  dfsVisit(ctx, (maze.startCell << 2) | DIR_EAST, 0);
  return ctx.optimalCells.size;
}

function makeSeededMaze(seed: number): ReindeerMaze {
  let s = seed >>> 0;
  const h = 7 + (seed % 5);
  const w = 7 + ((seed * 3) % 5);
  const rows: string[][] = Array.from({ length: h }, (_, r) =>
    Array.from({ length: w }, (_, c) => {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return r === 0 || r === h - 1 || c === 0 || c === w - 1 || s / 0x100000000 < 0.25 ? '#' : '.';
    }),
  );
  rows[h - 2]![1] = 'S';
  rows[1]![w - 2] = 'E';
  return solver.parse(rows.map((row) => row.join('')).join('\n'));
}

const FIXED_CASES: readonly string[] = [
  '###############\n#.......#....E#\n#.#.###.#.###.#\n#.....#.#...#.#\n#.###.#####.#.#\n#.#.#.......#.#\n#.#.#####.###.#\n#...........#.#\n###.#.#####.#.#\n#...#.....#.#.#\n#.#.#.###.#.#.#\n#.....#...#.#.#\n#.###.#.#.#.#.#\n#S..#.....#...#\n###############',
  '#################\n#...#...#...#..E#\n#.#.#.#.#.#.#.#.#\n#.#.#.#...#...#.#\n#.#.#.#.###.#.#.#\n#...#.#.#.....#.#\n#.#.#.#.#.#####.#\n#.#...#.#.#.....#\n#.#.#####.#.###.#\n#.#.#.......#...#\n#.#.###.#####.###\n#.#.#...#.....#.#\n#.#.#.#####.###.#\n#.#.#.........#.#\n#.#.#.#########.#\n#S#.............#\n#################',
  '########\n#....###\n#S##..E#\n#....###\n########',
  '#####\n#...#\n#S#E#\n#...#\n#####',
  '#####\n#E.S#\n#####',
];

const SMALL_TIE_MAZES: readonly string[] = [
  '#######\n#.....#\n#.#.#.#\n#S...E#\n#.#.#.#\n#.....#\n#######',
  '#######\n#...#E#\n#.#.#.#\n#.#...#\n#S..#.#\n#.....#\n#######',
  '#####\n#...#\n#S#E#\n#...#\n#####',
  '#######\n#....E#\n#.#.###\n#.#...#\n#S..#.#\n#.....#\n#######',
];

describe('2024 Day 16 Part 2 differential oracles', () => {
  it('matches bidirectional Dijkstra oracle on fixed cases and examples', () => {
    for (const raw of FIXED_CASES) {
      const maze = solver.parse(raw);
      expect(solver.solve(maze)).toBe(bidirectionalOracleCount(maze));
    }
  });

  it('matches bidirectional Dijkstra oracle across 30 seeded random reachable mazes', () => {
    let checked = 0;
    for (let seed = 1; checked < 30; seed += 1) {
      const maze = makeSeededMaze(seed);
      const expected = bidirectionalOracleCount(maze);
      if (expected === 0) continue;
      expect(solver.solve(maze)).toBe(expected);
      checked += 1;
    }
    expect(checked).toBe(30);
  });

  it('matches exhaustive state-visited DFS oracle on <= 7x7 tie-heavy mazes', () => {
    for (const raw of SMALL_TIE_MAZES) {
      const maze = solver.parse(raw);
      expect(solver.solve(maze)).toBe(exhaustiveDfsOracleCount(maze));
    }
  });
});
