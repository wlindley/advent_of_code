import { describe, expect, it } from 'vitest';
import {
  BasinFrame,
  LegResult,
  PART1_WAYPOINTS,
  PART2_WAYPOINTS,
  TripResult,
} from './types';

describe('Day 24 domain types', () => {
  it('exposes frozen waypoint sequences for Part 1 and Part 2', () => {
    expect(PART1_WAYPOINTS).toEqual(['start', 'end']);
    expect(PART2_WAYPOINTS).toEqual(['start', 'end', 'start', 'end']);
    expect(Object.isFrozen(PART1_WAYPOINTS)).toBe(true);
    expect(Object.isFrozen(PART2_WAYPOINTS)).toBe(true);
  });

  it('constructs LegResult with dynamic duration, arrivalTime, and endpoint getters', () => {
    const path = new Int32Array([0, 1, 2, 7]);
    const counts = new Int32Array([1, 2, 3, 2]);
    const leg = new LegResult(10, path, counts);
    path[0] = 99; // External mutation must not alter leg state.

    expect(leg.startTime).toBe(10);
    expect(leg.duration).toBe(3);
    expect(leg.arrivalTime).toBe(13);
    expect(leg.startCellId).toBe(0);
    expect(leg.endCellId).toBe(7);
    expect(Array.from(leg.path)).toEqual([0, 1, 2, 7]);
    expect(Array.from(leg.frontierCounts)).toEqual([1, 2, 3, 2]);
    expect(Object.isFrozen(leg)).toBe(true);
  });

  it('validates LegResult invariants', () => {
    expect(() => new LegResult(-1, new Int32Array([0]), new Int32Array([1]))).toThrow(RangeError);
    expect(() => new LegResult(0.5, new Int32Array([0]), new Int32Array([1]))).toThrow(RangeError);
    expect(() => new LegResult(0, new Int32Array(0), new Int32Array(0))).toThrow(RangeError);
    expect(() => new LegResult(0, new Int32Array([0, 1]), new Int32Array([1]))).toThrow(RangeError);
  });

  it('constructs TripResult and computes totalMinutes and legDurations dynamically', () => {
    const leg1 = new LegResult(0, new Int32Array([0, 1, 7]), new Int32Array([1, 2, 1]));
    const leg2 = new LegResult(2, new Int32Array([7, 6, 1, 0]), new Int32Array([1, 2, 2, 1]));
    const trip = new TripResult([leg1, leg2]);

    expect(trip.legs).toHaveLength(2);
    expect(trip.totalMinutes).toBe(5);
    expect(trip.legDurations).toEqual([2, 3]);
    expect(Object.isFrozen(trip)).toBe(true);
    expect(() => new TripResult([])).toThrow(RangeError);
  });

  it('constructs immutable BasinFrame snapshots and validates indices', () => {
    const frame = new BasinFrame(4, 1, 3, { row: 2, col: 3 }, 'right', 5);
    expect(frame.minute).toBe(4);
    expect(frame.legIndex).toBe(1);
    expect(frame.legCount).toBe(3);
    expect(frame.position).toEqual({ row: 2, col: 3 });
    expect(frame.action).toBe('right');
    expect(frame.frontierCount).toBe(5);
    expect(Object.isFrozen(frame)).toBe(true);
    expect(Object.isFrozen(frame.position)).toBe(true);

    expect(() => new BasinFrame(-1, 0, 1, { row: 0, col: 1 }, 'start', 1)).toThrow(RangeError);
    expect(() => new BasinFrame(0, 0, 0, { row: 0, col: 1 }, 'start', 1)).toThrow(RangeError);
    expect(() => new BasinFrame(0, 1, 1, { row: 0, col: 1 }, 'start', 1)).toThrow(RangeError);
    expect(() => new BasinFrame(0, -1, 1, { row: 0, col: 1 }, 'start', 1)).toThrow(RangeError);
    expect(() => new BasinFrame(0, 0, 1, { row: 0, col: 1 }, 'start', -1)).toThrow(RangeError);
  });
});
