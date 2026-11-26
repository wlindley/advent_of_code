import { describe, expect, it } from 'vitest';
import { Rational } from '../../../shared/core';
import {
  DEFAULT_ROOT_NAME,
  DEFAULT_UNKNOWN_NAME,
  solveEqualityUnknown,
  solveRootYell,
} from './evaluator';
import { type BinaryOp } from './operators';
import { parseMonkeyRiddle } from './parser';
import { type MonkeyJob, MonkeyRiddle } from './riddle';

const OFFICIAL_EXAMPLE = [
  'root: pppw + sjmn',
  'dbpl: 5',
  'cczh: sllz + lgvd',
  'zczc: 2',
  'ptdq: humn - dvpt',
  'dvpt: 3',
  'lfqf: 4',
  'humn: 5',
  'ljgn: 2',
  'sjmn: drzm * dbpl',
  'sllz: 4',
  'pppw: cczh / lfqf',
  'lgvd: ljgn * ptdq',
  'drzm: hmdt - zczc',
  'hmdt: 32',
].join('\n');

function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

/** Independent recursive memoized evaluator oracle. */
function oracleEvaluate(riddle: MonkeyRiddle, name: string, memo: Map<string, Rational>): Rational {
  const cached = memo.get(name);
  if (cached) return cached;
  const job = riddle.require(name);
  let value: Rational;
  if (job.kind === 'literal') {
    value = new Rational(job.value);
  } else {
    const l = oracleEvaluate(riddle, job.left, memo);
    const r = oracleEvaluate(riddle, job.right, memo);
    if (job.op === '+') value = l.add(r);
    else if (job.op === '-') value = l.sub(r);
    else if (job.op === '*') value = l.mul(r);
    else value = l.div(r);
  }
  memo.set(name, value);
  return value;
}

function buildRandomTree(seed: number, depth: number): MonkeyRiddle {
  const rng = createRng(seed);
  const ops: readonly BinaryOp[] = ['+', '-', '*', '/'];
  const jobs: MonkeyJob[] = [];
  let id = 0;

  function makeSubtree(level: number, hasUnknown: boolean): string {
    if (level === 0) {
      if (hasUnknown) {
        jobs.push({ kind: 'literal', name: DEFAULT_UNKNOWN_NAME, value: 7n });
        return DEFAULT_UNKNOWN_NAME;
      }
      const name = `n${id++}`;
      const val = BigInt(Math.floor(rng() * 9) + 1);
      jobs.push({ kind: 'literal', name, value: val });
      return name;
    }
    const name = level === depth ? DEFAULT_ROOT_NAME : `n${id++}`;
    const unknownLeft = hasUnknown && rng() < 0.5;
    const left = makeSubtree(level - 1, unknownLeft);
    const right = makeSubtree(level - 1, hasUnknown && !unknownLeft);
    const op = ops[Math.floor(rng() * ops.length)]!;
    jobs.push({ kind: 'op', name, left, op, right });
    return name;
  }

  makeSubtree(depth, true);
  return new MonkeyRiddle(jobs);
}

function oracleContains(riddle: MonkeyRiddle, name: string, target: string): boolean {
  if (name === target) return true;
  const job = riddle.require(name);
  return job.kind === 'op' && (oracleContains(riddle, job.left, target) || oracleContains(riddle, job.right, target));
}

function oracleInvert(riddle: MonkeyRiddle, name: string, target: Rational, memo: Map<string, Rational>): Rational {
  if (name === DEFAULT_UNKNOWN_NAME) return target;
  const job = riddle.require(name);
  if (job.kind !== 'op') throw new Error('Expected op');
  const leftHas = oracleContains(riddle, job.left, DEFAULT_UNKNOWN_NAME);
  const known = oracleEvaluate(riddle, leftHas ? job.right : job.left, memo);
  let next: Rational;
  if (job.op === '+') next = target.sub(known);
  else if (job.op === '-') next = leftHas ? target.add(known) : known.sub(target);
  else if (job.op === '*') next = target.div(known);
  else next = leftHas ? target.mul(known) : known.div(target);
  return oracleInvert(riddle, leftHas ? job.left : job.right, next, memo);
}

describe('evaluator oracle', () => {
  it('matches recursive memoized BigInt evaluation across seeded trees', () => {
    const example = parseMonkeyRiddle(OFFICIAL_EXAMPLE);
    expect(solveRootYell(example, DEFAULT_ROOT_NAME)).toBe(152n);

    for (let seed = 1; seed <= 25; seed += 1) {
      const tree = buildRandomTree(seed, 3);
      const expected = oracleEvaluate(tree, DEFAULT_ROOT_NAME, new Map());
      if (expected.den !== 1n) continue;
      expect(solveRootYell(tree, DEFAULT_ROOT_NAME)).toBe(expected.num);
    }
  });

  it('satisfies left(x) === right(x) under substitution on official example and random trees', () => {
    const example = parseMonkeyRiddle(OFFICIAL_EXAMPLE);
    const xExample = solveEqualityUnknown(example, DEFAULT_ROOT_NAME, DEFAULT_UNKNOWN_NAME);
    expect(xExample).toBe(301n);

    let verified = 0;
    for (let seed = 100; seed < 250 && verified < 25; seed += 1) {
      const tree = buildRandomTree(seed, 3);
      let solved: bigint;
      try {
        solved = solveEqualityUnknown(tree, DEFAULT_ROOT_NAME, DEFAULT_UNKNOWN_NAME);
      } catch {
        continue;
      }
      const patchedJobs = tree.names.map((name) =>
        name === DEFAULT_UNKNOWN_NAME
          ? { kind: 'literal' as const, name, value: solved }
          : tree.require(name),
      );
      const patched = new MonkeyRiddle(patchedJobs);
      const root = patched.require(DEFAULT_ROOT_NAME);
      if (root.kind !== 'op') throw new Error('Expected op root');
      const memo = new Map<string, Rational>();
      const lhs = oracleEvaluate(patched, root.left, memo);
      const rhs = oracleEvaluate(patched, root.right, memo);
      expect(lhs.equals(rhs)).toBe(true);
      const leftHas = oracleContains(tree, root.left, DEFAULT_UNKNOWN_NAME);
      const known = oracleEvaluate(tree, leftHas ? root.right : root.left, new Map());
      expect(oracleInvert(tree, leftHas ? root.left : root.right, known, new Map()).num).toBe(solved);
      verified += 1;
    }
    expect(verified).toBe(25);
  });
});
