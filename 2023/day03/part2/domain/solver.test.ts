import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { isAsciiDigit } from '../../shared';
import { gearRatioOf, solver, sumGearRatios } from './index';

const EXAMPLE_INPUT = [
  '467..114..',
  '...*......',
  '..35..633.',
  '......#...',
  '617*......',
  '.....+.58.',
  '..592.....',
  '......755.',
  '...$.*....',
  '.664.598..',
].join('\n');

function scatterNumberToStars(
  lines: readonly string[],
  rows: number,
  cols: number,
  row: number,
  startCol: number,
  endCol: number,
  buckets: Map<number, bigint[]>,
): void {
  const value = BigInt(lines[row]!.slice(startCol, endCol + 1));
  const r0 = Math.max(0, row - 1);
  const r1 = Math.min(rows - 1, row + 1);
  const c0 = Math.max(0, startCol - 1);
  const c1 = Math.min(cols - 1, endCol + 1);
  for (let r = r0; r <= r1; r += 1) {
    for (let c = c0; c <= c1; c += 1) {
      if (lines[r]![c] !== '*') continue;
      const key = r * cols + c;
      const list = buckets.get(key);
      if (list) list.push(value);
      else buckets.set(key, [value]);
    }
  }
}

function numberBorderScatterOracle(raw: string): bigint {
  const lines = raw.replace(/(?:\r?\n)+$/, '').split(/\r?\n/);
  const rows = lines.length;
  const cols = lines[0]!.length;
  const buckets = new Map<number, bigint[]>();
  for (let r = 0; r < rows; r += 1) {
    const line = lines[r]!;
    let c = 0;
    while (c < cols) {
      if (!isAsciiDigit(line[c]!)) {
        c += 1;
        continue;
      }
      const start = c;
      while (c < cols && isAsciiDigit(line[c]!)) c += 1;
      scatterNumberToStars(lines, rows, cols, r, start, c - 1, buckets);
    }
  }
  let total = 0n;
  for (const values of buckets.values()) {
    if (values.length === 2) total += values[0]! * values[1]!;
  }
  return total;
}

function generatePrngSchematic(rows: number, cols: number, seed: number): string {
  let state = seed >>> 0;
  const symbols = ['*', '*', '*', '+', '#', '$', '-', '@'];
  const lines: string[] = [];
  for (let r = 0; r < rows; r += 1) {
    let rowStr = '';
    for (let c = 0; c < cols; c += 1) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      const p = state / 0x100000000;
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      const q = state / 0x100000000;
      if (p < 0.28) rowStr += String(Math.floor(q * 10));
      else if (p < 0.35) rowStr += symbols[Math.floor(q * symbols.length)]!;
      else rowStr += '.';
    }
    lines.push(rowStr);
  }
  return lines.join('\n');
}

function createFakeClock(ticks: readonly number[]): Clock {
  let idx = 0;
  return { nowMs: () => ticks[idx++] ?? ticks[ticks.length - 1]! };
}

describe('2023 Day 03 Part 2 solver', () => {
  it('solves the official example to 467835n and executes with a fake Clock', () => {
    const schematic = solver.parse(EXAMPLE_INPUT);
    expect(Object.isFrozen(solver)).toBe(true);
    expect(solver.solve(schematic)).toBe(467835n);
    expect(sumGearRatios(schematic)).toBe(467835n);

    const execution = executeSolver(solver, EXAMPLE_INPUT, createFakeClock([12, 19.25]));
    expect(execution).toEqual({ answer: 467835n, elapsedMs: 7.25, runtime: 'main-thread' });
  });

  it('handles star degrees 0..4, non-star symbols, and gearRatioOf directly', () => {
    const p2 = solver.parse('1*2');
    expect(gearRatioOf(p2.adjacentNumbersOf(p2.symbols[0]!))).toBe(2n);
    expect(gearRatioOf([])).toBeNull();
    expect(solver.solve(solver.parse('*'))).toBe(0n);
    expect(solver.solve(solver.parse('1*.'))).toBe(0n);
    expect(solver.solve(solver.parse('1*2'))).toBe(2n);
    expect(solver.solve(solver.parse('1*2\n.3.'))).toBe(0n);
    expect(solver.solve(solver.parse('1*2\n3.4'))).toBe(0n);
    expect(solver.solve(solver.parse('1#2\n3+4\n5$6\n7-8'))).toBe(0n);
  });

  it('handles identical values, multi-cell touches, shared parts, zeroes, signs, corners, and BigInt overflow', () => {
    expect(solver.solve(solver.parse('7*7'))).toBe(49n);
    expect(solver.solve(solver.parse('123\n.*.'))).toBe(0n);
    expect(solver.solve(solver.parse('123\n*..\n4..'))).toBe(492n);
    expect(solver.solve(solver.parse('10*20*30'))).toBe(800n);
    expect(solver.solve(solver.parse('0*5'))).toBe(0n);
    expect(solver.solve(solver.parse('007*002'))).toBe(14n);
    expect(solver.solve(solver.parse('-12*3'))).toBe(36n);
    expect(solver.solve(solver.parse('*1\n2.'))).toBe(2n);
    expect(solver.solve(solver.parse('.1\n2*'))).toBe(2n);
    expect(solver.solve(solver.parse('9007199254740991*2'))).toBe(18014398509481982n);
    expect(solver.solve(solver.parse('123.456\n..+....'))).toBe(0n);
  });

  it('rejects invalid schematic inputs on parse', () => {
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('12\n1')).toThrow();
    expect(() => solver.parse('1 2')).toThrow(SyntaxError);
    expect(() => solver.parse('99999999999999999')).toThrow(RangeError);
  });

  it('matches independent numberBorderScatterOracle on synthetic schematics up to 140x140', () => {
    const cases: Array<[number, number, number]> = [
      [1, 1, 1],
      [8, 12, 42],
      [25, 30, 1337],
      [140, 140, 2023032],
    ];
    for (const [rows, cols, seed] of cases) {
      const raw = generatePrngSchematic(rows, cols, seed);
      expect(solver.solve(solver.parse(raw))).toBe(numberBorderScatterOracle(raw));
    }
  });
});
