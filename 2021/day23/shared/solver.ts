import type { PuzzleSolver, TraceOptions } from '../../../shared/core';
import { type BurrowDiagram, parseBurrow } from './parser';
import type { BurrowPolicy } from './policy';
import { findOptimalOrganization } from './search';
import { type BurrowTraceFrame, traceBurrow } from './trace';

export interface AmphipodSolver extends PuzzleSolver<BurrowDiagram, number, BurrowTraceFrame> {
  readonly policy: BurrowPolicy;
  trace(input: BurrowDiagram, options?: TraceOptions): readonly BurrowTraceFrame[];
}

/** Creates a Day 23 Amphipod solver parameterized by burrow depth policy (Part 1 vs Part 2). */
export function createAmphipodSolver(policy: BurrowPolicy): AmphipodSolver {
  return {
    policy,
    parse: parseBurrow,
    solve: (diagram) => findOptimalOrganization(policy.prepare(diagram)).totalEnergy,
    trace: (diagram, options) => traceBurrow(diagram, policy, options),
  };
}
