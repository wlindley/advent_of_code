import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver, Rational } from '../../../../shared/core';
import { solver } from './index';

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

function substituteHumnRaw(raw: string, answer: bigint): string {
  return raw.replace(/^humn:\s*-?\d+$/m, `humn: ${answer}`);
}

function applyRawOp(op: string, l: Rational, r: Rational): Rational {
  if (op === '+') return l.add(r);
  if (op === '-') return l.sub(r);
  return op === '*' ? l.mul(r) : l.div(r);
}

function evalRawNode(defs: ReadonlyMap<string, string>, name: string, memo: Map<string, Rational>): Rational {
  const cached = memo.get(name);
  if (cached) return cached;
  const expr = defs.get(name)!;
  let val: Rational;
  if (/^-?\d+$/.test(expr)) {
    val = new Rational(BigInt(expr));
  } else {
    const [lName, op, rName] = expr.split(' ') as [string, string, string];
    val = applyRawOp(op, evalRawNode(defs, lName, memo), evalRawNode(defs, rName, memo));
  }
  memo.set(name, val);
  return val;
}

function verifyEqualityBySubstitution(raw: string, answer: bigint): Rational {
  const defs = new Map<string, string>();
  for (const line of substituteHumnRaw(raw, answer).trim().split(/\r?\n/)) {
    const [name, expr] = line.split(':').map((part) => part.trim());
    defs.set(name!, expr!);
  }
  const [lName, , rName] = defs.get('root')!.split(' ');
  const memo = new Map<string, Rational>();
  const left = evalRawNode(defs, lName!, memo);
  const right = evalRawNode(defs, rName!, memo);
  expect(left.equals(right)).toBe(true);
  return left;
}

function buildSeededTree(seed: number, target: bigint): string {
  let state = seed >>> 0;
  const ops = ['+', '-', '*', '/'] as const;
  const lines = ['humn: 0'];
  let curName = 'humn';
  let curVal = new Rational(target);
  for (let i = 0; i < 4; i += 1) {
    state = (1664525 * state + 1013904223) >>> 0;
    const op = ops[(state >>> 16) % 4]!;
    state = (1664525 * state + 1013904223) >>> 0;
    const cVal = BigInt(((state >>> 20) % 9) + 1) * ((state & 0x10000) !== 0 ? -1n : 1n);
    const cName = `c${i}`;
    lines.push(`${cName}: ${cVal}`);
    const leftUnknown = (op === '/' && curVal.isZero) || (state & 0x20000) === 0;
    const nextName = i === 3 ? 'lhs' : `n${i}`;
    lines.push(`${nextName}: ${leftUnknown ? curName : cName} ${op} ${leftUnknown ? cName : curName}`);
    curVal = leftUnknown ? applyRawOp(op, curVal, new Rational(cVal)) : applyRawOp(op, new Rational(cVal), curVal);
    curName = nextName;
  }
  if (curVal.den === 1n) lines.push(`rhs: ${curVal.num}`);
  else lines.push(`rhs_n: ${curVal.num}`, `rhs_d: ${curVal.den}`, 'rhs: rhs_n / rhs_d');
  lines.push((seed & 1) === 0 ? 'root: lhs + rhs' : 'root: rhs + lhs');
  return lines.join('\n');
}

describe('2022 Day 21 Part 2 solver', () => {
  it('solves the official example via executeSolver with a fake Clock', () => {
    let tick = 10;
    const fakeClock: Clock = { nowMs: () => (tick += 5) };
    const exec = executeSolver(solver, OFFICIAL_EXAMPLE, fakeClock);

    expect(exec.answer).toBe(301n);
    expect(exec.elapsedMs).toBe(5);
    expect(exec.runtime).toBe('main-thread');
    expect(verifyEqualityBySubstitution(OFFICIAL_EXAMPLE, exec.answer).equals(new Rational(150n))).toBe(true);
  });

  it('satisfies equality under substitution across edge shapes and 20 seeded trees', () => {
    const rightBranch = 'root: c + x\nc: 12\nx: twenty - humn\ntwenty: 20\nhumn: 1';
    expect(solver.solve(solver.parse(rightBranch))).toBe(8n);
    verifyEqualityBySubstitution(rightBranch, 8n);

    const reciprocal = 'root: lhs + rhs\nlhs: ten / humn\nten: 10\nrhs: 2\nhumn: 0';
    expect(solver.solve(solver.parse(reciprocal))).toBe(5n);
    verifyEqualityBySubstitution(reciprocal, 5n);

    const multiPath = 'root: lhs + rhs\nlhs: two * humn\nrhs: humn + five\ntwo: 2\nfive: 5\nhumn: 0';
    expect(solver.solve(solver.parse(multiPath))).toBe(5n);
    verifyEqualityBySubstitution(multiPath, 5n);

    const targets = [7n, -13n, 0n, 9007199254740993n, -1234567890123456789n];
    for (let i = 0; i < 20; i += 1) {
      const target = targets[i % targets.length]!;
      const raw = buildSeededTree(i + 101, target);
      const answer = solver.solve(solver.parse(raw));
      expect(answer).toBe(target);
      verifyEqualityBySubstitution(raw, answer);
    }
  });

  it('produces bounded equality traces for single-path and multi-path DAGs', () => {
    const example = solver.parse(OFFICIAL_EXAMPLE);
    const full = solver.trace(example);
    expect(full).toHaveLength(6);
    expect(full[0]!.mode).toBe('equality');
    expect(full[0]!.answerText).toBe('?');
    expect(full[5]!.answerText).toBe('301');

    const capped = solver.trace(example, { maxSteps: 5 });
    expect(capped).toHaveLength(5);
    expect(capped[4]!.isSampled).toBe(true);
    expect(capped[4]!.answerText).toBe('301');
    for (const frame of capped) expect(frame.nodes.length).toBeLessThanOrEqual(15);

    const multi = solver.parse('root: lhs + rhs\nlhs: two * humn\nrhs: humn + five\ntwo: 2\nfive: 5\nhumn: 0');
    const multiTrace = solver.trace(multi);
    expect(multiTrace).toHaveLength(1);
    expect(multiTrace[0]!.answerText).toBe(multiTrace[0]!.finalAnswerText);
    expect(() => solver.trace(example, { maxSteps: 0 })).toThrow(RangeError);
  });

  it('rejects invalid inputs and unsolvable equations separately', () => {
    expect(() => solver.parse('')).toThrow(RangeError);
    expect(() => solver.parse('root: bad line')).toThrow(SyntaxError);
    expect(() => solver.solve(solver.parse('root: a + b\na: 1\nb: 2'))).toThrow(Error);
    expect(() => solver.solve(solver.parse('root: 5\nhumn: 1'))).toThrow(Error);
    expect(() => solver.solve(solver.parse('root: lhs + humn\nlhs: humn + one\none: 1\nhumn: 0'))).toThrow(Error);
    expect(() => solver.solve(solver.parse('root: lhs + rhs\nlhs: two * humn\nrhs: 3\ntwo: 2\nhumn: 0'))).toThrow(RangeError);
  });
});
