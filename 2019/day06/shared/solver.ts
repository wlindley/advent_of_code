import { validateMaxSteps, type PuzzleSolver, type TraceOptions } from '../../../shared/core';
import type { OrbitMap } from './orbitMap';
import { parseOrbitMap } from './parser';
import { DEFAULT_MAX_TRACE_STEPS, type OrbitQueryPolicy, type OrbitTraceFrame } from './policy';

/** Policy-parameterized solver for Advent of Code 2019 Day 6 orbit maps. */
export class OrbitMapSolver implements Required<PuzzleSolver<OrbitMap, number, OrbitTraceFrame>> {
  readonly policy: OrbitQueryPolicy;

  constructor(policy: OrbitQueryPolicy) {
    this.policy = policy;
    Object.freeze(this);
  }

  parse(raw: string): OrbitMap {
    return parseOrbitMap(raw);
  }

  solve(input: OrbitMap): number {
    return this.policy.solve(input);
  }

  trace(input: OrbitMap, options?: TraceOptions): readonly OrbitTraceFrame[] {
    const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
    return this.policy.trace(input, maxSteps);
  }
}
