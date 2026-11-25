import { describe, expect, it } from 'vitest';
import { ClosedInterval, executeSolver } from '../../../../shared/core';
import type { IngredientDatabase } from '../../shared';
import { DEFAULT_MAX_TRACE_STEPS, solver } from './index';

const EXAMPLE_INPUT = ['3-5', '10-14', '16-20', '12-18', '', '1', '5', '8', '11', '17', '32'].join('\n');

function linearRangeOracle(db: IngredientDatabase): number {
  let count = 0;
  for (const id of db.availableIds) {
    if (db.freshRanges.some((r) => r.contains(id))) count += 1;
  }
  return count;
}

describe('2025 Day 5 Part 1 solver', () => {
  it('solves the official example via solver and executeSolver', () => {
    const db = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(db)).toBe(3);
    expect(executeSolver(solver, EXAMPLE_INPUT).answer).toBe(3);
  });

  it('handles all spoiled, all fresh, duplicates, singletons, zeros, and 15-digit boundaries', () => {
    expect(solver.solve(solver.parse('10-20\n\n1\n9\n21'))).toBe(0);
    expect(solver.solve(solver.parse('10-20\n\n10\n15\n20'))).toBe(3);
    expect(solver.solve(solver.parse('5-5\n\n5\n5\n5'))).toBe(3);
    const bigInput = [
      '0-0', '100000000000000-100000000000010', '',
      '0', '99999999999999', '100000000000000', '100000000000010', '100000000000011',
    ].join('\n');
    expect(solver.solve(solver.parse(bigInput))).toBe(3);
  });

  it('matches linear-range-scan oracle across 40 unsorted ranges and 150 queries', () => {
    let seed = 0x51a7b3c9;
    const nextInt = (max: number) => {
      seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
      return seed % max;
    };
    const ranges = Array.from({ length: 40 }, () => {
      const a = nextInt(1000);
      return `${a}-${a + nextInt(40)}`;
    });
    const queries = Array.from({ length: 150 }, () => String(nextInt(1100)));
    const db = solver.parse(`${ranges.join('\n')}\n\n${queries.join('\n')}`);
    expect(solver.solve(db)).toBe(linearRangeOracle(db));
  });

  it('traces small, capped, empty-query, single-step, and rejects invalid maxSteps', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(200);
    const smallDb = solver.parse(EXAMPLE_INPUT);
    const smallFrames = solver.trace!(smallDb);
    expect(smallFrames).toHaveLength(7);
    expect(smallFrames[0]).toMatchObject({
      step: 0, queryIndex: null, queryId: null, matchedInterval: null, freshCount: 0,
    });
    expect(smallFrames[0]!.mergedIntervals).toBe(smallFrames[6]!.mergedIntervals);
    expect(smallFrames[6]).toMatchObject({
      step: 6, queryIndex: 5, queryId: 32n, matchedInterval: null, freshCount: 3,
    });
    expect(smallFrames[2]!.matchedInterval).toEqual(new ClosedInterval(3n, 5n));

    const makeQueries = (q: number) =>
      solver.parse(`10-20\n\n${Array.from({ length: q }, (_, i) => String(i + 5)).join('\n')}`);

    const capped50 = solver.trace!(makeQueries(50), { maxSteps: 10 });
    expect(capped50.length).toBeLessThanOrEqual(10);
    expect(capped50.at(-1)!.step).toBe(50);
    expect(capped50.at(-1)!.freshCount).toBe(11);

    const capped10 = solver.trace!(makeQueries(10), { maxSteps: 4 });
    expect(capped10.map((f) => f.step)).toEqual([0, 4, 8, 10]);

    const single = solver.trace!(smallDb, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]).toMatchObject({ step: 6, queryIndex: 5, freshCount: 3 });

    const emptyQ = solver.trace!({ freshRanges: [new ClosedInterval(1n, 2n)], availableIds: [] }, { maxSteps: 1 });
    expect(emptyQ).toHaveLength(1);
    expect(emptyQ[0]).toMatchObject({ step: 0, queryIndex: null, freshCount: 0 });

    for (const bad of [0, -1, 1.5, Number.NaN]) {
      expect(() => solver.trace!(smallDb, { maxSteps: bad })).toThrow(RangeError);
    }
  });
});
