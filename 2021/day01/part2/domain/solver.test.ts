import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { PART2_WINDOW_SIZE, solver } from './index';

const EXAMPLE_INPUT = '199\n200\n208\n210\n200\n207\n240\n269\n260\n263';
const MAX = Number.MAX_SAFE_INTEGER;
const MIN = Number.MIN_SAFE_INTEGER;

function countExplicitThreeSumIncreases(depths: readonly number[]): number {
  let increases = 0;
  for (let i = 3; i < depths.length; i += 1) {
    const prevSum = BigInt(depths[i - 3]!) + BigInt(depths[i - 2]!) + BigInt(depths[i - 1]!);
    const currSum = BigInt(depths[i - 2]!) + BigInt(depths[i - 1]!) + BigInt(depths[i]!);
    if (currSum > prevSum) increases += 1;
  }
  return increases;
}

function nextSeededInt(state: { seed: number }, min: number, max: number): number {
  state.seed = (Math.imul(state.seed, 1664525) + 1013904223) >>> 0;
  return min + (state.seed % (max - min + 1));
}

function fixedClock(): number {
  return 10;
}

describe('2021 day 1 part 2 solver', () => {
  it('uses stride W=3 and solves the official example', () => {
    expect(PART2_WINDOW_SIZE).toBe(3);
    const report = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(report)).toBe(5);
  });

  it('produces exact trace frames for the official example including ties', () => {
    const frames = solver.trace!(solver.parse(EXAMPLE_INPUT));
    expect(frames).toHaveLength(7);
    expect(frames[0]).toEqual({
      comparisonIndex: 0,
      exitingDepth: 199,
      enteringDepth: 210,
      deltaKind: 'increase',
      increasesSoFar: 1,
    });
    expect(frames[1]).toEqual({
      comparisonIndex: 1,
      exitingDepth: 200,
      enteringDepth: 200,
      deltaKind: 'equal',
      increasesSoFar: 1,
    });
    expect(frames[2]).toEqual({
      comparisonIndex: 2,
      exitingDepth: 208,
      enteringDepth: 207,
      deltaKind: 'decrease',
      increasesSoFar: 1,
    });
    expect(frames[6]?.increasesSoFar).toBe(5);
  });

  it('handles boundary sequences of length <= 3 and length === 4', () => {
    for (const shortInput of ['199', '199\n200', '199\n200\n208']) {
      const report = solver.parse(shortInput);
      expect(solver.solve(report)).toBe(0);
      expect(solver.trace!(report)).toEqual([]);
    }
    expect(solver.solve(solver.parse('1\n100\n100\n2'))).toBe(1);
    expect(solver.solve(solver.parse('2\n100\n100\n2'))).toBe(0);
    expect(solver.solve(solver.parse('3\n100\n100\n2'))).toBe(0);
  });

  it('handles monotonic, negative/zero, CRLF/blank lines, and IEEE-754 3-sum boundaries', () => {
    expect(solver.solve(solver.parse('5\n5\n5\n5\n5'))).toBe(0);
    expect(solver.solve(solver.parse('10\n9\n8\n7\n6'))).toBe(0);
    expect(solver.solve(solver.parse('1\n2\n3\n4\n5'))).toBe(2);
    expect(solver.solve(solver.parse('\r\n -5 \r\n\r\n 0 \r\n -2 \r\n 1 \r\n'))).toBe(1);
    expect(solver.solve(solver.parse(`${MAX - 1}\n${MAX}\n${MAX}\n${MAX}`))).toBe(1);
    expect(solver.solve(solver.parse(`${MIN}\n${MIN}\n${MIN}\n${MIN + 1}`))).toBe(1);
  });

  it('matches an independent BigInt 3-sum oracle across 30 seeded sequences', () => {
    const rng = { seed: 20210102 };
    for (let trial = 0; trial < 30; trial += 1) {
      const len = nextSeededInt(rng, 1, 60);
      const depths: number[] = [];
      for (let i = 0; i < len; i += 1) depths.push(nextSeededInt(rng, -50, 50));
      const report = solver.parse(depths.join('\n'));
      expect(solver.solve(report)).toBe(countExplicitThreeSumIncreases(depths));
    }
  });

  it('bounds trace frames by explicit and default maxSteps', () => {
    const example = solver.parse(EXAMPLE_INPUT);
    const sampled = solver.trace!(example, { maxSteps: 3 });
    expect(sampled).toHaveLength(3);
    expect(sampled[2]?.increasesSoFar).toBe(5);

    const large = solver.parse(Array.from({ length: 200 }, (_, i) => String(i % 7)).join('\n'));
    const bounded = solver.trace!(large);
    expect(bounded).toHaveLength(120);
    expect(bounded[119]?.increasesSoFar).toBe(solver.solve(large));
  });

  it('rejects invalid inputs and invalid maxSteps separately', () => {
    expect(() => solver.parse('')).toThrow(RangeError);
    expect(() => solver.parse('  \n\t\n ')).toThrow(RangeError);
    expect(() => solver.parse('abc')).toThrow(SyntaxError);
    expect(() => solver.parse('199.5')).toThrow(SyntaxError);
    expect(() => solver.parse('9007199254740992')).toThrow(RangeError);

    const report = solver.parse(EXAMPLE_INPUT);
    expect(() => solver.trace!(report, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => solver.trace!(report, { maxSteps: -1 })).toThrow(RangeError);
  });

  it('integrates with executeSolver', () => {
    expect(executeSolver(solver, EXAMPLE_INPUT, { nowMs: fixedClock })).toEqual({
      answer: 5,
      elapsedMs: 0,
      runtime: 'main-thread',
    });
  });
});
