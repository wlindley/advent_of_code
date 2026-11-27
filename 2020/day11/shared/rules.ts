import { DIRS_8, type GridDelta } from '../../../shared/core';
import type { SeatingLayout } from './layout';

export type SeatingRuleId = 'adjacent' | 'line-of-sight';

export interface SeatingRule {
  readonly id: SeatingRuleId;
  readonly label: string;
  readonly crowdThreshold: number;
  findNeighborSeat(layout: SeatingLayout, row: number, col: number, delta: GridDelta): number | null;
}

function findAdjacentSeat(
  layout: SeatingLayout,
  row: number,
  col: number,
  delta: GridDelta,
): number | null {
  return layout.seatIndexAt(row + delta[0], col + delta[1]);
}

function findLineOfSightSeat(
  layout: SeatingLayout,
  row: number,
  col: number,
  delta: GridDelta,
): number | null {
  let r = row + delta[0];
  let c = col + delta[1];
  while (layout.grid.inBounds(r, c)) {
    const seatIndex = layout.seatIndexAt(r, c);
    if (seatIndex !== null) return seatIndex;
    r += delta[0];
    c += delta[1];
  }
  return null;
}

/** Part 1 seating rule inspecting the 8 immediately adjacent cells. */
export const ADJACENT_SEATING_RULE: SeatingRule = Object.freeze({
  id: 'adjacent',
  label: 'Adjacent (8-neighbor)',
  crowdThreshold: 4,
  findNeighborSeat: findAdjacentSeat,
});

/** Part 2 seating rule casting 8 visibility rays over floor tiles. */
export const LINE_OF_SIGHT_SEATING_RULE: SeatingRule = Object.freeze({
  id: 'line-of-sight',
  label: 'Line of Sight',
  crowdThreshold: 5,
  findNeighborSeat: findLineOfSightSeat,
});

/** Compressed sparse row (CSR) neighbor graph for O(edges) seating simulation rounds. */
export class SeatGraph {
  readonly rule: SeatingRule;
  private readonly offsets: Int32Array;
  private readonly neighbors: Int32Array;

  constructor(rule: SeatingRule, offsets: Int32Array, neighbors: Int32Array) {
    this.rule = rule;
    this.offsets = offsets.slice();
    this.neighbors = neighbors.slice();
    Object.freeze(this);
  }

  get seatCount(): number {
    return this.offsets.length - 1;
  }

  get edgeCount(): number {
    return this.neighbors.length;
  }

  neighborsOf(seatIndex: number): readonly number[] {
    if (!Number.isInteger(seatIndex) || seatIndex < 0 || seatIndex >= this.seatCount) {
      throw new RangeError(`Seat index ${seatIndex} out of bounds for ${this.seatCount} seats`);
    }
    const start = this.offsets[seatIndex]!;
    const end = this.offsets[seatIndex + 1]!;
    return Object.freeze(Array.from(this.neighbors.subarray(start, end)));
  }

  stepOccupancy(curr: Uint8Array, next: Uint8Array): number {
    if (curr === next) {
      throw new RangeError('curr and next occupancy buffers must not alias');
    }
    const count = this.seatCount;
    if (curr.length !== count || next.length !== count) {
      throw new RangeError(`Expected occupancy buffers of length ${count}, got ${curr.length} and ${next.length}`);
    }
    const threshold = this.rule.crowdThreshold;
    let changes = 0;

    for (let i = 0; i < count; i += 1) {
      const adj = this.countOccupiedNeighbors(curr, i);
      const occupied = curr[i]!;
      const updated = occupied === 0 ? (adj === 0 ? 1 : 0) : (adj >= threshold ? 0 : 1);
      next[i] = updated;
      if (updated !== occupied) changes += 1;
    }
    return changes;
  }

  private countOccupiedNeighbors(curr: Uint8Array, seatIndex: number): number {
    let adj = 0;
    const end = this.offsets[seatIndex + 1]!;
    for (let e = this.offsets[seatIndex]!; e < end; e += 1) {
      adj += curr[this.neighbors[e]!]!;
    }
    return adj;
  }
}

/** Precomputes CSR seat neighbor lists for a layout under the given seating rule. */
export function buildSeatGraph(layout: SeatingLayout, rule: SeatingRule): SeatGraph {
  if (!Number.isInteger(rule.crowdThreshold) || rule.crowdThreshold < 1) {
    throw new RangeError(`crowdThreshold must be an integer >= 1, got ${rule.crowdThreshold}`);
  }
  const offsets = new Int32Array(layout.seatCount + 1);
  const flatNeighbors: number[] = [];

  for (let i = 0; i < layout.seatCount; i += 1) {
    const { row, col } = layout.coordOf(i);
    for (const delta of DIRS_8) {
      const neighbor = rule.findNeighborSeat(layout, row, col, delta);
      if (neighbor !== null) flatNeighbors.push(neighbor);
    }
    offsets[i + 1] = flatNeighbors.length;
  }
  return new SeatGraph(rule, offsets, Int32Array.from(flatNeighbors));
}
