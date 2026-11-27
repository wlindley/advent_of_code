import { validateMaxSteps, type PuzzleSolver, type TraceOptions } from '../../../shared/core';
import type { OctopusGrid } from './grid';
import { parseOctopusGrid } from './parser';
import type { OctopusPolicy } from './policy';
import { captureSampledTrace, DEFAULT_TRACE_MAX_STEPS, type OctopusStepFrame } from './trace';

/** Pure TypeScript solver parameterized by an `OctopusPolicy` (Part 1 or Part 2). */
export class OctopusSolver implements Required<PuzzleSolver<OctopusGrid, number, OctopusStepFrame>> {
  readonly policy: OctopusPolicy;

  constructor(policy: OctopusPolicy) {
    this.policy = policy;
    Object.freeze(this);
  }

  parse(raw: string): OctopusGrid {
    return parseOctopusGrid(raw);
  }

  solve(grid: OctopusGrid): number {
    return this.policy.extractAnswer(this.policy.simulate(grid));
  }

  trace(grid: OctopusGrid, options?: TraceOptions): readonly OctopusStepFrame[] {
    const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_TRACE_MAX_STEPS);
    const history = this.policy.simulate(grid);
    return captureSampledTrace(grid, history, maxSteps);
  }
}
