import { describe, expect, it } from 'vitest';
import {
  DECODER_V1_POLICY,
  DECODER_V2_POLICY,
  DockingSolver,
  WORD_BITS,
} from './index';

function applyV1StringMask(mask: string, value: bigint): bigint {
  const bits = value.toString(2).padStart(WORD_BITS, '0');
  let out = '';
  for (let i = 0; i < WORD_BITS; i += 1) {
    const mc = mask.charAt(i);
    out += mc === 'X' ? bits.charAt(i) : mc;
  }
  return BigInt(`0b${out}`);
}

function expandV2StringAddresses(mask: string, address: bigint): bigint[] {
  const bits = address.toString(2).padStart(WORD_BITS, '0');
  let prefixes = [''];
  for (let i = 0; i < WORD_BITS; i += 1) {
    const mc = mask.charAt(i);
    if (mc === 'X') {
      prefixes = prefixes.flatMap((p) => [`${p}0`, `${p}1`]);
    } else {
      const ch = mc === '1' ? '1' : bits.charAt(i);
      prefixes = prefixes.map((p) => `${p}${ch}`);
    }
  }
  return prefixes.map((p) => BigInt(`0b${p}`));
}

function oracleSolveV1(raw: string): bigint {
  const mem = new Map<bigint, bigint>();
  let mask = 'X'.repeat(WORD_BITS);
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0) continue;
    if (line.startsWith('mask = ')) {
      mask = line.slice(7);
    } else {
      const match = /^mem\[(\d+)\] = (\d+)$/.exec(line)!;
      mem.set(BigInt(match[1]!), applyV1StringMask(mask, BigInt(match[2]!)));
    }
  }
  let total = 0n;
  for (const val of mem.values()) total += val;
  return total;
}

function oracleSolveV2(raw: string): bigint {
  const mem = new Map<string, bigint>();
  let mask = '0'.repeat(WORD_BITS);
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0) continue;
    if (line.startsWith('mask = ')) {
      mask = line.slice(7);
    } else {
      const match = /^mem\[(\d+)\] = (\d+)$/.exec(line)!;
      const val = BigInt(match[2]!);
      for (const addr of expandV2StringAddresses(mask, BigInt(match[1]!))) {
        mem.set(addr.toString(), val);
      }
    }
  }
  let total = 0n;
  for (const val of mem.values()) total += val;
  return total;
}

function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  };
}

function generateProgram(nextRand: () => number, maxFloating: number): string {
  const lines: string[] = [];
  const blockCount = 2 + (nextRand() % 3);
  const addresses = Array.from({ length: 5 }, () =>
    (BigInt(nextRand()) << 4n) ^ BigInt(nextRand() % 32),
  );
  for (let b = 0; b < blockCount; b += 1) {
    const chars: string[] = Array.from({ length: WORD_BITS }, () => (nextRand() % 2 === 0 ? '0' : '1'));
    const floatCount = nextRand() % (maxFloating + 1);
    for (let f = 0; f < floatCount; f += 1) {
      chars[nextRand() % WORD_BITS] = 'X';
    }
    lines.push(`mask = ${chars.join('')}`);
    const writeCount = 2 + (nextRand() % 4);
    for (let w = 0; w < writeCount; w += 1) {
      const addr = addresses[nextRand() % addresses.length]!;
      const val = (BigInt(nextRand()) << 4n) | BigInt(nextRand() % 16);
      lines.push(`mem[${addr}] = ${val}`);
    }
  }
  return lines.join('\n');
}

describe('2020 Day 14 independent binary-string differential oracle', () => {
  const v1Solver = new DockingSolver(DECODER_V1_POLICY);
  const v2Solver = new DockingSolver(DECODER_V2_POLICY);

  it('matches official Part 1 (165n) and Part 2 (208n) examples', () => {
    const ex1 = [
      'mask = XXXXXXXXXXXXXXXXXXXXXXXXXXXXX1XXXX0X',
      'mem[8] = 11',
      'mem[7] = 101',
      'mem[8] = 0',
    ].join('\n');
    const ex2 = [
      'mask = 000000000000000000000000000000X1001X',
      'mem[42] = 100',
      'mask = 00000000000000000000000000000000X0XX',
      'mem[26] = 1',
    ].join('\n');

    expect(oracleSolveV1(ex1)).toBe(165n);
    expect(v1Solver.solve(v1Solver.parse(ex1))).toBe(165n);
    expect(oracleSolveV2(ex2)).toBe(208n);
    expect(v2Solver.solve(v2Solver.parse(ex2))).toBe(208n);
  });

  it('matches both v1 and v2 string oracles across 40 seeded PRNG programs', () => {
    const nextRand = createRng(20201401);
    for (let i = 0; i < 40; i += 1) {
      const raw = generateProgram(nextRand, 4);
      expect(v1Solver.solve(v1Solver.parse(raw))).toBe(oracleSolveV1(raw));
      expect(v2Solver.solve(v2Solver.parse(raw))).toBe(oracleSolveV2(raw));
    }
  });
});
