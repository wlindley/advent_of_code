import { describe, expect, it } from 'vitest';
import { DIRS_4, DisjointSet } from '../../../../shared/core';
import {
  DIR_BITS,
  bitToDirIndex,
  createCoord,
  oppositeBit,
  traceMainLoop,
  type PipeMaze,
  type PipeSymbol,
} from '../../shared';
import { solver } from './index';

function bfsDistancesFromStart(maze: PipeMaze): Int32Array {
  const dist = new Int32Array(maze.size).fill(-1);
  const queue: number[] = [];
  const startIdx = maze.start.row * maze.cols + maze.start.col;
  dist[startIdx] = 0;
  queue.push(startIdx);

  for (let head = 0; head < queue.length; head += 1) {
    const idx = queue[head]!;
    const row = Math.floor(idx / maze.cols);
    const col = idx % maze.cols;
    const coord = createCoord(row, col);
    for (const bit of DIR_BITS) {
      const next = maze.stepFrom(coord, bit);
      if (!next) continue;
      const nextIdx = next.row * maze.cols + next.col;
      if (dist[nextIdx] !== -1) continue;
      dist[nextIdx] = dist[idx]! + 1;
      queue.push(nextIdx);
    }
  }
  return dist;
}

function buildReciprocalDsu(maze: PipeMaze): DisjointSet {
  const dsu = new DisjointSet(maze.size);
  for (let r = 0; r < maze.rows; r += 1) {
    for (let c = 0; c < maze.cols; c += 1) {
      const mask = maze.effectiveMaskAt(r, c);
      for (const bit of DIR_BITS) {
        if ((mask & bit) === 0) continue;
        const [dr, dc] = DIRS_4[bitToDirIndex(bit)]!;
        const nr = r + dr;
        const nc = c + dc;
        if (!maze.inBounds(nr, nc)) continue;
        if ((maze.effectiveMaskAt(nr, nc) & oppositeBit(bit)) !== 0) {
          dsu.union(r * maze.cols + c, nr * maze.cols + nc);
        }
      }
    }
  }
  return dsu;
}

function seededPrng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function makeProceduralClutteredMaze(rows: number, cols: number, seed: number): string {
  const rng = seededPrng(seed);
  const clutterTiles: readonly PipeSymbol[] = ['.', '|', '-', 'L', 'J', '7', 'F'];
  const grid: PipeSymbol[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => clutterTiles[Math.floor(rng() * clutterTiles.length)]!),
  );
  const top = 1;
  const bottom = rows - 2;
  const left = 1;
  const right = cols - 2;
  for (let c = left + 1; c < right; c += 1) {
    grid[top]![c] = '-';
    grid[bottom]![c] = '-';
  }
  for (let r = top + 1; r < bottom; r += 1) {
    grid[r]![left] = '|';
    grid[r]![right] = '|';
  }
  grid[top]![left] = 'F';
  grid[top]![right] = '7';
  grid[bottom]![left] = 'L';
  grid[bottom]![right] = 'J';
  if (right - left === 1) {
    grid[top - 1]![left] = '.';
    grid[top]![left - 1] = '.';
    grid[top]![left] = 'S';
  } else {
    grid[top - 1]![left + 1] = '.';
    grid[top + 1]![left + 1] = '.';
    grid[top]![left + 1] = 'S';
  }
  return grid.map((row) => row.join('')).join('\n');
}

describe('2023 Day 10 Part 1 differential oracles', () => {
  const corpus = [
    ['.....', '.S-7.', '.|.|.', '.L-J.', '.....'].join('\n'),
    ['-L|F7', '7S-7|', 'L|7||', '-L-J|', 'L|-JF'].join('\n'),
    ['..F7.', '.FJ|.', 'SJ.L7', '|F--J', 'LJ...'].join('\n'),
    ['7-F7-', '.FJ|7', 'SJLL7', '|F--J', 'LJ.LJ'].join('\n'),
    ['F7', 'S|', 'LJ'].join('\n'),
    ['FS7', 'L-J'].join('\n'),
    ['F7', 'SJ'].join('\n'),
    ['F7', 'LS'].join('\n'),
    ['FS', 'LJ'].join('\n'),
    ['S7', 'LJ'].join('\n'),
    makeProceduralClutteredMaze(4, 4, 101),
    makeProceduralClutteredMaze(9, 11, 202),
    makeProceduralClutteredMaze(20, 20, 303),
    makeProceduralClutteredMaze(30, 30, 404),
  ];

  it('matches full-grid BFS distances and DisjointSet component equivalence on all corpus mazes', () => {
    for (const raw of corpus) {
      const maze = solver.parse(raw);
      const loop = traceMainLoop(maze);
      const bfs = bfsDistancesFromStart(maze);
      const dsu = buildReciprocalDsu(maze);
      const startIdx = maze.start.row * maze.cols + maze.start.col;

      expect(dsu.sizeOf(startIdx)).toBe(loop.length);
      expect(dsu.sizeOf(startIdx) / 2).toBe(solver.solve(maze));

      for (let r = 0; r < maze.rows; r += 1) {
        for (let c = 0; c < maze.cols; c += 1) {
          const cellIdx = r * maze.cols + c;
          expect(loop.distanceAt(r, c)).toBe(bfs[cellIdx]);
          expect(loop.isOnLoop(r, c)).toBe(dsu.connected(startIdx, cellIdx));
        }
      }
    }
  });
});
