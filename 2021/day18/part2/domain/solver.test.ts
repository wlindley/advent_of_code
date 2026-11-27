import { describe, expect, it } from 'vitest';
import { DEFAULT_MAX_TRACE_STEPS, MAX_PAIR_MAGNITUDE_POLICY } from '../../shared';
import { solver } from './index';

type TreeNode = number | readonly [TreeNode, TreeNode];
interface ExplodeRes {
  readonly node: TreeNode;
  readonly left: number;
  readonly right: number;
}
interface Rng {
  s: number;
}

const OFFICIAL_HOMEWORK = [
  '[[[0,[5,8]],[[1,7],[9,6]]],[[4,[1,2]],[[1,4],2]]]',
  '[[[5,[2,8]],4],[5,[[9,9],0]]]',
  '[6,[[[6,2],[5,6]],[[7,6],[4,7]]]]',
  '[[[6,[0,7]],[0,9]],[4,[9,[9,0]]]]',
  '[[[7,[6,4]],[3,[1,3]]],[[[5,5],1],9]]',
  '[[6,[[7,3],[3,2]]],[[[3,8],[5,7]],4]]',
  '[[[[5,4],[7,7]],8],[[8,3],8]]',
  '[[9,3],[[9,9],[6,[4,9]]]]',
  '[[2,[[7,7],7]],[[5,8],[[9,3],[0,2]]]]',
  '[[[[5,2],5],[8,[3,7]]],[[5,[7,5]],[4,4]]]',
].join('\n');

function addLeft(node: TreeNode, delta: number): TreeNode {
  if (delta === 0) return node;
  return typeof node === 'number' ? node + delta : [addLeft(node[0], delta), node[1]];
}

function addRight(node: TreeNode, delta: number): TreeNode {
  if (delta === 0) return node;
  return typeof node === 'number' ? node + delta : [node[0], addRight(node[1], delta)];
}

function explodeTree(node: TreeNode, depth: number): ExplodeRes | null {
  if (typeof node === 'number') return null;
  if (depth === 4) return { node: 0, left: node[0] as number, right: node[1] as number };
  const l = explodeTree(node[0], depth + 1);
  if (l) return { node: [l.node, addLeft(node[1], l.right)], left: l.left, right: 0 };
  const r = explodeTree(node[1], depth + 1);
  if (r) return { node: [addRight(node[0], r.left), r.node], left: 0, right: r.right };
  return null;
}

function splitTree(node: TreeNode): TreeNode | null {
  if (typeof node === 'number') {
    return node >= 10 ? [Math.floor(node / 2), Math.ceil(node / 2)] : null;
  }
  const l = splitTree(node[0]);
  if (l !== null) return [l, node[1]];
  const r = splitTree(node[1]);
  return r !== null ? [node[0], r] : null;
}

function reduceTree(node: TreeNode): TreeNode {
  let cur = node;
  while (true) {
    const exp = explodeTree(cur, 0);
    if (exp) {
      cur = exp.node;
      continue;
    }
    const spl = splitTree(cur);
    if (spl !== null) {
      cur = spl;
      continue;
    }
    return cur;
  }
}

function treeMagnitude(node: TreeNode): number {
  return typeof node === 'number' ? node : 3 * treeMagnitude(node[0]) + 2 * treeMagnitude(node[1]);
}

function oracleMaxPair(lines: readonly string[]): number {
  const trees = lines.map((line) => JSON.parse(line) as TreeNode);
  let best = -1;
  for (let i = 0; i < trees.length; i += 1) {
    for (let j = 0; j < trees.length; j += 1) {
      if (i !== j) best = Math.max(best, treeMagnitude(reduceTree([trees[i]!, trees[j]!])));
    }
  }
  return best;
}

function nextInt(rng: Rng, bound: number): number {
  rng.s = (Math.imul(rng.s, 1664525) + 1013904223) >>> 0;
  return rng.s % bound;
}

function randomSnailfish(rng: Rng, depth: number): string {
  if (depth >= 4 || (depth > 0 && nextInt(rng, 2) === 0)) return String(nextInt(rng, 10));
  return `[${randomSnailfish(rng, depth + 1)},${randomSnailfish(rng, depth + 1)}]`;
}

describe('2021 Day 18 Part 2 solver', () => {
  it('uses MAX_PAIR_MAGNITUDE_POLICY and solves the official homework', () => {
    expect(solver.policy).toBe(MAX_PAIR_MAGNITUDE_POLICY);
    const hw = solver.parse(OFFICIAL_HOMEWORK);
    const answer = solver.solve(hw);
    expect(answer).toBe(3993);
    expect(solver.formatAnswer(answer)).toBe('3993');
    expect(answer).toBe(oracleMaxPair(OFFICIAL_HOMEWORK.split('\n')));
  });

  it('handles non-commutativity, self-pair exclusion, zeros, and duplicate lines', () => {
    const a = '[[[[4,3],4],4],[7,[[8,4],9]]]';
    const b = '[1,1]';
    const cases: readonly [string, number][] = [
      [`${a}\n${b}`, 1384],
      [`${b}\n${a}`, 1384],
      ['[9,9]\n[0,0]', 135],
      ['[0,0]\n[0,0]', 0],
      ['[1,2]\n[1,2]', 35],
    ];
    for (const [raw, expected] of cases) {
      expect(solver.solve(solver.parse(raw))).toBe(expected);
    }
  });

  it('matches recursive tree oracle across 8 seeded PRNG homework lists', () => {
    const rng: Rng = { s: 20211802 };
    for (let trial = 0; trial < 8; trial += 1) {
      const count = 4 + nextInt(rng, 3);
      const lines = Array.from({ length: count }, () => randomSnailfish(rng, 0));
      expect(solver.solve(solver.parse(lines.join('\n')))).toBe(oracleMaxPair(lines));
    }
  });

  it('produces bounded trace frames for winning pair #9 + #1', () => {
    const hw = solver.parse(OFFICIAL_HOMEWORK);
    const frames12 = solver.trace(hw, { maxSteps: 12 });
    expect(frames12).toHaveLength(12);
    expect(frames12[0]!.kind).toBe('initial');
    expect(frames12[0]!.totalOperands).toBe(2);
    expect(frames12[0]!.planDescription).toBe('Winning pair #9 + #1 (mag 3993)');
    expect(frames12[11]!.isComplete).toBe(true);
    expect(frames12[11]!.magnitude).toBe(3993);

    const frames1 = solver.trace(hw, { maxSteps: 1 });
    expect(frames1).toHaveLength(1);
    expect(frames1[0]!.isComplete).toBe(true);
    expect(frames1[0]!.magnitude).toBe(3993);

    const framesDefault = solver.trace(hw);
    expect(framesDefault.length).toBeLessThanOrEqual(DEFAULT_MAX_TRACE_STEPS);
    expect(framesDefault[framesDefault.length - 1]!.magnitude).toBe(3993);
  });

  it('rejects single-line, empty, malformed syntax, and invalid maxSteps', () => {
    const single = solver.parse('[1,2]');
    expect(() => solver.solve(single)).toThrow(RangeError);
    expect(() => solver.trace(single)).toThrow(RangeError);

    for (const empty of ['', '   \n  ']) {
      expect(() => solver.parse(empty)).toThrow(RangeError);
    }
    for (const bad of ['[1,2', '[1,2]x', '[-1,2]', '[a,2]']) {
      expect(() => solver.parse(bad)).toThrow(SyntaxError);
    }

    const valid = solver.parse('[1,2]\n[3,4]');
    for (const badMax of [0, -1, 1.5]) {
      expect(() => solver.trace(valid, { maxSteps: badMax })).toThrow(RangeError);
    }
  });
});
