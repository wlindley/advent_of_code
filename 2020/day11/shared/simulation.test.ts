import { describe, expect, it } from 'vitest';
import { parseSeatingLayout } from './layout';
import {
  ADJACENT_SEATING_RULE,
  buildSeatGraph,
  LINE_OF_SIGHT_SEATING_RULE,
} from './rules';
import {
  simulateSeating,
  simulateSeatingWithGraph,
  SimulationResult,
} from './simulation';

const EXAMPLE_10X10 = [
  'L.LL.LL.LL',
  'LLLLLLL.LL',
  'L.L.L..L..',
  'LLLL.LL.LL',
  'L.LL.LL.LL',
  'L.LLLLL.LL',
  '..L.L.....',
  'LLLLLLLLLL',
  'L.LLLLLL.L',
  'L.LLLLL.LL',
].join('\n');

const OCTAGON_4X4 = ['.LL.', 'LLLL', 'LLLL', '.LL.'].join('\n');

describe('simulateSeating', () => {
  it('solves the 10x10 example under both adjacent and line-of-sight rules', () => {
    const layout = parseSeatingLayout(EXAMPLE_10X10);
    const p1 = simulateSeating(layout, ADJACENT_SEATING_RULE);
    expect(p1.rule).toBe(ADJACENT_SEATING_RULE);
    expect(p1.rounds).toBe(5);
    expect(p1.seatCount).toBe(71);
    expect(p1.occupiedCount).toBe(37);
    expect(p1.emptyCount).toBe(34);
    expect(p1.occupancyAt(layout.seatIndexAt(0, 0)!)).toBe(1);
    expect(p1.occupancyAt(layout.seatIndexAt(0, 3)!)).toBe(0);

    const p2 = simulateSeating(layout, LINE_OF_SIGHT_SEATING_RULE);
    expect(p2.rounds).toBe(6);
    expect(p2.occupiedCount).toBe(26);
    expect(p2.emptyCount).toBe(45);
  });

  it('handles zero-round all-floor, already-stable, and single-seat layouts', () => {
    const floor = simulateSeating(parseSeatingLayout('..\n..'), ADJACENT_SEATING_RULE);
    expect(floor.rounds).toBe(0);
    expect(floor.seatCount).toBe(0);
    expect(floor.occupiedCount).toBe(0);
    expect(floor.emptyCount).toBe(0);

    const stable = simulateSeating(parseSeatingLayout('#.#'), ADJACENT_SEATING_RULE);
    expect(stable.rounds).toBe(0);
    expect(stable.occupiedCount).toBe(2);

    const single = simulateSeating(parseSeatingLayout('L'), ADJACENT_SEATING_RULE);
    expect(single.rounds).toBe(1);
    expect(single.occupiedCount).toBe(1);
    expect(single.emptyCount).toBe(0);
  });

  it('detects cycles on the 4x4 hollow-corner octagon for Part 1 and stabilizes for Part 2', () => {
    const octagon = parseSeatingLayout(OCTAGON_4X4);
    expect(() => simulateSeating(octagon, ADJACENT_SEATING_RULE)).toThrow(
      'Seating simulation entered a cycle at round 2',
    );
    const losResult = simulateSeating(octagon, LINE_OF_SIGHT_SEATING_RULE);
    expect(losResult.rounds).toBe(2);
    expect(losResult.occupiedCount).toBe(8);
  });

  it('validates SimulationResult and graph/layout seatCount mismatches', () => {
    expect(() => new SimulationResult(-1, ADJACENT_SEATING_RULE, new Uint8Array(0))).toThrow(RangeError);
    expect(() => new SimulationResult(0.5, ADJACENT_SEATING_RULE, new Uint8Array(0))).toThrow(RangeError);

    const result = new SimulationResult(0, ADJACENT_SEATING_RULE, new Uint8Array([1]));
    expect(() => result.occupancyAt(-1)).toThrow(RangeError);
    expect(() => result.occupancyAt(1)).toThrow(RangeError);
    expect(() => result.occupancyAt(0.5)).toThrow(RangeError);

    const small = parseSeatingLayout('L');
    const largerGraph = buildSeatGraph(parseSeatingLayout('LL'), ADJACENT_SEATING_RULE);
    expect(() => simulateSeatingWithGraph(small, largerGraph)).toThrow(RangeError);
  });
});
