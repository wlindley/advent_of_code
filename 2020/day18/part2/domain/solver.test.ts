import { describe, expect, it } from 'vitest';
import { ADD_BEFORE_MUL_POLICY } from '../../shared';
import { solver } from './index';

const PART2_PRECEDENCE: Readonly<Record<'+' | '*', number>> = { '+': 2, '*': 1 };
const OFFICIAL_EXAMPLES: readonly [string, bigint][] = [
  ['1 + 2 * 3 + 4 * 5 + 6', 231n],
  ['1 + (2 * 3) + (4 * (5 + 6))', 51n],
  ['2 * 3 + (4 * 5)', 46n],
  ['5 + (8 * 3 + 9 + 3 * 4 * 3)', 1445n],
  ['5 * 9 * (7 * 3 * 3 + 9 * 3 + (8 + 6 * 4))', 669060n],
  ['((2 + 4 * 9) * (6 + 9 * 8 + 6) + 6) + 2 + 4 * 2', 23340n],
];

function applyOracleOp(values: bigint[], ops: string[]): void {
  const op = ops.pop()!;
  const right = values.pop()!;
  const left = values.pop()!;
  values.push(op === '+' ? left + right : left * right);
}

function shuntingYardEval(expr: string): bigint {
  const values: bigint[] = [];
  const ops: string[] = [];
  for (let i = 0; i < expr.length; ) {
    const ch = expr.charAt(i);
    if (ch === ' ') { i += 1; continue; }
    if (ch === '(') { ops.push(ch); i += 1; continue; }
    if (ch === ')') {
      while (ops[ops.length - 1] !== '(') applyOracleOp(values, ops);
      ops.pop();
      i += 1;
      continue;
    }
    if (ch === '+' || ch === '*') {
      const prec = PART2_PRECEDENCE[ch];
      while (ops.length > 0 && ops[ops.length - 1] !== '(' && PART2_PRECEDENCE[ops[ops.length - 1] as '+' | '*'] >= prec) {
        applyOracleOp(values, ops);
      }
      ops.push(ch);
      i += 1;
      continue;
    }
    let end = i + 1;
    while (end < expr.length && expr.charAt(end) >= '0' && expr.charAt(end) <= '9') end += 1;
    values.push(BigInt(expr.slice(i, end)));
    i = end;
  }
  while (ops.length > 0) applyOracleOp(values, ops);
  return values[0]!;
}

function nextSeed(state: { value: number }): number {
  state.value = (state.value * 1664525 + 1013904223) >>> 0;
  return state.value;
}

function generatePrngExpr(state: { value: number }, depth: number): string {
  const terms = 2 + (nextSeed(state) % 4);
  const parts: string[] = [];
  for (let i = 0; i < terms; i += 1) {
    parts.push(depth < 2 && nextSeed(state) % 4 === 0
      ? `(${generatePrngExpr(state, depth + 1)})`
      : String(1 + (nextSeed(state) % 25)));
  }
  let expr = parts[0]!;
  for (let i = 1; i < parts.length; i += 1) {
    expr = `${expr} ${nextSeed(state) % 2 === 0 ? '+' : '*'} ${parts[i]!}`;
  }
  return expr;
}

describe('2020 Day 18 Part 2 solver', () => {
  it('uses ADD_BEFORE_MUL_POLICY and is frozen', () => {
    expect(solver.policy).toBe(ADD_BEFORE_MUL_POLICY);
    expect(Object.isFrozen(solver)).toBe(true);
  });

  it('solves each official example and the combined homework program', () => {
    for (const [expr, expected] of OFFICIAL_EXAMPLES) {
      expect(solver.solve(solver.parse(expr))).toBe(expected);
    }
    const combined = OFFICIAL_EXAMPLES.map(([expr]) => expr).join('\n');
    const answer = solver.solve(solver.parse(combined));
    expect(answer).toBe(694173n);
    expect(String(answer)).toBe('694173');
  });

  it('respects addition-before-multiplication precedence and formatting boundaries', () => {
    expect(solver.solve(solver.parse('2 * 3 + 4 * 5'))).toBe(70n);
    expect(solver.solve(solver.parse('(2 * 3) + 4'))).toBe(10n);
    expect(solver.solve(solver.parse('2 * 3 + 4'))).toBe(14n);
    expect(solver.solve(solver.parse('42'))).toBe(42n);
    expect(solver.solve(solver.parse('(((7)))'))).toBe(7n);
    expect(solver.solve(solver.parse('\r\n 2 * 3 + 4 \r\n\r\n 3 * 3 \r\n'))).toBe(23n);
  });

  it('maintains exact BigInt precision above 2^68 with nested parens and Part 2 precedence', () => {
    const big = (1n << 68n) + 123456789n;
    const expr = `((${big} + 7) * 3 + (((1 + 2) * 4)))`;
    expect(solver.solve(solver.parse(expr))).toBe((big + 7n) * 15n);
  });

  it('matches independent Shunting-Yard oracle on all official examples and 60 seeded PRNG expressions', () => {
    for (const [expr, expected] of OFFICIAL_EXAMPLES) {
      expect(shuntingYardEval(expr)).toBe(expected);
    }
    const seed = { value: 20201218 };
    for (let i = 0; i < 60; i += 1) {
      const expr = generatePrngExpr(seed, 0);
      expect(solver.solve(solver.parse(expr))).toBe(shuntingYardEval(expr));
    }
  });

  it('produces bounded evaluation traces for multi-op, combined, sampled, default, and zero-op programs', () => {
    const simpleTrace = solver.trace(solver.parse('2 * 3 + 4'));
    expect(simpleTrace.map((f) => f.operationLabel)).toEqual(['3 + 4 = 7', '2 * 7 = 14']);
    expect(simpleTrace[1]?.cumulativeSum).toBe(14n);

    const combined = solver.parse(OFFICIAL_EXAMPLES.map(([expr]) => expr).join('\n'));
    const sampled = solver.trace(combined, { maxSteps: 5 });
    expect(sampled).toHaveLength(5);
    expect(sampled[sampled.length - 1]?.cumulativeSum).toBe(694173n);

    expect(solver.trace(combined, { maxSteps: 1 })).toHaveLength(1);
    expect(solver.trace(combined)).toHaveLength(combined.totalSteps);

    const zeroOp = solver.trace(solver.parse('42'));
    expect(zeroOp).toHaveLength(1);
    expect(zeroOp[0]?.operationLabel).toBe('42 = 42');
    expect(zeroOp[0]?.cumulativeSum).toBe(42n);
  });

  it.each([0, -1, 1.5, Number.NaN])('rejects invalid maxSteps %p with RangeError', (maxSteps) => {
    const program = solver.parse('2 * 3 + 4');
    expect(() => solver.trace(program, { maxSteps })).toThrow(RangeError);
  });

  it.each([
    '   \n\t ',
    '1 + 2 - 3',
    '(1 + 2 * 3',
    '1 + 2)',
    '()',
    '1 + * 2',
    '1 + ',
    '1 2',
  ])('rejects invalid expression %j with SyntaxError', (badInput) => {
    expect(() => solver.parse(badInput)).toThrow(SyntaxError);
  });
});
