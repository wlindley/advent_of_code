import { sampleTraceIndices, validateMaxSteps } from '../../../shared/core';
import type { SeatingLayout } from './layout';
import { buildSeatGraph, type SeatGraph, type SeatingRule } from './rules';
import { simulateSeatingWithGraph } from './simulation';

export type SeatVisualState = 0 | 1 | 2 | 3;

export const DEFAULT_MAX_TRACE_STEPS = 120;

function countState(states: Uint8Array, target: SeatVisualState): number {
  let count = 0;
  for (let i = 0; i < states.length; i += 1) {
    if (states[i]! === target) count += 1;
  }
  return count;
}

/** Computes per-seat visual diff states (`0` empty, `1` steady occupied, `2` newly occupied, `3` newly vacated). */
export function diffSeatStates(prev: Uint8Array, curr: Uint8Array): Uint8Array {
  const diff = new Uint8Array(curr.length);
  for (let i = 0; i < curr.length; i += 1) {
    const before = prev[i]!;
    const after = curr[i]!;
    diff[i] = before === after ? after : after === 1 ? 2 : 3;
  }
  return diff;
}

/** Immutable snapshot of seating occupancy and per-round transitions for visualization. */
export class SeatingTraceFrame {
  readonly round: number;
  readonly totalRounds: number;
  private readonly seatStates: Uint8Array;

  constructor(round: number, totalRounds: number, seatStates: Uint8Array) {
    if (!Number.isInteger(round) || round < 0) {
      throw new RangeError(`round must be a non-negative integer, got ${round}`);
    }
    if (!Number.isInteger(totalRounds) || totalRounds < round) {
      throw new RangeError(`totalRounds (${totalRounds}) must be an integer >= round (${round})`);
    }
    this.round = round;
    this.totalRounds = totalRounds;
    this.seatStates = seatStates.slice();
    Object.freeze(this);
  }

  get seatCount(): number {
    return this.seatStates.length;
  }

  get occupiedCount(): number {
    return countState(this.seatStates, 1) + countState(this.seatStates, 2);
  }

  get emptyCount(): number {
    return this.seatCount - this.occupiedCount;
  }

  get newlyOccupiedCount(): number {
    return countState(this.seatStates, 2);
  }

  get newlyVacatedCount(): number {
    return countState(this.seatStates, 3);
  }

  get changedCount(): number {
    return this.newlyOccupiedCount + this.newlyVacatedCount;
  }

  get isStable(): boolean {
    return this.round === this.totalRounds;
  }

  stateAt(seatIndex: number): SeatVisualState {
    if (!Number.isInteger(seatIndex) || seatIndex < 0 || seatIndex >= this.seatStates.length) {
      throw new RangeError(`Seat index ${seatIndex} out of bounds for ${this.seatStates.length} seats`);
    }
    return this.seatStates[seatIndex]! as SeatVisualState;
  }
}

function replaySampledFrames(
  layout: SeatingLayout,
  graph: SeatGraph,
  totalRounds: number,
  sampled: readonly number[],
): readonly SeatingTraceFrame[] {
  const frames: SeatingTraceFrame[] = [];
  let curr: Uint8Array = layout.copyInitialOccupancy();
  let next: Uint8Array = new Uint8Array(layout.seatCount);
  let sampleCursor = 0;

  if (sampled[0] === 0) {
    frames.push(new SeatingTraceFrame(0, totalRounds, diffSeatStates(curr, curr)));
    sampleCursor = 1;
  }
  for (let round = 1; round <= totalRounds; round += 1) {
    graph.stepOccupancy(curr, next);
    if (sampled[sampleCursor] === round) {
      frames.push(new SeatingTraceFrame(round, totalRounds, diffSeatStates(curr, next)));
      sampleCursor += 1;
    }
    const prev = curr;
    curr = next;
    next = prev;
  }
  return Object.freeze(frames);
}

/** Traces a seating simulation using a 2-pass replay bounded to `maxSteps` sampled frames. */
export function traceSeating(
  layout: SeatingLayout,
  rule: SeatingRule,
  maxSteps: number,
): readonly SeatingTraceFrame[] {
  const limit = validateMaxSteps(maxSteps, maxSteps);
  const graph = buildSeatGraph(layout, rule);
  const result = simulateSeatingWithGraph(layout, graph);
  const sampled = sampleTraceIndices(result.rounds + 1, limit);
  return replaySampledFrames(layout, graph, result.rounds, sampled);
}
