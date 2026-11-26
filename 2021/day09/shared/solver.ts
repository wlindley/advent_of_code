import { validateMaxSteps, type PuzzleSolver, type TraceOptions } from '../../../shared/core';
import { analyzeHeightmap } from './basin';
import type { Heightmap } from './heightmap';
import { parseHeightmap } from './parser';
import type { SmokeBasinPolicy } from './policy';
import type { SmokeBasinTraceFrame } from './trace';

export const DEFAULT_MAX_TRACE_STEPS = 80;

/** Configurable Smoke Basin solver parameterized by evaluation & trace policy. */
export class SmokeBasinSolver implements Required<PuzzleSolver<Heightmap, number, SmokeBasinTraceFrame>> {
  readonly policy: SmokeBasinPolicy;

  constructor(policy: SmokeBasinPolicy) {
    this.policy = policy;
    Object.freeze(this);
  }

  parse(raw: string): Heightmap {
    return parseHeightmap(raw);
  }

  solve(input: Heightmap): number {
    return this.policy.evaluate(analyzeHeightmap(input));
  }

  trace(input: Heightmap, options?: TraceOptions): readonly SmokeBasinTraceFrame[] {
    const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
    return this.policy.buildTrace(analyzeHeightmap(input), maxSteps);
  }
}
