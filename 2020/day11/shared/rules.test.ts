import { describe, expect, it } from 'vitest';
import { parseSeatingLayout } from './layout';
import {
  ADJACENT_SEATING_RULE,
  buildSeatGraph,
  LINE_OF_SIGHT_SEATING_RULE,
  type SeatingRule,
} from './rules';

describe('Seating rules and SeatGraph', () => {
  it('resolves 8-neighbor adjacent seats and stops at floor or boundaries', () => {
    const layout = parseSeatingLayout('L.L\n.#.\n..L');
    expect(ADJACENT_SEATING_RULE.id).toBe('adjacent');
    expect(ADJACENT_SEATING_RULE.crowdThreshold).toBe(4);
    expect(ADJACENT_SEATING_RULE.findNeighborSeat(layout, 1, 1, [-1, -1])).toBe(0);
    expect(ADJACENT_SEATING_RULE.findNeighborSeat(layout, 1, 1, [0, 1])).toBeNull();
    expect(ADJACENT_SEATING_RULE.findNeighborSeat(layout, 0, 0, [-1, 0])).toBeNull();
  });

  it('casts line-of-sight rays across floor cells and stops at first seat', () => {
    const layout = parseSeatingLayout([
      '.......#.',
      '...#.....',
      '.#.......',
      '.........',
      '..#L....#',
      '....#....',
      '.........',
      '#........',
      '...#.....',
    ].join('\n'));
    const centerRow = 4;
    const centerCol = 3;
    expect(LINE_OF_SIGHT_SEATING_RULE.id).toBe('line-of-sight');
    expect(LINE_OF_SIGHT_SEATING_RULE.crowdThreshold).toBe(5);
    const graph = buildSeatGraph(layout, LINE_OF_SIGHT_SEATING_RULE);
    const centerIndex = layout.seatIndexAt(centerRow, centerCol)!;
    expect(graph.neighborsOf(centerIndex)).toHaveLength(8);

    const openRay = parseSeatingLayout('.#.\n...\n.L.');
    expect(LINE_OF_SIGHT_SEATING_RULE.findNeighborSeat(openRay, 2, 1, [-1, 0])).toBe(0);
    expect(LINE_OF_SIGHT_SEATING_RULE.findNeighborSeat(openRay, 2, 1, [0, 1])).toBeNull();
  });

  it('builds an immutable CSR SeatGraph and validates neighborsOf bounds', () => {
    const layout = parseSeatingLayout('L.L\n.#.');
    const graph = buildSeatGraph(layout, ADJACENT_SEATING_RULE);
    expect(graph.rule).toBe(ADJACENT_SEATING_RULE);
    expect(graph.seatCount).toBe(3);
    expect(graph.edgeCount).toBe(4);

    const centerNeighbors = graph.neighborsOf(2);
    expect(centerNeighbors).toEqual([0, 1]);
    expect(Object.isFrozen(centerNeighbors)).toBe(true);
    expect(() => graph.neighborsOf(-1)).toThrow(RangeError);
    expect(() => graph.neighborsOf(3)).toThrow(RangeError);
    expect(() => graph.neighborsOf(0.5)).toThrow(RangeError);

    const emptyGraph = buildSeatGraph(parseSeatingLayout('..'), ADJACENT_SEATING_RULE);
    expect(emptyGraph.seatCount).toBe(0);
    expect(emptyGraph.edgeCount).toBe(0);
  });

  it('rejects invalid crowdThreshold values in buildSeatGraph', () => {
    const layout = parseSeatingLayout('L');
    const makeBadRule = (threshold: number): SeatingRule => ({
      id: 'adjacent',
      label: 'Bad',
      crowdThreshold: threshold,
      findNeighborSeat: () => null,
    });
    expect(() => buildSeatGraph(layout, makeBadRule(0))).toThrow(RangeError);
    expect(() => buildSeatGraph(layout, makeBadRule(-2))).toThrow(RangeError);
    expect(() => buildSeatGraph(layout, makeBadRule(2.5))).toThrow(RangeError);
  });

  it('executes stepOccupancy transitions and validates buffer invariants', () => {
    const layout = parseSeatingLayout('###\n#L#\nL..');
    const graph = buildSeatGraph(layout, ADJACENT_SEATING_RULE);
    const curr = layout.copyInitialOccupancy();
    const next = new Uint8Array(graph.seatCount);

    expect(() => graph.stepOccupancy(curr, curr)).toThrow(RangeError);
    expect(() => graph.stepOccupancy(new Uint8Array(1), next)).toThrow(RangeError);
    expect(() => graph.stepOccupancy(curr, new Uint8Array(1))).toThrow(RangeError);

    // Seat 1 (0,1) has 4 occupied neighbors -> vacates; all other seats hold steady.
    const changes = graph.stepOccupancy(curr, next);
    expect(changes).toBe(1);
    expect(Array.from(next)).toEqual([1, 0, 1, 1, 0, 1, 0]);

    // Isolated empty seat becomes occupied when adj === 0
    const single = buildSeatGraph(parseSeatingLayout('L'), ADJACENT_SEATING_RULE);
    const sCurr = new Uint8Array([0]);
    const sNext = new Uint8Array(1);
    expect(single.stepOccupancy(sCurr, sNext)).toBe(1);
    expect(Array.from(sNext)).toEqual([1]);
  });
});
