import { describe, expect, it } from 'vitest';
import { ClosedInterval } from '../../../../shared/core';
import { AssignmentPair, parseAssignmentPairs } from '../../shared';
import { solvePart2, solver, tracePart2 } from './solver';

const EXAMPLE_INPUT = [
  '2-4,6-8',
  '2-3,4-5',
  '5-7,7-9',
  '2-8,3-7',
  '6-6,4-6',
  '2-6,4-8',
].join('\n');

interface SweepEvent {
  readonly pos: bigint;
  readonly delta: 1 | -1;
}

function compareSweepEvents(a: SweepEvent, b: SweepEvent): number {
  if (a.pos !== b.pos) return a.pos < b.pos ? -1 : 1;
  // Process starts (+1) before ends (-1) so shared endpoints register overlap.
  return b.delta - a.delta;
}

function pairHasSweepOverlap(first: ClosedInterval, second: ClosedInterval): boolean {
  const events: SweepEvent[] = [
    { pos: first.start, delta: 1 },
    { pos: first.end, delta: -1 },
    { pos: second.start, delta: 1 },
    { pos: second.end, delta: -1 },
  ];
  events.sort(compareSweepEvents);
  let active = 0;
  for (const event of events) {
    active += event.delta;
    if (active >= 2) return true;
  }
  return false;
}

function endpointSweepOverlapOracle(pairs: readonly AssignmentPair[]): number {
  let count = 0;
  for (const { first, second } of pairs) {
    if (pairHasSweepOverlap(first, second)) count += 1;
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

function bitsetOverlapOracle(pairs: readonly AssignmentPair[]): number {
  let count = 0;
  for (const { first, second } of pairs) {
    if ((intervalMask(first) & intervalMask(second)) !== 0n) count += 1;
  }
  return count;
}

function buildSyntheticPairs(count: number): readonly AssignmentPair[] {
  const pairs: AssignmentPair[] = [];
  for (let i = 0; i < count; i += 1) {
    const a = BigInt(((i * 17 + 3) % 55) + 1);
    const b = a + BigInt((i * 13 + 5) % (61 - Number(a)));
    const c = BigInt(((i * 29 + 7) % 55) + 1);
    const d = c + BigInt((i * 19 + 11) % (61 - Number(c)));
    pairs.push(new AssignmentPair(i + 1, new ClosedInterval(a, b), new ClosedInterval(c, d)));
  }
  return pairs;
}

describe('2022 day 04 part 2 solver', () => {
  it('solves the official example to 4 and emits complete trace metadata', () => {
    const parsed = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(parsed)).toBe(4);
    const frames = solver.trace!(parsed);
    expect(frames).toHaveLength(6);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(Object.isFrozen(frames[0])).toBe(true);
    expect(frames[0]!.pair.hasOverlap).toBe(false);
    expect(frames[2]!.pair.overlapInterval).toEqual(new ClosedInterval(7n, 7n));
    expect(frames[5]!.globalBounds).toEqual(new ClosedInterval(2n, 9n));
    expect(frames[5]!.tally.overlapCount).toBe(4);
    expect(frames[5]!.tally.disjointCount).toBe(2);
    expect(frames[5]!.tally.totalPairs).toBe(6);
  });

  it('handles symmetric touches, adjacent disjoint, identical, singletons, and huge BigInt ranges', () => {
    const touching = parseAssignmentPairs('5-7,7-9\n7-9,5-7');
    expect(solvePart2(touching)).toBe(2);

    const adjacent = parseAssignmentPairs('2-3,4-5\n4-5,2-3');
    expect(solvePart2(adjacent)).toBe(0);

    const singletons = parseAssignmentPairs('6-6,6-6\n6-6,4-6\n4-6,6-6\n6-6,7-7');
    expect(solvePart2(singletons)).toBe(3);

    const huge = parseAssignmentPairs([
      '9007199254740993-9007199254741000,9007199254741000-9007199254741005',
      '9007199254740993-9007199254741000,9007199254741001-9007199254741005',
    ].join('\n'));
    expect(solvePart2(huge)).toBe(1);
  });

  it('handles single-pair inputs and rejects empty arrays or invalid maxSteps', () => {
    const single = parseAssignmentPairs('5-7,7-9');
    expect(solvePart2(single)).toBe(1);
    const singleTrace = tracePart2(single);
    expect(singleTrace).toHaveLength(1);
    expect(singleTrace[0]!.tally.overlapCount).toBe(1);

    expect(() => solvePart2([])).toThrow(RangeError);
    expect(() => tracePart2([])).toThrow(RangeError);
    for (const bad of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => tracePart2(single, { maxSteps: bad })).toThrow(RangeError);
    }
  });

  it('matches both endpoint-sweep and bitset oracles over 1,000 pairs and bounds trace length', () => {
    const pairs = buildSyntheticPairs(1000);
    const expected = solvePart2(pairs);

    expect(expected).toBe(endpointSweepOverlapOracle(pairs));
    expect(expected).toBe(bitsetOverlapOracle(pairs));

    const defaultFrames = tracePart2(pairs);
    expect(defaultFrames).toHaveLength(120);
    expect(defaultFrames[0]!.stepIndex).toBe(0);
    expect(defaultFrames[0]!.pairIndex).toBe(0);
    expect(defaultFrames[119]!.stepIndex).toBe(119);
    expect(defaultFrames[119]!.pairIndex).toBe(999);
    expect(defaultFrames[119]!.totalSteps).toBe(120);
    expect(defaultFrames[119]!.totalPairs).toBe(1000);
    expect(defaultFrames[119]!.tally.overlapCount).toBe(expected);

    const oneFrame = tracePart2(pairs, { maxSteps: 1 });
    expect(oneFrame).toHaveLength(1);
    expect(oneFrame[0]!.pairIndex).toBe(999);
    expect(oneFrame[0]!.tally.overlapCount).toBe(expected);
  });
});
