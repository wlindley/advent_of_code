import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { solver } from './index';

const EXAMPLE_INPUT = [
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

class SeededRng {
  private state: bigint;

  constructor(seed: bigint) {
    this.state = seed & 0xffffffffffffffffn;
  }

  nextUint32(): number {
    this.state = (this.state * 6364136223846793005n + 1442695040888963407n) & 0xffffffffffffffffn;
    return Number((this.state >> 32n) & 0xffffffffn);
  }

  nextInt(bound: number): number {
    return this.nextUint32() % bound;
  }
}

function generateBinaryRows(rng: SeededRng, rowCount: number, width: number): string[] {
  const rows: string[] = [];
  for (let r = 0; r < rowCount; r += 1) {
    let row = '';
    for (let c = 0; c < width; c += 1) {
      row += rng.nextInt(2) === 1 ? '1' : '0';
    }
    rows.push(row);
  }
  return rows;
}

function shuffleRows(rows: readonly string[], rng: SeededRng): string[] {
  const copy = [...rows];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = rng.nextInt(i + 1);
    const tmp = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = tmp;
  }
  return copy;
}

function oracleBigIntPower(rows: readonly string[], width: number): { gamma: bigint; epsilon: bigint; power: bigint } {
  const values = rows.map((row) => BigInt('0b' + row));
  let gamma = 0n;
  let epsilon = 0n;
  for (let col = 0; col < width; col += 1) {
    const bitMask = 1n << BigInt(width - 1 - col);
    let ones = 0;
    for (const val of values) {
      if ((val & bitMask) !== 0n) ones += 1;
    }
    const zeros = rows.length - ones;
    gamma = (gamma << 1n) | (ones >= zeros ? 1n : 0n);
    epsilon = (epsilon << 1n) | (ones < zeros ? 1n : 0n);
  }
  return { gamma, epsilon, power: gamma * epsilon };
}

function fixedNowMs(): number {
  return 42;
}

const FIXED_CLOCK: Clock = Object.freeze({ nowMs: fixedNowMs });

describe('2021 Day 3 Part 1 solver', () => {
  it('solves the official example to 198n', () => {
    const report = solver.parse(EXAMPLE_INPUT);
    const answer = solver.solve(report);
    expect(answer).toBe(198n);
    expect(String(answer)).toBe('198');
  });

  it('handles single-row and exact-tie edge cases', () => {
    expect(solver.solve(solver.parse('1011'))).toBe(44n);
    expect(solver.solve(solver.parse('10\n01'))).toBe(0n);
    expect(solver.solve(solver.parse('0'))).toBe(0n);
  });

  it('integrates with executeSolver and propagates parser errors', () => {
    const result = executeSolver(solver, EXAMPLE_INPUT, FIXED_CLOCK);
    expect(result.answer).toBe(198n);
    expect(result.elapsedMs).toBe(0);
    expect(result.runtime).toBe('main-thread');

    expect(() => solver.parse('')).toThrow(RangeError);
    expect(() => solver.parse('102')).toThrow(SyntaxError);
    expect(() => solver.parse('101\n10')).toThrow(RangeError);
  });

  it('produces default and bounded trace frames', () => {
    const report = solver.parse(EXAMPLE_INPUT);
    const full = solver.trace!(report);
    expect(full.length).toBe(5);
    expect(full[0]?.gammaBit).toBe('1');
    expect(full[4]?.prefixRates.powerConsumption).toBe(198n);

    const bounded = solver.trace!(report, { maxSteps: 2 });
    expect(bounded.map((frame) => frame.column)).toEqual([0, 4]);
    expect(bounded[1]?.prefixRates.powerConsumption).toBe(198n);
  });

  it('matches BigInt shift-mask oracle, complement law, and row-permutation invariance across 50 fuzz trials', () => {
    const rng = new SeededRng(20210301n);
    for (let trial = 0; trial < 50; trial += 1) {
      const width = 1 + rng.nextInt(80);
      const baseRows = 2 + rng.nextInt(25);
      const rowCount = trial % 2 === 0 ? baseRows * 2 : baseRows * 2 + 1;
      const rows = generateBinaryRows(rng, rowCount, width);
      const shuffled = shuffleRows(rows, rng);

      const oracle = oracleBigIntPower(rows, width);
      const actual = solver.solve(solver.parse(rows.join('\n')));
      const permuted = solver.solve(solver.parse(shuffled.join('\n')));

      expect(oracle.gamma + oracle.epsilon).toBe((1n << BigInt(width)) - 1n);
      expect(actual).toBe(oracle.power);
      expect(permuted).toBe(oracle.power);
    }
  });
});
