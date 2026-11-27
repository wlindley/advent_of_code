import { describe, expect, it } from 'vitest';
import { ADD_BEFORE_MUL_POLICY, OperationOrderSolver, type PrecedencePolicy } from '../../shared';
import { solver } from './solver';

const OFFICIAL_EXAMPLES: readonly [string, bigint, bigint][] = [
  ['1 + 2 * 3 + 4 * 5 + 6', 71n, 231n],
  ['1 + (2 * 3) + (4 * (5 + 6))', 51n, 51n],
  ['2 * 3 + (4 * 5)', 26n, 46n],
  ['5 + (8 * 3 + 9 + 3 * 4 * 3)', 437n, 1445n],
  ['5 * 9 * (7 * 3 * 3 + 9 * 3 + (8 + 6 * 4))', 12240n, 669060n],
  ['((2 + 4 * 9) * (6 + 9 * 8 + 6) + 6) + 2 + 4 * 2', 13632n, 23340n],
];

function applyOracleOp(values: bigint[], ops: string[]): void {
  const op = ops.pop()!;
  const right = values.pop()!;
  const left = values.pop()!;
  values.push(op === '+' ? left + right : left * right);
}

function shuntingYardEval(expr: string, policy: PrecedencePolicy): bigint {
  const values: bigint[] = [];
  const ops: string[] = [];
  let i = 0;
  while (i < expr.length) {
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
      const prec = policy.precedence[ch];
      while (ops.length > 0 && ops[ops.length - 1] !== '(' && policy.precedence[ops[ops.length - 1] as '+' | '*'] >= prec) {
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
    if (depth < 2 && nextSeed(state) % 4 === 0) {
      parts.push(`(${generatePrngExpr(state, depth + 1)})`);
    } else {
      parts.push(String(1 + (nextSeed(state) % 25)));
    }
  }
  let expr = parts[0]!;
  for (let i = 1; i < parts.length; i += 1) {
    const op = nextSeed(state) % 2 === 0 ? '+' : '*';
    expr = `${expr} ${op} ${parts[i]!}`;
  }
  return expr;
}

describe('2020 Day 18 Part 1 solver', () => {
  it('solves each official example and the combined homework program', () => {
    for (const [expr, expectedPart1] of OFFICIAL_EXAMPLES) {
      expect(solver.solve(solver.parse(expr))).toBe(expectedPart1);
    }
    const combined = OFFICIAL_EXAMPLES.map(([expr]) => expr).join('\n');
    expect(solver.solve(solver.parse(combined))).toBe(26457n);
  });

  it('maintains exact BigInt precision above 2^64 and handles deeply nested parentheses', () => {
    const big = (1n << 68n) + 123456789n;
    const expr = `(((${big} + 7) * 3) + (((1 + 2) * 4)))`;
    const parsed = solver.parse(expr);
    expect(solver.solve(parsed)).toBe(((big + 7n) * 3n) + 12n);
  });

  it('matches an independent Shunting-Yard oracle across all examples and 60 seeded PRNG expressions', () => {
    const part2Solver = new OperationOrderSolver(ADD_BEFORE_MUL_POLICY);
    const seed = { value: 20201218 };
    const generated = Array.from({ length: 60 }, () => generatePrngExpr(seed, 0));

    let part1ExampleSum = 0n;
    let part2ExampleSum = 0n;
    for (const [expr, p1, p2] of OFFICIAL_EXAMPLES) {
      expect(shuntingYardEval(expr, solver.policy)).toBe(p1);
      expect(shuntingYardEval(expr, part2Solver.policy)).toBe(p2);
      part1ExampleSum += p1;
      part2ExampleSum += p2;
    }
    expect(part1ExampleSum).toBe(26457n);
    expect(part2ExampleSum).toBe(694173n);

    for (const expr of generated) {
      expect(solver.solve(solver.parse(expr))).toBe(shuntingYardEval(expr, solver.policy));
      expect(part2Solver.solve(part2Solver.parse(expr))).toBe(shuntingYardEval(expr, part2Solver.policy));
    }
  });
});
