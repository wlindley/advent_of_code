import { describe, expect, it } from 'vitest';
import { solver } from './index';

function naiveOracleSolve(raw: string): bigint {
  const digits = raw.trim().split('').map((c) => c.charCodeAt(0) - 48);
  const blocks: (number | null)[] = [];
  let fileId = 0;
  for (let i = 0; i < digits.length; i += 1) {
    const len = digits[i]!;
    if (i % 2 === 0) {
      for (let k = 0; k < len; k += 1) blocks.push(fileId);
      fileId += 1;
    } else {
      for (let k = 0; k < len; k += 1) blocks.push(null);
    }
  }
  let left = 0;
  let right = blocks.length - 1;
  while (left < right) {
    while (left < right && blocks[left] !== null) left += 1;
    while (left < right && blocks[right] === null) right -= 1;
    if (left < right) {
      blocks[left] = blocks[right]!;
      blocks[right] = null;
      left += 1;
      right -= 1;
    }
  }
  let sum = 0n;
  for (let pos = 0; pos < blocks.length; pos += 1) {
    const id = blocks[pos];
    if (id !== null && id !== undefined) sum += BigInt(pos) * BigInt(id);
  }
  return sum;
}

function makeSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  };
}

describe('2024 Day 9 Part 1 naive oracle parity', () => {
  it('matches the single-block swap oracle on official examples and edge cases', () => {
    const samples = [
      '12345',
      '2333133121414131402',
      '90909',
      '0',
      '5',
      '05',
      '052',
      '1234',
      '12325',
      '03025',
      '230',
      '10002',
    ];
    for (const raw of samples) {
      expect(solver.solve(solver.parse(raw))).toBe(naiveOracleSolve(raw));
    }
  });

  it('matches the single-block swap oracle across 80 deterministic PRNG disk maps', () => {
    const next = makeSeededRng(20241209);
    for (let trial = 0; trial < 80; trial += 1) {
      const length = 1 + (next() % 120);
      let raw = '';
      for (let i = 0; i < length; i += 1) {
        raw += String(next() % 10);
      }
      expect(solver.solve(solver.parse(raw))).toBe(naiveOracleSolve(raw));
    }
  });
});
