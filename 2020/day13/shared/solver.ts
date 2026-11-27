import { validateMaxSteps, type PuzzleSolver, type TraceOptions } from '../../../shared/core';
import { BusSchedule, parseBusSchedule } from './model';
import type { ShuttlePolicy } from './policies';

export const DEFAULT_MAX_TRACE_STEPS = 200;

/** Shared `PuzzleSolver` implementation parameterized by a Day 13 `ShuttlePolicy`. */
export class ShuttleSolver<TTrace>
  implements Required<PuzzleSolver<BusSchedule, bigint, TTrace>>
{
  readonly policy: ShuttlePolicy<TTrace>;

  constructor(policy: ShuttlePolicy<TTrace>) {
    this.policy = policy;
    Object.freeze(this);
  }

  /** Parses raw two-line shuttle notes into a validated `BusSchedule`. */
  parse(raw: string): BusSchedule {
    return parseBusSchedule(raw);
  }

  /** Computes the BigInt puzzle answer under the configured `ShuttlePolicy`. */
  solve(input: BusSchedule): bigint {
    return this.policy.solve(input);
  }

  /** Produces a bounded visualization trace capped by `options.maxSteps`. */
  trace(input: BusSchedule, options?: TraceOptions): readonly TTrace[] {
    const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
    return this.policy.trace(input, maxSteps);
  }
}
