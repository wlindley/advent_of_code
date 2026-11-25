import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { DEFAULT_MAX_TRACE_STEPS, extractHorizontalOperands, solver } from './index';

const EXAMPLE = [
  '123 328  51 64 ',
  ' 45 64  387 23 ',
  '  6 98  215 314',
  '*   +   *   +  ',
].join('\n');

function rowTokenTransposeOracle(raw: string): bigint {
  const rows = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((l) => l.split(/\s+/));
  const ops = rows[rows.length - 1]!;
  const operandRows = rows.slice(0, -1);
  let total = 0n;
  for (let c = 0; c < ops.length; c += 1) {
    const vals = operandRows.map((r) => BigInt(r[c]!));
    total += ops[c] === '+' ? vals.reduce((a, b) => a + b, 0n) : vals.reduce((a, b) => a * b, 1n);
  }
  return total;
}

describe('2025/day06/part1 solver', () => {
  it('solves the official 4x15 example via solver and executeSolver', () => {
    const ws = solver.parse(EXAMPLE);
    expect(solver.solve(ws)).toBe(4277556n);
    expect(executeSolver(solver, EXAMPLE).answer).toBe(4277556n);
  });

  it('handles large BigInt products, variable-height skipped space rows, split digits, and empty worksheet', () => {
    expect(solver.solve(solver.parse('9999\n9999\n9999\n9999\n*   '))).toBe(9999n ** 4n);
    const varHeight = solver.parse('12  3\n    4\n56   \n+   *');
    expect(extractHorizontalOperands(varHeight.blocks[0]!)).toEqual([12n, 56n]);
    expect(solver.solve(varHeight)).toBe(80n);

    expect(() => solver.solve(solver.parse('1 2\n345\n+  '))).toThrow(Error);
    expect(solver.solve({ blocks: [], width: 0 })).toBe(0n);
  });

  it('matches row-token-transpose oracle across varied alignments, gaps, ragged lines, and BigInt products', () => {
    const cases = [
      EXAMPLE,
      '  12   345   6\n 789    12  345 \n   3     4    5\n  +     *     +',
      '99999999  88888888  123456\n77777777  66666666     789\n*         +         *',
      '  1   22   333  \n444    5     6  \n*      +     *  ',
    ];
    for (const raw of cases) {
      expect(solver.solve(solver.parse(raw))).toBe(rowTokenTransposeOracle(raw));
    }
  });

  it('traces full, downsampled, single-step, empty, and rejects invalid maxSteps', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(200);
    const ws = solver.parse(EXAMPLE);
    const full = solver.trace!(ws);
    expect(full).toHaveLength(5);
    expect(full[0]).toMatchObject({
      step: 0, problemIndex: null, block: null, operands: [], problemResult: null, grandTotal: 0n,
    });
    expect(full[1]).toMatchObject({
      step: 1, problemIndex: 0, operands: [123n, 45n, 6n], problemResult: 33210n, grandTotal: 33210n,
    });
    expect(full[4]).toMatchObject({ step: 4, problemIndex: 3, problemResult: 401n, grandTotal: 4277556n });

    const r1 = Array.from({ length: 50 }, (_, i) => String(i + 1).padStart(2));
    const r2 = Array.from({ length: 50 }, (_, i) => String(i + 2).padStart(2));
    const r3 = Array.from({ length: 50 }, (_, i) => (i % 2 === 0 ? '+ ' : '* '));
    const manyWs = solver.parse(`${r1.join(' ')}\n${r2.join(' ')}\n${r3.join(' ')}`);
    const sampled = solver.trace!(manyWs, { maxSteps: 10 });
    expect(sampled.length).toBeLessThanOrEqual(10);
    expect(sampled[0]!.step).toBe(0);
    expect(sampled.at(-1)!.step).toBe(50);
    expect(sampled.at(-1)!.grandTotal).toBe(solver.solve(manyWs));

    const single = solver.trace!(ws, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]).toMatchObject({ step: 4, problemIndex: 3, grandTotal: 4277556n });

    const emptyTrace = solver.trace!({ blocks: [], width: 0 }, { maxSteps: 1 });
    expect(emptyTrace).toHaveLength(1);
    expect(emptyTrace[0]).toMatchObject({ step: 0, problemIndex: null, grandTotal: 0n });

    for (const bad of [0, -5, 2.5, Number.NaN]) {
      expect(() => solver.trace!(ws, { maxSteps: bad })).toThrow(RangeError);
    }
  });
});
