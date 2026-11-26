import { describe, expect, it } from 'vitest';
import { type ByteCoord, MemorySpace, findShortestPath } from '../../shared';
import { findBlockingByte } from './blockingByte';

function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function binarySearchOracle(memory: MemorySpace): number | null {
  if (findShortestPath(memory, memory.byteCount).reachable) return null;
  let lo = 1;
  let hi = memory.byteCount;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (findShortestPath(memory, mid).reachable) lo = mid + 1;
    else hi = mid;
  }
  return lo - 1;
}

function linearForwardOracle(memory: MemorySpace): number | null {
  for (let k = 1; k <= memory.byteCount; k += 1) {
    if (!findShortestPath(memory, k).reachable) return k - 1;
  }
  return null;
}

function generateRandomMemory(rand: () => number, gridSize: number, maxBytes: number): MemorySpace {
  const count = Math.floor(rand() * maxBytes);
  const bytes: ByteCoord[] = [];
  for (let i = 0; i < count; i += 1) {
    if (i > 0 && rand() < 0.25) {
      bytes.push(bytes[Math.floor(rand() * i)]!);
    } else {
      bytes.push({ x: Math.floor(rand() * gridSize), y: Math.floor(rand() * gridSize) });
    }
  }
  return new MemorySpace(gridSize, bytes);
}

describe('findBlockingByte differential oracles', () => {
  it('matches binary-search BFS oracle across 80 seeded grids including 1x1, duplicates, and endpoint hits', () => {
    const sizes = [1, 2, 3, 5, 7, 10];
    const rand = createRng(20241802);

    for (let trial = 0; trial < 80; trial += 1) {
      const gridSize = sizes[trial % sizes.length]!;
      const memory = generateRandomMemory(rand, gridSize, gridSize * gridSize * 2 + 2);
      const expected = binarySearchOracle(memory);
      const actual = findBlockingByte(memory);
      expect(actual ? actual.byteIndex : null).toBe(expected);
      if (actual) expect(actual.byte).toEqual(memory.bytes[expected!]!);
    }
  });

  it('matches linear forward BFS oracle across 25 small seeded grids', () => {
    const rand = createRng(20241825);
    for (let trial = 0; trial < 25; trial += 1) {
      const gridSize = 1 + (trial % 5);
      const memory = generateRandomMemory(rand, gridSize, gridSize * gridSize + 4);
      const expected = linearForwardOracle(memory);
      const actual = findBlockingByte(memory);
      expect(actual ? actual.byteIndex : null).toBe(expected);
    }
  });
});
