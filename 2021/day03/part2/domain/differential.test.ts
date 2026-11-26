import { describe, expect, it } from 'vitest';
import { DiagnosticReport } from '../../shared';
import { analyzeLifeSupport, solver, traceLifeSupport } from './index';

const AOC_EXAMPLE = [
  '00100',
  '11110',
  '10110',
  '10111',
  '10101',
  '01111',
  '00111',
  '11100',
  '10000',
  '11001',
  '00010',
  '01010',
].join('\n');

class TrieNode {
  count = 0;
  child0: TrieNode | null = null;
  child1: TrieNode | null = null;
}

function insertTrieRow(root: TrieNode, bits: string): void {
  let node = root;
  node.count += 1;
  for (let i = 0; i < bits.length; i += 1) {
    const bit = bits[i];
    if (bit === '1') {
      if (node.child1 === null) node.child1 = new TrieNode();
      node = node.child1;
    } else {
      if (node.child0 === null) node.child0 = new TrieNode();
      node = node.child0;
    }
    node.count += 1;
  }
}

function chooseTrieBit(c0: number, c1: number, mode: 'o2' | 'co2'): '0' | '1' {
  if (c0 === 0) return '1';
  if (c1 === 0) return '0';
  if (mode === 'o2') return c1 >= c0 ? '1' : '0';
  return c1 < c0 ? '1' : '0';
}

function queryTrieRating(root: TrieNode, width: number, mode: 'o2' | 'co2'): bigint {
  let node = root;
  let bits = '';
  for (let col = 0; col < width; col += 1) {
    const c0 = node.child0 !== null ? node.child0.count : 0;
    const c1 = node.child1 !== null ? node.child1.count : 0;
    const bit = chooseTrieBit(c0, c1, mode);
    bits += bit;
    node = bit === '1' ? node.child1! : node.child0!;
  }
  return BigInt('0b' + bits);
}

function solveWithTrieOracle(rows: readonly string[]): { o2: bigint; co2: bigint; product: bigint } {
  const root = new TrieNode();
  for (const row of rows) {
    insertTrieRow(root, row);
  }
  const width = rows[0]!.length;
  const o2 = queryTrieRating(root, width, 'o2');
  const co2 = queryTrieRating(root, width, 'co2');
  return { o2, co2, product: o2 * co2 };
}

class Xorshift32 {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0 || 1;
  }

  nextInt(bound: number): number {
    let x = this.state;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.state = x >>> 0;
    return this.state % bound;
  }
}

function generateFixtureRows(rng: Xorshift32, fixtureIndex: number): string[] {
  const width = 1 + rng.nextInt(72);
  const rowCount = 1 + rng.nextInt(200);
  const biasPct = fixtureIndex % 3 === 0 ? 85 : fixtureIndex % 3 === 1 ? 15 : 50;
  const duplicatePoolSize = fixtureIndex % 5 === 0 ? Math.max(1, Math.min(4, rowCount)) : rowCount;
  const pool: string[] = [];
  for (let r = 0; r < duplicatePoolSize; r += 1) {
    let row = '';
    for (let c = 0; c < width; c += 1) {
      row += rng.nextInt(100) < biasPct ? '1' : '0';
    }
    pool.push(row);
  }
  const rows: string[] = [];
  for (let r = 0; r < rowCount; r += 1) {
    rows.push(pool[r % duplicatePoolSize]!);
  }
  return rows;
}

describe('solver contract', () => {
  it('parses, solves AoC example to 230n, and produces bounded traces', () => {
    const report = solver.parse(AOC_EXAMPLE);
    expect(solver.solve(report)).toBe(230n);
    expect(Object.isFrozen(solver)).toBe(true);

    const fullTrace = solver.trace!(report);
    expect(fullTrace).toHaveLength(6);
    const bounded = solver.trace!(report, { maxSteps: 2 });
    expect(bounded).toHaveLength(2);
    expect(bounded[1]!.oxygen.lockedSelection?.rating).toBe(23n);
  });

  it('rejects empty and malformed puzzle inputs', () => {
    expect(() => solver.parse('')).toThrow(RangeError);
    expect(() => solver.parse('101\n102')).toThrow(SyntaxError);
  });
});

describe('differential testing against binary-prefix-trie oracle', () => {
  it('matches trie oracle across 50 seeded fixtures (widths 1..72, sizes 1..200)', () => {
    const rng = new Xorshift32(20210302);
    for (let i = 0; i < 50; i += 1) {
      const rows = generateFixtureRows(rng, i);
      const report = new DiagnosticReport(rows);
      const expected = solveWithTrieOracle(rows);
      const actual = analyzeLifeSupport(report);
      expect(actual.oxygen.rating).toBe(expected.o2);
      expect(actual.co2.rating).toBe(expected.co2);
      expect(actual.lifeSupportRating).toBe(expected.product);

      const frames = traceLifeSupport(report);
      const last = frames[frames.length - 1]!;
      expect(last.oxygen.lockedSelection?.rating).toBe(expected.o2);
      expect(last.co2.lockedSelection?.rating).toBe(expected.co2);
    }
  });
});
