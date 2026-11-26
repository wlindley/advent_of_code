import { describe, expect, it } from 'vitest';
import { Hailstone, parseHailstones, TestArea, Vec3 } from './hailstone';
import {
  classifyPair2D,
  countFutureIntersections2D,
  IntersectionSummary,
  summarizeIntersections2D,
} from './intersection2d';

const EXAMPLE_INPUT = [
  '19, 13, 30 @ -2,  1, -2',
  '18, 19, 22 @ -1, -1, -2',
  '20, 25, 34 @ -2, -2, -4',
  '12, 31, 28 @ -1, -2, -1',
  '20, 19, 15 @  1, -5, -3',
].join('\n');

describe('IntersectionSummary', () => {
  it('stores category counts and derives totalPairs dynamically', () => {
    const summary = new IntersectionSummary(2, 3, 1, 1, 2, 1);
    expect(Object.isFrozen(summary)).toBe(true);
    expect(summary.inside).toBe(2);
    expect(summary.outside).toBe(3);
    expect(summary.pastA).toBe(1);
    expect(summary.pastB).toBe(1);
    expect(summary.pastBoth).toBe(2);
    expect(summary.parallel).toBe(1);
    expect(summary.totalPairs).toBe(10);
  });
});

describe('classifyPair2D', () => {
  it('classifies parallel, inside, outside, past-a, past-b, and past-both accurately', () => {
    const stones = parseHailstones(EXAMPLE_INPUT);
    const area = new TestArea(7n, 27n);

    const ab = classifyPair2D(stones[0]!, stones[1]!, area);
    expect(ab.kind).toBe('inside');
    if (ab.kind !== 'parallel') {
      expect(ab.xNum).toBe(43n);
      expect(ab.yNum).toBe(46n);
      expect(ab.den).toBe(3n);
    }

    expect(classifyPair2D(stones[0]!, stones[3]!, area).kind).toBe('outside');
    expect(classifyPair2D(stones[0]!, stones[4]!, area).kind).toBe('past-a');
    expect(classifyPair2D(stones[2]!, stones[4]!, area).kind).toBe('past-b');
    expect(classifyPair2D(stones[1]!, stones[4]!, area).kind).toBe('past-both');
    expect(classifyPair2D(stones[1]!, stones[2]!, area)).toEqual({
      kind: 'parallel',
      indexA: 1,
      indexB: 2,
    });
  });

  it('normalizes negative determinants symmetrically when pair order flips', () => {
    const area = new TestArea(7n, 27n);
    const a = new Hailstone(0, new Vec3(19n, 13n, 0n), new Vec3(-2n, 1n, 0n));
    const b = new Hailstone(1, new Vec3(18n, 19n, 0n), new Vec3(-1n, -1n, 0n));
    const forward = classifyPair2D(a, b, area);
    const reverse = classifyPair2D(b, a, area);

    expect(forward.kind).toBe('inside');
    expect(reverse.kind).toBe('inside');
    if (forward.kind !== 'parallel' && reverse.kind !== 'parallel') {
      expect(forward.den).toBe(3n);
      expect(reverse.den).toBe(3n);
      expect(reverse.xNum).toBe(forward.xNum);
      expect(reverse.yNum).toBe(forward.yNum);
      expect(reverse.tANum).toBe(forward.tBNum);
      expect(reverse.tBNum).toBe(forward.tANum);
    }
  });
});

describe('summarizeIntersections2D and countFutureIntersections2D', () => {
  it('summarizes all pairs and counts future inside intersections for example input', () => {
    const stones = parseHailstones(EXAMPLE_INPUT);
    const area = new TestArea(7n, 27n);
    const summary = summarizeIntersections2D(stones, area);

    expect(summary.inside).toBe(2);
    expect(summary.outside).toBe(3);
    expect(summary.pastA).toBe(1);
    expect(summary.pastB).toBe(1);
    expect(summary.pastBoth).toBe(2);
    expect(summary.parallel).toBe(1);
    expect(summary.totalPairs).toBe(10);
    expect(countFutureIntersections2D(stones, area)).toBe(2);
  });

  it('handles fewer than two hailstones', () => {
    const area = new TestArea(0n, 10n);
    const one = parseHailstones('1, 2, 3 @ 1, 1, 1');
    expect(countFutureIntersections2D([], area)).toBe(0);
    expect(summarizeIntersections2D(one, area).totalPairs).toBe(0);
  });
});
