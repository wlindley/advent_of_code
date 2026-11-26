import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { isAsciiDigit, isSchematicSymbol } from '../../shared';
import { DEFAULT_MAX_TRACE_STEPS, solver, traceSchematic } from './index';

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

function perimeterBoxScanOracle(raw: string): number {
  const lines = raw.replace(/(?:\r?\n)+$/, '').split(/\r?\n/);
  const rows = lines.length;
  const cols = lines[0]!.length;
  let total = 0;
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
      const end = c - 1;
      if (hasSymbolInBox(lines, rows, cols, r, start, end)) {
        total += Number(line.slice(start, end + 1));
      }
    }
  }
  return total;
}

function hasSymbolInBox(
  lines: readonly string[],
  rows: number,
  cols: number,
  row: number,
  startCol: number,
  endCol: number,
): boolean {
  const r0 = Math.max(0, row - 1);
  const r1 = Math.min(rows - 1, row + 1);
  const c0 = Math.max(0, startCol - 1);
  const c1 = Math.min(cols - 1, endCol + 1);
  for (let r = r0; r <= r1; r += 1) {
    for (let c = c0; c <= c1; c += 1) {
      if (isSchematicSymbol(lines[r]![c]!)) return true;
    }
  }
  return false;
}

function generatePrngSchematic(rows: number, cols: number, seed: number): string {
  let state = seed >>> 0;
  const nextRand = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  const symbols = ['*', '+', '#', '$', '/', '=', '-', '@'];
  const lines: string[] = [];
  for (let r = 0; r < rows; r += 1) {
    let rowStr = '';
    for (let c = 0; c < cols; c += 1) {
      const p = nextRand();
      if (p < 0.28) rowStr += String(Math.floor(nextRand() * 10));
      else if (p < 0.34) rowStr += symbols[Math.floor(nextRand() * symbols.length)]!;
      else rowStr += '.';
    }
    lines.push(rowStr);
  }
  return lines.join('\n');
}

describe('2023 Day 03 Part 1 solver', () => {
  it('solves the official example schematic to 4361', () => {
    const schematic = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(schematic)).toBe(4361);
  });

  it('executes via executeSolver with a deterministic Clock', () => {
    const ticks = [10, 14.5];
    let idx = 0;
    const fakeClock: Clock = { nowMs: () => ticks[idx++] ?? 20 };
    const result = executeSolver(solver, EXAMPLE_INPUT, fakeClock);
    expect(result).toEqual({ answer: 4361, elapsedMs: 4.5, runtime: 'main-thread' });
  });

  it('handles minus signs as symbols, 3x cell touches, duplicates, and corners/diagonals', () => {
    expect(solver.solve(solver.parse('-42..\n12-34'))).toBe(42 + 12 + 34);
    expect(solver.solve(solver.parse('..*..\n.467.'))).toBe(467);
    expect(solver.solve(solver.parse('7*7'))).toBe(14);
    expect(solver.solve(solver.parse('1..\n.*.\n..9'))).toBe(10);
  });

  it('handles 0-symbol and 0-number inputs cleanly', () => {
    const noSymbols = solver.parse('123.456\n.......');
    expect(solver.solve(noSymbols)).toBe(0);
    const emptyFrames = traceSchematic(noSymbols);
    expect(emptyFrames).toEqual([]);
    expect(Object.isFrozen(emptyFrames)).toBe(true);

    const noNumbers = solver.parse('*..\n.#.');
    expect(solver.solve(noNumbers)).toBe(0);
  });

  it('traces each symbol step with deduplicated runningSum and dynamic stepDelta', () => {
    const schematic = solver.parse('*42+7');
    const frames = solver.trace!(schematic);
    expect(frames).toHaveLength(2);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(Object.isFrozen(frames[0])).toBe(true);
    expect(frames[0]!.newlyMatchedCount).toBe(1);
    expect(frames[0]!.matchedCount).toBe(1);
    expect(frames[0]!.stepDelta).toBe(42);
    expect(frames[0]!.runningSum).toBe(42);
    // Second symbol '+' sees both 42 (already matched) and 7 (new).
    expect(frames[1]!.adjacentParts.map((p) => p.value)).toEqual([42, 7]);
    expect(frames[1]!.newlyMatchedIds).toEqual([1]);
    expect(frames[1]!.stepDelta).toBe(7);
    expect(frames[1]!.runningSum).toBe(49);

    const revisitFrames = traceSchematic(solver.parse('*42+'));
    expect(revisitFrames[1]!.newlyMatchedCount).toBe(0);
    expect(revisitFrames[1]!.stepDelta).toBe(0);
    expect(revisitFrames[1]!.runningSum).toBe(42);
  });

  it('samples trace frames according to maxSteps and rejects invalid maxSteps', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(200);
    const schematic = solver.parse(EXAMPLE_INPUT);
    const sampled = traceSchematic(schematic, { maxSteps: 3 });
    expect(sampled).toHaveLength(3);
    expect(sampled[0]!.symbolIndex).toBe(0);
    expect(sampled[2]!.symbolIndex).toBe(schematic.symbols.length - 1);
    expect(sampled[2]!.runningSum).toBe(4361);

    const single = traceSchematic(schematic, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]!.runningSum).toBe(4361);

    expect(() => traceSchematic(schematic, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceSchematic(schematic, { maxSteps: -2 })).toThrow(RangeError);
    expect(() => traceSchematic(schematic, { maxSteps: 1.5 })).toThrow(RangeError);
  });

  it('matches independent perimeterBoxScanOracle on synthetic schematics up to 140x140', () => {
    const cases: Array<[number, number, number]> = [
      [1, 1, 1],
      [8, 12, 42],
      [25, 30, 1337],
      [140, 140, 202303],
    ];
    for (const [rows, cols, seed] of cases) {
      const raw = generatePrngSchematic(rows, cols, seed);
      const parsed = solver.parse(raw);
      expect(solver.solve(parsed)).toBe(perimeterBoxScanOracle(raw));
    }
  });
});
