import { describe, expect, it } from 'vitest';
import { DIRS_4, DisjointSet } from '../../../shared/core';
import { findShortestPath } from './bfs';
import { type ByteCoord, MemorySpace, NEVER_CORRUPTED } from './model';

function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function setBasedBfs(gridSize: number, corrupted: ReadonlySet<string>): number | null {
  const start = '0,0';
  const goal = `${gridSize - 1},${gridSize - 1}`;
  if (corrupted.has(start) || corrupted.has(goal)) return null;
  if (start === goal) return 0;

  const visited = new Set<string>([start]);
  const queue: Array<[number, number, number]> = [[0, 0, 0]];
  let head = 0;

  while (head < queue.length) {
    const [x, y, dist] = queue[head++]!;
    for (const [dy, dx] of DIRS_4) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= gridSize || ny < 0 || ny >= gridSize) continue;
      const key = `${nx},${ny}`;
      if (corrupted.has(key) || visited.has(key)) continue;
      if (key === goal) return dist + 1;
      visited.add(key);
      queue.push([nx, ny, dist + 1]);
    }
  }
  return null;
}

function dsuReverseReachability(memory: MemorySpace): boolean[] {
  const size = memory.gridSize;
  const total = memory.cellCount;
  const fallen = new Uint8Array(total);
  const effectiveIndices: number[] = [];

  for (let i = 0; i < memory.byteCount; i += 1) {
    const b = memory.bytes[i]!;
    const idx = b.y * size + b.x;
    if (fallen[idx] === 0) {
      fallen[idx] = 1;
      effectiveIndices.push(i);
    }
  }

  const dsu = new DisjointSet(total);
  const open = new Uint8Array(total);
  const activate = (idx: number): void => {
    if (open[idx] === 1) return;
    open[idx] = 1;
    const x = idx % size;
    const y = (idx - x) / size;
    for (const [dy, dx] of DIRS_4) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= size || ny < 0 || ny >= size) continue;
      const nIdx = ny * size + nx;
      if (open[nIdx] === 1) dsu.union(idx, nIdx);
    }
  };

  for (let idx = 0; idx < total; idx += 1) {
    if (memory.firstFallAt(idx % size, (idx - (idx % size)) / size) === NEVER_CORRUPTED) {
      activate(idx);
    }
  }

  const goal = total - 1;
  const isGoalOpen = () => open[0] === 1 && open[goal] === 1 && dsu.connected(0, goal);
  const reachableAfter: boolean[] = new Array(memory.byteCount + 1).fill(false);
  reachableAfter[memory.byteCount] = isGoalOpen();

  const effectiveSet = new Set(effectiveIndices);
  for (let k = memory.byteCount - 1; k >= 0; k -= 1) {
    if (effectiveSet.has(k)) {
      const b = memory.bytes[k]!;
      activate(b.y * size + b.x);
    }
    reachableAfter[k] = isGoalOpen();
  }
  return reachableAfter;
}

describe('findShortestPath differential oracles', () => {
  it('matches independent Set<string> BFS across 60 seeded random grids with duplicates', () => {
    const sizes = [1, 2, 3, 5, 7, 11, 15];
    const rand = createRng(20241801);

    for (let trial = 0; trial < 60; trial += 1) {
      const gridSize = sizes[trial % sizes.length]!;
      const byteCount = Math.floor(rand() * gridSize * gridSize * 1.2);
      const bytes: ByteCoord[] = [];
      for (let i = 0; i < byteCount; i += 1) {
        if (i > 0 && rand() < 0.2) {
          bytes.push(bytes[Math.floor(rand() * i)]!);
        } else {
          bytes.push({ x: Math.floor(rand() * gridSize), y: Math.floor(rand() * gridSize) });
        }
      }
      if (trial % 7 === 0) bytes.push({ x: 0, y: 0 });
      if (trial % 11 === 0) bytes.push({ x: gridSize - 1, y: gridSize - 1 });

      const space = new MemorySpace(gridSize, bytes);
      const k = Math.floor(rand() * (bytes.length + 3));
      const applied = Math.min(k, bytes.length);
      const corrupted = new Set(bytes.slice(0, applied).map((b) => `${b.x},${b.y}`));

      const expectedDist = setBasedBfs(gridSize, corrupted);
      const actual = findShortestPath(space, k);

      expect(actual.reachable).toBe(expectedDist !== null);
      expect(actual.distance).toBe(expectedDist);
      if (expectedDist !== null) {
        expect(actual.path).toHaveLength(expectedDist + 1);
        expect(actual.path[0]).toEqual({ x: 0, y: 0 });
        expect(actual.path[expectedDist]).toEqual({ x: gridSize - 1, y: gridSize - 1 });
        for (let p = 0; p < actual.path.length; p += 1) {
          const cell = actual.path[p]!;
          expect(space.isCorruptedAt(cell.x, cell.y, applied)).toBe(false);
          if (p > 0) {
            const prev = actual.path[p - 1]!;
            expect(Math.abs(cell.x - prev.x) + Math.abs(cell.y - prev.y)).toBe(1);
          }
        }
      }
    }
  });

  it('matches reverse-time DisjointSet reachability for every k in [0..B]', () => {
    const rand = createRng(20241802);
    for (let trial = 0; trial < 12; trial += 1) {
      const gridSize = 4 + (trial % 5);
      const byteCount = gridSize * gridSize + 4;
      const bytes: ByteCoord[] = Array.from({ length: byteCount }, () => ({
        x: Math.floor(rand() * gridSize),
        y: Math.floor(rand() * gridSize),
      }));
      const space = new MemorySpace(gridSize, bytes);
      const dsuReachable = dsuReverseReachability(space);

      for (let k = 0; k <= space.byteCount; k += 1) {
        expect(findShortestPath(space, k).reachable).toBe(dsuReachable[k]);
      }
    }
  });
});
