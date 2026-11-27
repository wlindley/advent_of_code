import { describe, expect, it } from 'vitest';
import type { PolymerFormula } from '../../shared';
import { solver } from './index';

const EXAMPLE_INPUT = [
  'NNCB', '', 'CH -> B', 'HH -> N', 'CB -> H', 'NH -> C', 'HB -> C', 'HC -> B',
  'HN -> C', 'NN -> C', 'BH -> H', 'NC -> B', 'NB -> B', 'BN -> B', 'BB -> N', 'BC -> B', 'CC -> N', 'CN -> C',
].join('\n');

function zeroMat(n: number): bigint[][] {
  const m: bigint[][] = [];
  for (let r = 0; r < n; r += 1) m.push(Array<bigint>(n).fill(0n));
  return m;
}

function collectPairs(f: PolymerFormula): string[] {
  const set = new Set<string>();
  for (let i = 0; i < f.template.length - 1; i += 1) set.add(f.template.slice(i, i + 2));
  for (const r of f.rules) { set.add(r.pair); set.add(r.leftProduct); set.add(r.rightProduct); }
  return Array.from(set);
}

function buildMatrix(f: PolymerFormula, pairs: readonly string[], idx: ReadonlyMap<string, number>): bigint[][] {
  const mat = zeroMat(pairs.length);
  for (let j = 0; j < pairs.length; j += 1) {
    const r = f.ruleFor(pairs[j]!);
    if (r === undefined) mat[j]![j] = mat[j]![j]! + 1n;
    else {
      const [li, ri] = [idx.get(r.leftProduct)!, idx.get(r.rightProduct)!];
      mat[li]![j] = mat[li]![j]! + 1n;
      mat[ri]![j] = mat[ri]![j]! + 1n;
    }
  }
  return mat;
}

function mulMatVec(mat: readonly (readonly bigint[])[], vec: readonly bigint[]): bigint[] {
  const out = Array<bigint>(vec.length).fill(0n);
  for (let r = 0; r < vec.length; r += 1) {
    let sum = 0n;
    for (let c = 0; c < vec.length; c += 1) sum += mat[r]![c]! * vec[c]!;
    out[r] = sum;
  }
  return out;
}

function mulMat(a: readonly (readonly bigint[])[], b: readonly (readonly bigint[])[]): bigint[][] {
  const out = zeroMat(a.length);
  for (let r = 0; r < a.length; r += 1) {
    for (let k = 0; k < a.length; k += 1) {
      const aik = a[r]![k]!;
      if (aik !== 0n) for (let c = 0; c < a.length; c += 1) out[r]![c] = out[r]![c]! + aik * b[k]![c]!;
    }
  }
  return out;
}

function spreadFromMap(counts: ReadonlyMap<string, bigint>): bigint {
  const vals = Array.from(counts.values());
  let [min, max] = [vals[0]!, vals[0]!];
  for (const c of vals) { if (c < min) min = c; if (c > max) max = c; }
  return max - min;
}

function matrixSpreadOracle(formula: PolymerFormula, steps: number): bigint {
  const pairs = collectPairs(formula);
  const idx = new Map<string, number>();
  for (let i = 0; i < pairs.length; i += 1) idx.set(pairs[i]!, i);
  let vec = Array<bigint>(pairs.length).fill(0n);
  for (let i = 0; i < formula.template.length - 1; i += 1) {
    const j = idx.get(formula.template.slice(i, i + 2))!;
    vec[j] = vec[j]! + 1n;
  }
  let mat = buildMatrix(formula, pairs, idx);
  for (let exp = steps; exp > 0; exp >>= 1) {
    if ((exp & 1) === 1) vec = mulMatVec(mat, vec);
    if (exp > 1) mat = mulMat(mat, mat);
  }
  const counts = new Map<string, bigint>([[formula.lastElement, 1n]]);
  for (let i = 0; i < pairs.length; i += 1) if (vec[i]! > 0n) counts.set(pairs[i]![0]!, (counts.get(pairs[i]![0]!) ?? 0n) + vec[i]!);
  return spreadFromMap(counts);
}

function addCounts(target: Map<string, bigint>, src: ReadonlyMap<string, bigint>): void {
  for (const [el, cnt] of src) target.set(el, (target.get(el) ?? 0n) + cnt);
}

function countInserted(
  formula: PolymerFormula, pair: string, depth: number, memo: Map<string, Map<string, bigint>>,
): Map<string, bigint> {
  if (depth === 0) return new Map();
  const key = `${pair}:${depth}`;
  const cached = memo.get(key);
  if (cached !== undefined) return cached;
  const rule = formula.ruleFor(pair);
  const res = new Map<string, bigint>();
  if (rule !== undefined) {
    res.set(rule.insert, 1n);
    addCounts(res, countInserted(formula, rule.leftProduct, depth - 1, memo));
    addCounts(res, countInserted(formula, rule.rightProduct, depth - 1, memo));
  }
  memo.set(key, res);
  return res;
}

function dpSpreadOracle(formula: PolymerFormula, steps: number): bigint {
  const counts = new Map<string, bigint>();
  for (const ch of formula.template) counts.set(ch, (counts.get(ch) ?? 0n) + 1n);
  const memo = new Map<string, Map<string, bigint>>();
  for (let i = 0; i < formula.template.length - 1; i += 1) addCounts(counts, countInserted(formula, formula.template.slice(i, i + 2), steps, memo));
  return spreadFromMap(counts);
}

function makeSeeded100RuleInput(): string {
  const alpha = 'ABCDEFGHIJ';
  let [seed, tpl] = [2021142, ''];
  for (let k = 0; k < 20; k += 1) { seed = (seed * 1664525 + 1013904223) >>> 0; tpl += alpha[seed % 10]!; }
  const lines = [tpl, ''];
  for (let i = 0; i < 100; i += 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    lines.push(`${alpha[Math.floor(i / 10)]!}${alpha[i % 10]!} -> ${alpha[seed % 10]!}`);
  }
  return lines.join('\n');
}

describe('2021 Day 14 Part 2 solver', () => {
  it('solves the official example at step 40 and verifies full trace metrics', () => {
    const formula = solver.parse(EXAMPLE_INPUT);
    expect([solver.steps, solver.solve(formula), solver.formatAnswer(2188189693529n)]).toEqual([40, 2188189693529n, '2188189693529']);
    const frames = solver.trace(formula);
    const f40 = frames[40]!;
    expect([frames.length, f40.totalLength, f40.spread]).toEqual([41, 3298534883329n, 2188189693529n]);
    expect([f40.mostCommon, f40.leastCommon]).toEqual([{ element: 'B', count: 2192039569602n }, { element: 'H', count: 3849876073n }]);
  });

  it('matches binary matrix exponentiation oracle (M^40 * v0)', () => {
    for (const raw of [EXAMPLE_INPUT, 'ABBC\n\nAB -> C', 'AB\n\nAB -> B\nBB -> A\nBA -> A', 'Z\n\nAB -> C']) {
      expect(solver.solve(solver.parse(raw))).toBe(matrixSpreadOracle(solver.parse(raw), 40));
    }
  });

  it('matches top-down insertion-tree DP oracle on 100-rule and > 2^53 fixtures', () => {
    const seeded = solver.parse(makeSeeded100RuleInput());
    expect(solver.solve(seeded)).toBe(dpSpreadOracle(seeded, 40));
    const big = solver.parse(`${'A'.repeat(8193)}B\n\nAA -> A\nAB -> A`);
    const spread = solver.solve(big);
    expect([spread, spread > BigInt(Number.MAX_SAFE_INTEGER), dpSpreadOracle(big, 40)]).toEqual([9_008_298_766_368_767n, true, spread]);
  });

  it('enforces trace maxSteps bounds and rejects invalid maxSteps', () => {
    const formula = solver.parse(EXAMPLE_INPUT);
    const s5 = solver.trace(formula, { maxSteps: 5 });
    const s1 = solver.trace(formula, { maxSteps: 1 });
    expect([s5.length, s5[0]?.step, s5[4]?.step, s1.length, s1[0]?.step]).toEqual([5, 0, 40, 1, 40]);
    expect(() => solver.trace(formula, { maxSteps: 0 })).toThrow(RangeError);
  });

  it.each([
    ['empty input', '', /empty/], ['missing rule section', 'NNCB', /rule sections/],
    ['malformed rule line', 'NNCB\n\nAB => C', /Invalid insertion rule/], ['duplicate rule pair', 'NNCB\n\nAB -> C\nAB -> D', RangeError],
  ])('rejects %s', (_label, raw, err) => { expect(() => solver.parse(raw)).toThrow(err); });
});
