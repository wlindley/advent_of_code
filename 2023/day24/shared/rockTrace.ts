import { sampleTraceIndices, type TraceOptions, validateMaxSteps } from '../../../shared/core';
import type { Vec3 } from './hailstone';
import type { HailstoneCollision, RockTrajectory } from './rockTrajectory';

export const DEFAULT_ROCK_TRACE_STEPS = 120;

export interface RockTraceFrame {
  readonly step: number;
  readonly totalCollisions: number;
  readonly rockPosition: Vec3;
  readonly activeCollision: HailstoneCollision | null;
  readonly sortedCollisions: readonly HailstoneCollision[];
}

function compareCollisions(a: HailstoneCollision, b: HailstoneCollision): number {
  if (a.time !== b.time) {
    return a.time < b.time ? -1 : 1;
  }
  return a.hailstoneId - b.hailstoneId;
}

/** Builds a bounded chronological trace of rock-hailstone collisions. */
export function buildRockTrace(
  trajectory: RockTrajectory,
  options?: TraceOptions,
): readonly RockTraceFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_ROCK_TRACE_STEPS);
  const sorted = Object.freeze([...trajectory.collisions].sort(compareCollisions));
  const sampled = sampleTraceIndices(sorted.length + 1, maxSteps);
  const frames: RockTraceFrame[] = [];
  for (let i = 0; i < sampled.length; i += 1) {
    const step = sampled[i]!;
    const activeCollision = step === 0 ? null : sorted[step - 1]!;
    const time = activeCollision === null ? 0n : activeCollision.time;
    frames.push(
      Object.freeze({
        step,
        totalCollisions: sorted.length,
        rockPosition: trajectory.positionAt(time),
        activeCollision,
        sortedCollisions: sorted,
      }),
    );
  }
  return Object.freeze(frames);
}
