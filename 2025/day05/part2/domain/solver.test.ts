import { describe, expect, it } from 'vitest';
import { ClosedInterval, executeSolver } from '../../../../shared/core';
import type { IngredientDatabase } from '../../shared';
import { DEFAULT_MAX_TRACE_STEPS, solver } from './index';

const EXAMPLE_INPUT = ['3-5', '10-14', '16-20', '12-18', '', '1', '5', '8', '11', '17', '32'].join('\n');

function sweepLineOracle(db: IngredientDatabase): bigint {
  const events: Array<{ pos: bigint; delta: number }> = [];
  for (const r of db.freshRanges) events.push({ pos: r.start, delta: 1 }, { pos: r.end + 1n, delta: -1 });
  events.sort((a, b) => (a.pos < b.pos ? -1 : a.pos > b.pos ? 1 : a.delta - b.delta));
  let total = 0n;
  let active = 0;
  let prevPos = 0n;
  for (const ev of events) {
    if (active > 0 && ev.pos > prevPos) total += ev.pos - prevPos;
    active += ev.delta;
    prevPos = ev.pos;
  }
  return total;
}

describe('2025 Day 5 Part 2 solver', () => {
  it('solves the official example via solver and executeSolver, ignoring Section 2', () => {
    expect(solver.solve(solver.parse(EXAMPLE_INPUT))).toBe(14n);
    expect(executeSolver(solver, EXAMPLE_INPUT).answer).toBe(14n);
    expect(solver.solve(solver.parse('3-5\n10-14\n16-20\n12-18\n\n999'))).toBe(14n);
  });

  it('handles empty, zero, singletons, adjacent vs 1-gap, nested, same-start ties, and large BigInt', () => {
    expect(solver.solve({ freshRanges: [], availableIds: [] })).toBe(0n);
    expect(solver.solve(solver.parse('0-0\n\n0'))).toBe(1n);
    expect(solver.solve(solver.parse('5-5\n5-5\n\n1'))).toBe(1n);
    expect(solver.solve(solver.parse('3-5\n6-9\n\n1'))).toBe(7n);
    expect(solver.solve(solver.parse('3-5\n7-9\n\n1'))).toBe(6n);
    expect(solver.solve(solver.parse('10-20\n12-15\n10-20\n\n1'))).toBe(11n);
    expect(solver.solve(solver.parse('10-12\n10-18\n10-15\n\n1'))).toBe(9n);
    expect(solver.solve(solver.parse('10-18\n10-12\n\n1'))).toBe(9n);
    expect(solver.solve(solver.parse('500000000000000-500000000000009\n500000000000005-500000000000019\n\n1'))).toBe(20n);
  });

  it('rejects invalid database inputs and invalid trace maxSteps', () => {
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('3-5\n')).toThrow();
    expect(() => solver.parse('5-3\n\n1')).toThrow(RangeError);
    expect(() => solver.parse('abc\n\n1')).toThrow();
    const db = solver.parse(EXAMPLE_INPUT);
    for (const bad of [0, -1, 1.5, Number.NaN]) {
      expect(() => solver.trace!(db, { maxSteps: bad })).toThrow(RangeError);
    }
  });

  it('matches endpoint sweep-line oracle across 190 LCG-seeded unsorted large ranges', () => {
    let seed = 0x7f3a91c5n;
    const nextBig = (mod: bigint) => {
      seed = (6364136223846793005n * seed + 1442695040888963407n) & ((1n << 64n) - 1n);
      return (seed >> 16n) % mod;
    };
    const base = 500_000_000_000_000n;
    const ranges = Array.from({ length: 190 }, () => {
      const start = base + nextBig(10_000n);
      return `${start}-${start + nextBig(120n)}`;
    });
    const db = solver.parse(`${ranges.join('\n')}\n\n1`);
    const expected = sweepLineOracle(db);
    expect(solver.solve(db)).toBe(expected);
    expect(solver.trace!(db).at(-1)!.unionTotal).toBe(expected);
  });

  it('traces all 4 actions, snapshot immutability, frame caps, maxSteps=1, and empty ranges', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(200);
    const db = solver.parse('16-20\n10-11\n10-14\n10-12\n3-5\n6-8\n11-13\n11-13\n12-18\n\n1');
    const frames = solver.trace!(db);
    expect(frames).toHaveLength(10);
    expect(frames[0]).toMatchObject({ step: 0, action: null, activeInterval: null, mergedIntervals: [], rawSum: 0n, unionTotal: 0n });
    expect(frames.map((f) => f.action)).toEqual([null, 'new', 'touch', 'new', 'extend', 'extend', 'absorbed', 'absorbed', 'extend', 'extend']);
    expect(Object.isFrozen(frames[1]!.mergedIntervals)).toBe(true);
    expect(frames.at(-1)).toMatchObject({
      mergedIntervals: [new ClosedInterval(3n, 8n), new ClosedInterval(10n, 20n)], unionTotal: 17n, rawSum: 34n,
    });

    const makeRanges = (r: number) =>
      solver.parse(`${Array.from({ length: r }, (_, i) => `${i * 3}-${i * 3 + 1}`).join('\n')}\n\n1`);
    const capped50 = solver.trace!(makeRanges(50), { maxSteps: 10 });
    expect(capped50.length).toBeLessThanOrEqual(10);
    expect(capped50.at(-1)).toMatchObject({ step: 50, unionTotal: 100n });
    expect(solver.trace!(makeRanges(10), { maxSteps: 4 }).map((f) => f.step)).toEqual([0, 4, 8, 10]);
    expect(solver.trace!(db, { maxSteps: 1 })).toHaveLength(1);
    expect(solver.trace!(db, { maxSteps: 1 })[0]).toMatchObject({ step: 9, unionTotal: 17n });
    expect(solver.trace!({ freshRanges: [], availableIds: [] })[0]).toMatchObject({ step: 0, action: null, unionTotal: 0n });
    expect(solver.trace!({ freshRanges: [], availableIds: [] }, { maxSteps: 1 })).toHaveLength(1);
  });
});
