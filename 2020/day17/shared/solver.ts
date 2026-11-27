import { type PuzzleSolver, sampleTraceIndices, type TraceOptions, validateMaxSteps } from '../../../shared/core';
import { PocketLattice } from './lattice';
import { parsePocketSlice, type PocketSlice } from './model';
import { DEFAULT_MAX_TRACE_STEPS, type PocketPolicy } from './policies';
import type { PocketCycleTraceFrame } from './trace';

/** Shared 3D/4D Conway Cubes solver parameterized by a PocketPolicy. */
export class ConwayCubesSolver implements Required<PuzzleSolver<PocketSlice, number, PocketCycleTraceFrame>> {
  readonly policy: PocketPolicy;

  constructor(policy: PocketPolicy) {
    this.policy = policy;
    Object.freeze(this);
  }

  parse(raw: string): PocketSlice {
    return parsePocketSlice(raw);
  }

  solve(input: PocketSlice): number {
    const lattice = new PocketLattice(input, this.policy);
    for (let c = 0; c < lattice.maxCycles; c += 1) {
      lattice.stepCycle();
    }
    return lattice.activeCount;
  }

  trace(input: PocketSlice, options?: TraceOptions): readonly PocketCycleTraceFrame[] {
    const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
    const sampled = new Set(sampleTraceIndices(this.policy.cycles + 1, limit));
    const lattice = new PocketLattice(input, this.policy);
    const frames: PocketCycleTraceFrame[] = [];

    if (sampled.has(0)) frames.push(lattice.snapshotFrame());
    for (let c = 1; c <= lattice.maxCycles; c += 1) {
      lattice.stepCycle();
      if (sampled.has(c)) frames.push(lattice.snapshotFrame());
    }
    return Object.freeze(frames);
  }

  formatAnswer(answer: number): string {
    return String(answer);
  }
}
