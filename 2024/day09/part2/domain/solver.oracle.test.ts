import { describe, expect, it } from 'vitest';
import {
  DiskBlockReplay,
  FREE_BLOCK,
  type DiskMap,
} from '../../shared';
import { planWholeFileCompaction, solver } from './index';

function linearSpanOracle(disk: DiskMap): bigint {
  const spans: { start: number; length: number }[] = [];
  for (const s of disk.freeSpans) {
    const prev = spans[spans.length - 1];
    if (prev && prev.start + prev.length === s.start) {
      prev.length += s.length;
    } else {
      spans.push({ start: s.start, length: s.length });
    }
  }
  const positions = disk.files.map((f) => ({ id: f.id, start: f.start, length: f.length }));
  for (let i = positions.length - 1; i >= 0; i -= 1) {
    const file = positions[i]!;
    if (file.length === 0) continue;
    for (const span of spans) {
      if (span.start >= file.start) break;
      if (span.length >= file.length) {
        file.start = span.start;
        span.start += file.length;
        span.length -= file.length;
        break;
      }
    }
  }
  let sum = 0n;
  for (const file of positions) {
    for (let k = 0; k < file.length; k += 1) {
      sum += BigInt(file.id) * BigInt(file.start + k);
    }
  }
  return sum;
}

function findFreeRun(blocks: Int32Array, length: number, limit: number): number {
  let run = 0;
  for (let pos = 0; pos < limit; pos += 1) {
    if (blocks[pos] === FREE_BLOCK) {
      run += 1;
      if (run === length) return pos - length + 1;
    } else {
      run = 0;
    }
  }
  return -1;
}

function flatBlockOracle(disk: DiskMap): { checksum: bigint; blocks: Int32Array } {
  const blocks = disk.expandToBlocks();
  for (let i = disk.files.length - 1; i >= 0; i -= 1) {
    const file = disk.files[i]!;
    if (file.length === 0) continue;
    const target = findFreeRun(blocks, file.length, file.start);
    if (target >= 0) {
      blocks.fill(file.id, target, target + file.length);
      blocks.fill(FREE_BLOCK, file.start, file.end);
    }
  }
  let checksum = 0n;
  for (let pos = 0; pos < blocks.length; pos += 1) {
    const id = blocks[pos]!;
    if (id !== FREE_BLOCK) checksum += BigInt(pos) * BigInt(id);
  }
  return { checksum, blocks };
}

function makeSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  };
}

describe('2024 Day 9 Part 2 dual oracle parity & replay', () => {
  it('matches both oracles and replay buffer across curated edge cases', () => {
    const samples = [
      '12345',
      '2333133121414131402',
      '90909',
      '0',
      '5',
      '05',
      '052',
      '13046',
      '1505059',
      '1304232',
      '230',
      '10002',
    ];
    for (const raw of samples) {
      const disk = solver.parse(raw);
      const actual = solver.solve(disk);
      const flat = flatBlockOracle(disk);
      expect(actual).toBe(linearSpanOracle(disk));
      expect(actual).toBe(flat.checksum);

      const moves = planWholeFileCompaction(disk);
      const replay = new DiskBlockReplay(disk, moves);
      const mid = Math.floor(moves.length / 2);
      replay.seek(moves.length);
      expect(Int32Array.from(replay.blocks)).toEqual(flat.blocks);
      replay.seek(mid);
      replay.seek(0);
      expect(Int32Array.from(replay.blocks)).toEqual(disk.expandToBlocks());
      replay.seek(moves.length);
      expect(Int32Array.from(replay.blocks)).toEqual(flat.blocks);
    }
  });

  it('matches both oracles across 100 deterministic PRNG disks including zero-heavy inputs', () => {
    const next = makeSeededRng(202412092);
    for (let trial = 0; trial < 100; trial += 1) {
      const length = 1 + (next() % 110);
      const zeroHeavy = trial % 3 === 0;
      let raw = '';
      for (let i = 0; i < length; i += 1) {
        const roll = next() % 10;
        raw += zeroHeavy && roll < 5 ? '0' : String(roll);
      }
      const disk = solver.parse(raw);
      const actual = solver.solve(disk);
      const flat = flatBlockOracle(disk);
      expect(actual).toBe(linearSpanOracle(disk));
      expect(actual).toBe(flat.checksum);
    }
  });
});
