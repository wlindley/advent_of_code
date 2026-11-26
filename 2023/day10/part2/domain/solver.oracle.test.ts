import { describe, expect, it } from 'vitest';
import { DIRS_4 } from '../../../../shared/core';
import { DIR_BITS, bitToDirIndex, parsePipeMaze, traceMainLoop, type MainLoop, type PipeMaze } from '../../shared';
import { analyzeEnclosedTiles } from './index';

const EXAMPLES: readonly { readonly raw: string; readonly expected: number }[] = [
  { expected: 1, raw: '.....\n.S-7.\n.|.|.\n.L-J.\n.....' },
  { expected: 1, raw: '7-F7-\n.FJ|7\nSJLL7\n|F--J\nLJ.LJ' },
  { expected: 4, raw: '...........\n.S-------7.\n.|F-----7|.\n.||.....||.\n.||.....||.\n.|L-7.F-J|.\n.|..|.|..|.\n.L--J.L--J.\n...........' },
  { expected: 4, raw: '..........\n.S------7.\n.|F----7|.\n.||....||.\n.||....||.\n.|L-7F-J|.\n.|..||..|.\n.L--JL--J.\n..........' },
  {
    expected: 8,
    raw: '.F----7F7F7F7F-7....\n.|F--7||||||||FJ....\n.||.FJ||||||||L7....\nFJL7L7LJLJ||LJ.L-7..\nL--J.L7...LJS7F-7L7.\n....F-J..F7FJ|L7L7L7\n....L7.F7||L7|.L7L7|\n.....|FJLJ|FJ|F7|.LJ\n....FJL-7.||.||||...\n....L---J.LJ.LJLJ...',
  },
  {
    expected: 10,
    raw: 'FF7FSF7F7F7F7F7F---7\nL|LJ||||||||||||F--J\nFL-7LJLJ||||||LJL-77\nF--JF--7||LJLJ7F7FJ-\nL---JF-JLJ.||-FJLJJ7\n|F|F-JF---7F7-L7L|7|\n|FFJF7L7F-JF7|JL---7\n7-L-JL7||F7|L7F-7F7|\nL.L7LFJ|||||FJL7||LJ\nL7JLJL-JLJLJL--JLJ.L',
  },
  { expected: 0, raw: 'S7\nLJ' },
];

/** Independent Oracle 1: Shoelace polygon area + Pick's theorem interior lattice count. */
function shoelacePicksInterior(loop: MainLoop): number {
  const n = loop.length;
  let twiceArea = 0;
  for (let i = 0; i < n; i += 1) {
    const a = loop.tiles[i]!;
    const b = loop.tiles[(i + 1) % n]!;
    twiceArea += a.row * b.col - a.col * b.row;
  }
  return (Math.abs(twiceArea) - n) / 2 + 1;
}

function buildExpandedWalls(maze: PipeMaze, loop: MainLoop, er: number, ec: number): Uint8Array {
  const wall = new Uint8Array(er * ec);
  for (const { row, col } of loop.tiles) {
    const cr = row * 2 + 1;
    const cc = col * 2 + 1;
    wall[cr * ec + cc] = 1;
    const mask = maze.effectiveMaskAt(row, col);
    for (const bit of DIR_BITS) {
      if ((mask & bit) === 0) continue;
      const [dr, dc] = DIRS_4[bitToDirIndex(bit)]!;
      wall[(cr + dr) * ec + (cc + dc)] = 1;
    }
  }
  return wall;
}

function floodOutside(wall: Uint8Array, er: number, ec: number): Uint8Array {
  const outside = new Uint8Array(er * ec);
  const queue = [0];
  outside[0] = 1;
  for (let head = 0; head < queue.length; head += 1) {
    const pos = queue[head]!;
    const r = Math.floor(pos / ec);
    const c = pos % ec;
    for (const [dr, dc] of DIRS_4) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= er || nc < 0 || nc >= ec) continue;
      const idx = nr * ec + nc;
      if (wall[idx] === 1 || outside[idx] === 1) continue;
      outside[idx] = 1;
      queue.push(idx);
    }
  }
  return outside;
}

/** Independent Oracle 2: 2x-expanded squeeze flood-fill BFS from outside border. */
function squeezeFloodFillMask(maze: PipeMaze, loop: MainLoop): Uint8Array {
  const er = maze.rows * 2 + 1;
  const ec = maze.cols * 2 + 1;
  const outside = floodOutside(buildExpandedWalls(maze, loop, er, ec), er, ec);
  const result = new Uint8Array(maze.rows * maze.cols);
  for (let r = 0; r < maze.rows; r += 1) {
    for (let c = 0; c < maze.cols; c += 1) {
      if (!loop.isOnLoop(r, c) && outside[(r * 2 + 1) * ec + (c * 2 + 1)] === 0) {
        result[r * maze.cols + c] = 1;
      }
    }
  }
  return result;
}

function assertMatchesBothOracles(raw: string, expectedCount?: number): void {
  const maze = parsePipeMaze(raw);
  const loop = traceMainLoop(maze);
  const analysis = analyzeEnclosedTiles(maze, loop);
  if (expectedCount !== undefined) expect(analysis.count).toBe(expectedCount);
  expect(analysis.count).toBe(shoelacePicksInterior(loop));
  const bfsMask = squeezeFloodFillMask(maze, loop);
  for (let r = 0; r < maze.rows; r += 1) {
    for (let c = 0; c < maze.cols; c += 1) {
      expect(analysis.isEnclosed(r, c)).toBe(bfsMask[r * maze.cols + c] === 1);
    }
  }
}

const MASK_TO_CHAR: Record<number, string> = { 5: '|', 10: '-', 3: 'L', 9: 'J', 12: '7', 6: 'F' };
const CLUTTER = ['.', '|', '-', 'L', 'J', '7', 'F'] as const;

function nextRng(rng: { state: number }, max: number): number {
  rng.state = (rng.state * 1664525 + 1013904223) >>> 0;
  return rng.state % max;
}

function deltaBit(dr: number, dc: number): number {
  return dr === -1 ? 1 : dc === 1 ? 2 : dr === 1 ? 4 : 8;
}

function buildCombCycle(rng: { state: number }, rows: number, cols: number): [number, number][] {
  const mid = Math.floor(rows / 2);
  const yTop = Array.from({ length: cols }, () => 1 + nextRng(rng, mid - 1));
  const yBot = Array.from({ length: cols }, () => mid + 1 + nextRng(rng, rows - 2 - mid));
  yTop[cols - 2] = yTop[cols - 3]!;
  yBot[cols - 2] = yBot[cols - 3]!;
  const cycle: [number, number][] = [];
  for (let r = yBot[1]!; r >= yTop[1]!; r -= 1) cycle.push([r, 1]);
  for (let c = 2; c <= cols - 2; c += 1) {
    const step = yTop[c]! >= yTop[c - 1]! ? 1 : -1;
    for (let r = yTop[c - 1]!; r !== yTop[c]!; r += step) cycle.push([r, c]);
    cycle.push([yTop[c]!, c]);
  }
  for (let r = yTop[cols - 2]! + 1; r < yBot[cols - 2]!; r += 1) cycle.push([r, cols - 2]);
  for (let c = cols - 2; c >= 2; c -= 1) {
    const step = yBot[c - 1]! >= yBot[c]! ? 1 : -1;
    for (let r = yBot[c]!; r !== yBot[c - 1]!; r += step) cycle.push([r, c]);
    cycle.push([yBot[c - 1]!, c]);
  }
  return cycle;
}

function buildSeededCombMaze(seed: number, rows: number, cols: number): string {
  const rng = { state: seed >>> 0 };
  const cycle = buildCombCycle(rng, rows, cols);
  const grid: string[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => CLUTTER[nextRng(rng, CLUTTER.length)]!),
  );
  const sIdx = nextRng(rng, cycle.length);
  for (let i = 0; i < cycle.length; i += 1) {
    const [r, c] = cycle[i]!;
    const [pr, pc] = cycle[(i - 1 + cycle.length) % cycle.length]!;
    const [nr, nc] = cycle[(i + 1) % cycle.length]!;
    grid[r]![c] = i === sIdx ? 'S' : MASK_TO_CHAR[deltaBit(pr - r, pc - c) | deltaBit(nr - r, nc - c)]!;
  }
  const [sr, sc] = cycle[sIdx]!;
  for (const [dr, dc] of DIRS_4) {
    const nr = sr + dr;
    const nc = sc + dc;
    if (grid[nr]?.[nc] !== undefined && !cycle.some(([cr, cc]) => cr === nr && cc === nc)) grid[nr]![nc] = '.';
  }
  return grid.map((row) => row.join('')).join('\n');
}

describe('Part 2 differential oracles', () => {
  it('agrees with Shoelace+Pick and 2x squeeze BFS on all reference examples', () => {
    for (const { raw, expected } of EXAMPLES) assertMatchesBothOracles(raw, expected);
  });

  it('agrees with both oracles across all 6 inferred S pipe shapes', () => {
    for (const raw of ['F-7\nS.|\nL-J', 'FS7\n|.|\nL-J', 'F-7\n|.|\nS-J', 'F-7\n|.|\nL-S', 'F-S\n|.|\nL-J', 'S-7\n|.|\nL-J']) {
      assertMatchesBothOracles(raw, 1);
    }
  });

  it('agrees cell-by-cell across seeded non-convex comb and squeezed cluttered mazes', () => {
    for (let seed = 1; seed <= 25; seed += 1) assertMatchesBothOracles(buildSeededCombMaze(seed, 13, 16));
  });
});
