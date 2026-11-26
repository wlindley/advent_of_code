import { describe, expect, it } from 'vitest';
import { ClosedInterval } from '../../../shared/core';
import {
  computeGlobalBounds,
  containsInterval,
  intersection,
  overlaps,
} from './intervalOps';
import { AssignmentPair, parseAssignmentPairs } from './pair';

describe('2022 day 04 shared intervalOps', () => {
  it('evaluates containment, overlap, and intersection across boundary cases', () => {
    const a = new ClosedInterval(2n, 8n);
    const b = new ClosedInterval(3n, 7n);
    const c = new ClosedInterval(8n, 10n);
    const d = new ClosedInterval(9n, 12n);
    const point = new ClosedInterval(6n, 6n);

    expect(containsInterval(a, b)).toBe(true);
    expect(containsInterval(b, a)).toBe(false);
    expect(containsInterval(a, new ClosedInterval(2n, 9n))).toBe(false);
    expect(containsInterval(point, point)).toBe(true);

    expect(overlaps(a, c)).toBe(true);
    expect(overlaps(a, d)).toBe(false);
    expect(overlaps(d, a)).toBe(false);

    expect(intersection(a, b)).toEqual(new ClosedInterval(3n, 7n));
    expect(intersection(b, a)).toEqual(new ClosedInterval(3n, 7n));
    expect(intersection(a, c)).toEqual(new ClosedInterval(8n, 8n));
    expect(intersection(a, d)).toBeNull();
    expect(intersection(d, a)).toBeNull();
  });

  it('computes global bounds across multiple intervals and rejects empty arrays', () => {
    const bounds = computeGlobalBounds([
      new ClosedInterval(10n, 20n),
      new ClosedInterval(2n, 5n),
      new ClosedInterval(15n, 999999999999999999n),
    ]);
    expect(bounds).toEqual(new ClosedInterval(2n, 999999999999999999n));
    expect(() => computeGlobalBounds([])).toThrow(RangeError);
  });
});

describe('2022 day 04 shared AssignmentPair and parser', () => {
  it('classifies all 5 pair relations and computes dynamic overlap getters', () => {
    const identical = new AssignmentPair(1, new ClosedInterval(6n, 6n), new ClosedInterval(6n, 6n));
    expect(Object.isFrozen(identical)).toBe(true);
    expect(identical.relation).toBe('identical');
    expect(identical.hasFullContainment).toBe(true);
    expect(identical.hasOverlap).toBe(true);
    expect(identical.overlapInterval).toEqual(new ClosedInterval(6n, 6n));

    const firstContains = new AssignmentPair(2, new ClosedInterval(2n, 8n), new ClosedInterval(3n, 7n));
    expect(firstContains.relation).toBe('first-contains-second');
    expect(firstContains.hasFullContainment).toBe(true);
    expect(firstContains.hasOverlap).toBe(true);
    expect(firstContains.overlapInterval).toEqual(new ClosedInterval(3n, 7n));

    const secondContains = new AssignmentPair(3, new ClosedInterval(6n, 6n), new ClosedInterval(4n, 6n));
    expect(secondContains.relation).toBe('second-contains-first');
    expect(secondContains.hasFullContainment).toBe(true);
    expect(secondContains.hasOverlap).toBe(true);
    expect(secondContains.overlapInterval).toEqual(new ClosedInterval(6n, 6n));

    const partial = new AssignmentPair(4, new ClosedInterval(5n, 7n), new ClosedInterval(7n, 9n));
    expect(partial.relation).toBe('partial-overlap');
    expect(partial.hasFullContainment).toBe(false);
    expect(partial.hasOverlap).toBe(true);
    expect(partial.overlapInterval).toEqual(new ClosedInterval(7n, 7n));

    const disjoint = new AssignmentPair(5, new ClosedInterval(2n, 4n), new ClosedInterval(6n, 8n));
    expect(disjoint.relation).toBe('disjoint');
    expect(disjoint.hasFullContainment).toBe(false);
    expect(disjoint.hasOverlap).toBe(false);
    expect(disjoint.overlapInterval).toBeNull();
  });

  it('rejects invalid pairNumber values', () => {
    const iv = new ClosedInterval(1n, 2n);
    for (const bad of [0, -1, 1.5, Number.NaN]) {
      expect(() => new AssignmentPair(bad, iv, iv)).toThrow(RangeError);
    }
  });

  it('parses LF/CRLF inputs, skips blank lines, supports huge BigInt sections, and freezes output', () => {
    const raw = '\r\n  2-4,6-8  \r\n\n9007199254740993-9007199254740999,9007199254740995-9007199254740997\r\n';
    const pairs = parseAssignmentPairs(raw);
    expect(Object.isFrozen(pairs)).toBe(true);
    expect(pairs).toHaveLength(2);
    expect(pairs[0]!.pairNumber).toBe(1);
    expect(pairs[1]!.pairNumber).toBe(2);
    expect(pairs[1]!.first.start).toBe(9007199254740993n);
    expect(pairs[1]!.hasFullContainment).toBe(true);
  });

  it('reports 1-based physical line numbers on malformed syntax, inverted bounds, and empty inputs', () => {
    expect(() => parseAssignmentPairs('')).toThrow(RangeError);
    expect(() => parseAssignmentPairs('   \n\r\n  ')).toThrow(RangeError);
    expect(() => parseAssignmentPairs('2-4,6-8\n\nbad-line')).toThrow(/Line 3/);
    expect(() => parseAssignmentPairs('2-4,6-8\n5-3,6-8')).toThrow(/Line 2/);
    expect(() => parseAssignmentPairs('2-4,9-6')).toThrow(/Line 1/);
  });
});
