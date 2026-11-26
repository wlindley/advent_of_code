import { describe, expect, it } from 'vitest';
import {
  createEmptyRelationCounts,
  DEFAULT_MAX_TRACE_STEPS,
  PAIR_RELATIONS,
  RelationTally,
} from './tally';

describe('2022 day 04 shared RelationTally', () => {
  it('defines default trace cap and frozen pair relations', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(120);
    expect(Object.isFrozen(PAIR_RELATIONS)).toBe(true);
    expect(PAIR_RELATIONS).toEqual([
      'identical',
      'first-contains-second',
      'second-contains-first',
      'partial-overlap',
      'disjoint',
    ]);
  });

  it('creates zeroed counts and computes dynamic aggregates on frozen RelationTally', () => {
    const counts = createEmptyRelationCounts();
    counts.identical = 1;
    counts['first-contains-second'] = 2;
    counts['second-contains-first'] = 3;
    counts['partial-overlap'] = 4;
    counts.disjoint = 5;

    const tally = new RelationTally(counts);
    // Mutating the caller object afterwards must not affect the immutable tally.
    counts.disjoint = 99;

    expect(Object.isFrozen(tally)).toBe(true);
    expect(Object.isFrozen(tally.counts)).toBe(true);
    expect(tally.countOf('identical')).toBe(1);
    expect(tally.countOf('first-contains-second')).toBe(2);
    expect(tally.countOf('second-contains-first')).toBe(3);
    expect(tally.countOf('partial-overlap')).toBe(4);
    expect(tally.countOf('disjoint')).toBe(5);
    expect(tally.totalPairs).toBe(15);
    expect(tally.fullContainmentCount).toBe(6);
    expect(tally.overlapCount).toBe(10);
    expect(tally.disjointCount).toBe(5);
  });

  it('rejects negative, fractional, or non-finite relation counts', () => {
    for (const bad of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      const counts = createEmptyRelationCounts();
      counts['partial-overlap'] = bad;
      expect(() => new RelationTally(counts)).toThrow(RangeError);
    }
  });
});
