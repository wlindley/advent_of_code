import type { PuzzleSolver, TraceOptions } from '../../../shared/core';
import { AsteroidMap } from './asteroidMap';
import type { MonitoringStationPolicy } from './policies';
import type { StationTraceFrame } from './trace';

/** Policy-driven `PuzzleSolver` implementation for AoC 2019 Day 10. */
export class MonitoringStationSolver<
  TAnswer,
  TTrace extends StationTraceFrame = StationTraceFrame,
> implements Required<PuzzleSolver<AsteroidMap, TAnswer, TTrace>>
{
  readonly policy: MonitoringStationPolicy<TAnswer, TTrace>;

  constructor(policy: MonitoringStationPolicy<TAnswer, TTrace>) {
    this.policy = policy;
    Object.freeze(this);
  }

  parse(raw: string): AsteroidMap {
    return AsteroidMap.parse(raw);
  }

  solve(input: AsteroidMap): TAnswer {
    return this.policy.evaluate(input);
  }

  trace(input: AsteroidMap, options?: TraceOptions): readonly TTrace[] {
    return this.policy.trace(input, options);
  }
}
