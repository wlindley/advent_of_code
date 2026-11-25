import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { DEFAULT_MAX_TRACE_STEPS, extractVerticalColumns, solver } from './index';

const EXAMPLE = ['123 328  51 64 ', ' 45 64  387 23 ', '  6 98  215 314', '*   +   *   +  '].join('\n');

function blockTransposeOracle(raw: string): bigint {
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const w = Math.max(...lines.map((l) => l.length));
  const grid = lines.map((l) => l.padEnd(w, ' '));
  const opRow = grid[grid.length - 1]!;
  const numRows = grid.slice(0, -1);
  let total = 0n;
  for (let col = w - 1; col >= 0; ) {
    if (grid.every((r) => r[col] === ' ')) { col -= 1; continue; }
    const end = col;
    while (col >= 0 && !grid.every((r) => r[col] === ' ')) col -= 1;
    const op = opRow.slice(col + 1, end + 1).trim();
    const rotated = Array.from({ length: end - col }, (_, k) => numRows.map((r) => r[end - k]!).join('').trim())
      .filter((s) => s.length > 0).map((s) => BigInt(s));
    total += op === '+' ? rotated.reduce((a, b) => a + b, 0n) : rotated.reduce((a, b) => a * b, 1n);
  }
  return total;
}

describe('2025/day06/part2 solver', () => {
  it('solves the official 4x15 example and verifies RTL trace frames', () => {
    const ws = solver.parse(EXAMPLE);
    expect(solver.solve(ws)).toBe(3263827n);
    expect(executeSolver(solver, EXAMPLE).answer).toBe(3263827n);
    const frames = solver.trace!(ws);
    expect(frames).toHaveLength(5);
    expect(frames[0]).toMatchObject({ step: 0, problemIndex: null, block: null, columns: [], problemResult: null, grandTotal: 0n });
    expect(frames.slice(1).map((f) => [f.problemIndex, f.columns.map((c) => Number(c.value)), f.problemResult])).toEqual([
      [3, [4, 431, 623], 1058n],
      [2, [175, 581, 32], 3253600n],
      [1, [8, 248, 369], 625n],
      [0, [356, 24, 1], 8544n],
    ]);
    expect(frames[4]!.grandTotal).toBe(3263827n);
  });

  it('handles zero columns, operator-only blank columns, BigInt, single-cell, ragged lines, and empty worksheet', () => {
    const zeroWs = solver.parse('01\n02\n+ ');
    expect(extractVerticalColumns(zeroWs.blocks[0]!)).toEqual([{ col: 1, value: 12n }, { col: 0, value: 0n }]);
    expect(solver.solve(zeroWs)).toBe(12n);
    expect(solver.solve(solver.parse('0\n+'))).toBe(0n);

    const opOnlyWs = solver.parse(' 12\n 34\n+  ');
    expect(extractVerticalColumns(opOnlyWs.blocks[0]!)).toEqual([{ col: 2, value: 24n }, { col: 1, value: 13n }]);
    expect(solver.solve(opOnlyWs)).toBe(37n);

    const big = solver.solve(solver.parse('99999999\n99999999\n*       '));
    expect(big).toBe(99n ** 8n);
    expect(big > BigInt(Number.MAX_SAFE_INTEGER)).toBe(true);
    expect(solver.solve(solver.parse('7\n*'))).toBe(7n);
    expect(solver.solve(solver.parse('12\n3\n+'))).toBe(15n);
    expect(solver.solve({ blocks: [], width: 0 })).toBe(0n);
  });

  it('rejects interior vertical digit gaps and invalid maxSteps', () => {
    const gapped = solver.parse('12\n 3\n45\n+ ');
    expect(() => extractVerticalColumns(gapped.blocks[0]!)).toThrow('Invalid vertical operand gap at col 0');
    expect(() => solver.solve(gapped)).toThrow(Error);
    const ws = solver.parse(EXAMPLE);
    for (const bad of [0, -5, 2.5, Number.NaN]) expect(() => solver.trace!(ws, { maxSteps: bad })).toThrow(RangeError);
  });

  it('supports trace downsampling and maxSteps: 1 on non-empty and empty worksheets', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(200);
    const ws = solver.parse(EXAMPLE);
    const r1 = Array.from({ length: 50 }, (_, i) => String((i % 9) + 1).padStart(2));
    const r2 = Array.from({ length: 50 }, (_, i) => String(((i + 3) % 9) + 1).padStart(2));
    const r3 = Array.from({ length: 50 }, (_, i) => (i % 2 === 0 ? '+ ' : '* '));
    const manyWs = solver.parse(`${r1.join(' ')}\n${r2.join(' ')}\n${r3.join(' ')}`);
    const sampled = solver.trace!(manyWs, { maxSteps: 10 });
    expect(sampled.length).toBeLessThanOrEqual(10);
    expect(sampled[0]!.step).toBe(0);
    expect(sampled.at(-1)).toMatchObject({ step: 50, problemIndex: 0, grandTotal: solver.solve(manyWs) });

    expect(solver.trace!(ws, { maxSteps: 1 })).toMatchObject([{ step: 4, problemIndex: 0, grandTotal: 3263827n }]);
    expect(solver.trace!({ blocks: [], width: 0 }, { maxSteps: 1 })).toMatchObject([{ step: 0, problemIndex: null, grandTotal: 0n }]);
  });

  it('matches 90-degree CCW blockTransposeOracle across diverse cases', () => {
    const cases = [
      EXAMPLE,
      '  12   345   6\n 789    12  345 \n   3     4    5\n  +     *     +',
      ' 012  007\n 034    5\n+     *  ',
      '99999999  88888888  123456\n77777777  66666666     789\n*         +         *',
      '1    22222  33\n45   6 789   4\n+    *      + ',
    ];
    for (const raw of cases) expect(solver.solve(solver.parse(raw))).toBe(blockTransposeOracle(raw));
  });
});
