import { sampleTraceIndices, validateMaxSteps } from '../../../shared/core';
import type { CupRingSpec } from './model';
import type { CrabCupsPolicy } from './policies';
import { CupRing, type CupMoveRecord } from './ring';
import {
  captureTraceFrame,
  DEFAULT_MAX_TRACE_STEPS,
  type CrabCupsTraceFrame,
} from './trace';

/** Executes a complete Crab Cups simulation under the given policy and returns its answer. */
export function simulateCrabCups<TAnswer extends string | bigint>(
  spec: CupRingSpec,
  policy: CrabCupsPolicy<TAnswer>,
): TAnswer {
  const ring = new CupRing(spec, policy.resolveCupCount(spec));
  ring.advance(policy.moves);
  return policy.extractAnswer(ring);
}

/** Runs a single-pass Crab Cups simulation capturing uniformly sampled trace frames. */
export function simulateCrabCupsTrace<TAnswer extends string | bigint>(
  spec: CupRingSpec,
  policy: CrabCupsPolicy<TAnswer>,
  maxSteps: number,
): readonly CrabCupsTraceFrame[] {
  const limit = validateMaxSteps(maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const totalMoves = policy.moves;
  const targetMoves = sampleTraceIndices(totalMoves + 1, limit);
  const ring = new CupRing(spec, policy.resolveCupCount(spec));
  const frames: CrabCupsTraceFrame[] = [];
  let completedMoves = 0;
  let lastMove: CupMoveRecord | null = null;

  for (const target of targetMoves) {
    const delta = target - completedMoves;
    if (delta > 0) {
      lastMove = ring.advance(delta);
      completedMoves = target;
    }
    frames.push(captureTraceFrame(ring, completedMoves, totalMoves, lastMove));
  }
  return Object.freeze(frames);
}
