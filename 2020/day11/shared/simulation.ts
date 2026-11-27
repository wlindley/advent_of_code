import type { SeatingLayout } from './layout';
import { buildSeatGraph, type SeatGraph, type SeatingRule } from './rules';

const ASCII_DECODER = new TextDecoder('ascii');

/** Immutable equilibrium outcome of a seating simulation run. */
export class SimulationResult {
  readonly rounds: number;
  readonly rule: SeatingRule;
  private readonly finalOccupancy: Uint8Array;

  constructor(rounds: number, rule: SeatingRule, finalOccupancy: Uint8Array) {
    if (!Number.isInteger(rounds) || rounds < 0) {
      throw new RangeError(`rounds must be a non-negative integer, got ${rounds}`);
    }
    this.rounds = rounds;
    this.rule = rule;
    this.finalOccupancy = finalOccupancy.slice();
    Object.freeze(this);
  }

  get seatCount(): number {
    return this.finalOccupancy.length;
  }

  get occupiedCount(): number {
    let total = 0;
    for (let i = 0; i < this.finalOccupancy.length; i += 1) {
      total += this.finalOccupancy[i]!;
    }
    return total;
  }

  get emptyCount(): number {
    return this.seatCount - this.occupiedCount;
  }

  occupancyAt(seatIndex: number): 0 | 1 {
    if (!Number.isInteger(seatIndex) || seatIndex < 0 || seatIndex >= this.finalOccupancy.length) {
      throw new RangeError(`Seat index ${seatIndex} out of bounds for ${this.finalOccupancy.length} seats`);
    }
    return this.finalOccupancy[seatIndex]! === 1 ? 1 : 0;
  }
}

/** Runs a seating simulation to equilibrium using a prebuilt SeatGraph. */
export function simulateSeatingWithGraph(layout: SeatingLayout, graph: SeatGraph): SimulationResult {
  if (graph.seatCount !== layout.seatCount) {
    throw new RangeError(`SeatGraph seatCount (${graph.seatCount}) does not match layout (${layout.seatCount})`);
  }
  let curr: Uint8Array = layout.copyInitialOccupancy();
  let next: Uint8Array = new Uint8Array(layout.seatCount);
  const seen = new Set<string>([ASCII_DECODER.decode(curr)]);
  let rounds = 0;

  while (true) {
    const changes = graph.stepOccupancy(curr, next);
    if (changes === 0) break;
    rounds += 1;
    const key = ASCII_DECODER.decode(next);
    if (seen.has(key)) {
      throw new Error(`Seating simulation entered a cycle at round ${rounds}`);
    }
    seen.add(key);
    const prev = curr;
    curr = next;
    next = prev;
  }

  return new SimulationResult(rounds, graph.rule, curr);
}

/** Builds a CSR neighbor graph for `rule` and runs the simulation to equilibrium. */
export function simulateSeating(layout: SeatingLayout, rule: SeatingRule): SimulationResult {
  return simulateSeatingWithGraph(layout, buildSeatGraph(layout, rule));
}
