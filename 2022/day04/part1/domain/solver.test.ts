import { describe, expect, it } from 'vitest';
import { ClosedInterval } from '../../../../shared/core';
import { AssignmentPair, parseAssignmentPairs } from '../../shared';
import { solvePart1, solver, tracePart1 } from './solver';

const EXAMPLE_INPUT = [
  '2-4,6-8',
  '2-3,4-5',
  '5-7,7-9',
  '2-8,3-7',
  '6-6,4-6',
  '2-6,4-8',
].join('\n');

function signProductContainmentOracle(pairs: readonly AssignmentPair[]): number {
  let count = 0;
  for (const { first, second } of pairs) {
    const startDiff = first.start - second.start;
    const endDiff = first.end - second.end;
    if (startDiff * endDiff <= 0n) count += 1;
  }
  return count;
}

function intervalMask(interval: ClosedInterval): bigint {
  let mask = 0n;
  for (let s = interval.start; s <= interval.end; s += 1n) {
    mask |= 1n << s;
  }
  return mask;
}

function bitsetSubsetMaskOracle(pairs: readonly AssignmentPair[]): number {
  let count = 0;
  for (const { first, second } of pairs) {
    const maskA = intervalMask(first);
    const maskB = intervalMask(second);
    const shared = maskA & maskB;
    if (shared === maskA || shared === maskB) count += 1;
  }
  return count;
}

function buildSyntheticPairs(count: number): readonly AssignmentPair[] {
  const pairs: AssignmentPair[] = [];
  for (let i = 0; i < count; i += 1) {
    // Deterministic LCG over bounded sections 1..60 so bitset oracle runs fast too.
    const a = BigInt(((i * 17 + 3) % 55) + 1);
    const b = a + BigInt((i * 13 + 5) % (61 - Number(a)));
    const c = BigInt(((i * 29 + 7) % 55) + 1);
    const d = c + BigInt((i * 19 + 11) % (61 - Number(c)));
    pairs.push(new AssignmentPair(i + 1, new ClosedInterval(a, b), new ClosedInterval(c, d)));
  }
  return pairs;
}

describe('2022 day 04 part 1 solver', () => {
  it('solves the official example to 2 via solver pipeline', () => {
    const parsed = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(parsed)).toBe(2);
    const frames = solver.trace!(parsed);
    expect(frames).toHaveLength(6);
    expect(frames[0]!.pair.relation).toBe('disjoint');
    expect(frames[3]!.pair.relation).toBe('first-contains-second');
    expect(frames[4]!.pair.relation).toBe('second-contains-first');
    expect(frames[5]!.globalBounds).toEqual(new ClosedInterval(2n, 9n));
    expect(frames[5]!.tally.fullContainmentCount).toBe(2);
    expect(frames[5]!.tally.totalPairs).toBe(6);
  });

  it('handles identical, single-section, endpoint-touch, adjacent, and huge BigInt boundaries', () => {
    const cases = parseAssignmentPairs([
      '6-6,6-6',
      '10-10,5-10',
      '5-10,5-5',
      '5-7,7-9',
      '2-3,4-5',
      '9007199254740993-9007199254741050,9007199254741000-9007199254741000',
    ].join('\n'));
    // Expected full containments: 6-6/6-6, 10-10/5-10, 5-10/5-5, and the huge BigInt containment = 4.
    expect(solvePart1(cases)).toBe(4);
  });

  it('rejects empty pair arrays and invalid maxSteps options', () => {
    expect(() => solvePart1([])).toThrow(RangeError);
    expect(() => tracePart1([])).toThrow(RangeError);
    const sample = parseAssignmentPairs('1-2,2-3');
    for (const bad of [0, -1, 1.5, Number.NaN]) {
      expect(() => tracePart1(sample, { maxSteps: bad })).toThrow(RangeError);
    }
  });

  it('matches both sign-product-containment and bitset-subset-mask oracles over 1,000 synthetic pairs and bounds trace frames', () => {
    const pairs = buildSyntheticPairs(1000);
    const expected = solvePart1(pairs);

    expect(expected).toBe(signProductContainmentOracle(pairs));
    expect(expected).toBe(bitsetSubsetMaskOracle(pairs));

    const defaultFrames = tracePart1(pairs);
    expect(Object.isFrozen(defaultFrames)).toBe(true);
    expect(defaultFrames).toHaveLength(120);
    expect(defaultFrames[0]!.stepIndex).toBe(0);
    expect(defaultFrames[0]!.pairIndex).toBe(0);
    expect(defaultFrames[119]!.stepIndex).toBe(119);
    expect(defaultFrames[119]!.pairIndex).toBe(999);
    expect(defaultFrames[119]!.totalSteps).toBe(120);
    expect(defaultFrames[119]!.totalPairs).toBe(1000);
    expect(defaultFrames[119]!.tally.fullContainmentCount).toBe(expected);
    expect(defaultFrames[119]!.tally.totalPairs).toBe(1000);

    const singleFrame = tracePart1(pairs, { maxSteps: 1 });
    expect(singleFrame).toHaveLength(1);
    expect(singleFrame[0]!.pairIndex).toBe(999);
    expect(singleFrame[0]!.tally.fullContainmentCount).toBe(expected);
  });
});
