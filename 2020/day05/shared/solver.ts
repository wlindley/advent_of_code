import type { PuzzleSolver, TraceOptions } from '../../../shared/core';
import { CabinOccupancy } from './occupancy';
import type { SeatQueryPolicy } from './policy';
import { BoardingManifest, parseBoardingManifest } from './seat';
import { BoardingTraceFrame, traceBoardingManifest } from './trace';

/** Parameterized Day 5 boarding solver bound to a specific `SeatQueryPolicy`. */
export class BoardingSolver implements Required<PuzzleSolver<BoardingManifest, number, BoardingTraceFrame>> {
  readonly policy: SeatQueryPolicy;

  constructor(policy: SeatQueryPolicy) {
    this.policy = policy;
    Object.freeze(this);
  }

  parse(raw: string): BoardingManifest {
    return parseBoardingManifest(raw);
  }

  solve(manifest: BoardingManifest): number {
    return this.policy.query(CabinOccupancy.fromManifest(manifest)).seatId;
  }

  trace(manifest: BoardingManifest, options?: TraceOptions): readonly BoardingTraceFrame[] {
    return traceBoardingManifest(manifest, this.policy, options?.maxSteps);
  }
}
