import {
  sampleTraceIndices,
  validateMaxSteps,
  type TraceOptions,
} from '../../../../shared/core';
import type { SensorReading } from '../../shared';
import {
  collectCandidates,
  findUniqueUncoveredIndex,
  tuningFrequency,
  type DistressPoint,
} from './candidates';

/** Default frame cap so large candidate sets never stall browser playback. */
export const DEFAULT_MAX_TRACE_STEPS = 120;

/** Immutable snapshot of distress-beacon candidate inspection progress. */
export class DistressTraceFrame {
  readonly checkedCount: number;
  readonly totalCandidates: number;
  readonly revealedCandidates: readonly DistressPoint[];
  readonly coveringSensorIndex: number | null;
  readonly distressPoint: DistressPoint | null;

  constructor(
    checkedCount: number,
    totalCandidates: number,
    revealedCandidates: readonly DistressPoint[],
    coveringSensorIndex: number | null,
    distressPoint: DistressPoint | null,
  ) {
    if (!Number.isSafeInteger(totalCandidates) || totalCandidates < 1) {
      throw new RangeError(`totalCandidates must be a positive safe integer, got ${totalCandidates}`);
    }
    if (!Number.isSafeInteger(checkedCount) || checkedCount < 0 || checkedCount > totalCandidates) {
      throw new RangeError(`checkedCount (${checkedCount}) must be in 0..${totalCandidates}`);
    }
    if (checkedCount === 0 && (revealedCandidates.length > 0 || coveringSensorIndex !== null)) {
      throw new RangeError('checkedCount 0 requires empty revealedCandidates and null coveringSensorIndex');
    }
    if (coveringSensorIndex !== null && (!Number.isInteger(coveringSensorIndex) || coveringSensorIndex < 0)) {
      throw new RangeError(`coveringSensorIndex must be a non-negative integer, got ${coveringSensorIndex}`);
    }
    this.checkedCount = checkedCount;
    this.totalCandidates = totalCandidates;
    this.revealedCandidates = Object.freeze([...revealedCandidates]);
    this.coveringSensorIndex = coveringSensorIndex;
    this.distressPoint = distressPoint;
    Object.freeze(this);
  }

  get activeCandidate(): DistressPoint | null {
    return this.revealedCandidates.length === 0
      ? null
      : this.revealedCandidates[this.revealedCandidates.length - 1]!;
  }

  get tuningFrequency(): bigint | null {
    return this.distressPoint ? tuningFrequency(this.distressPoint) : null;
  }

  get isComplete(): boolean {
    return this.checkedCount === this.totalCandidates;
  }
}

/** Builds a bounded trace of candidate intersection checkpoints within `[0, maxCoord]^2`. */
export function buildDistressTrace(
  readings: readonly SensorReading[],
  maxCoord: number,
  options?: TraceOptions,
): readonly DistressTraceFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const candidates = collectCandidates(readings, maxCoord);
  const distressIdx = findUniqueUncoveredIndex(readings, candidates);
  const sampled = sampleTraceIndices(candidates.length + 1, maxSteps);
  const revealed: DistressPoint[] = [];
  const frames: DistressTraceFrame[] = [];
  for (const targetCount of sampled) {
    if (targetCount === 0) {
      frames.push(new DistressTraceFrame(0, candidates.length, [], null, null));
      continue;
    }
    const active = candidates[targetCount - 1]!;
    revealed.push(active);
    const idx = readings.findIndex((r) => r.covers(active.x, active.y));
    const coveringSensorIndex = idx >= 0 ? idx : null;
    const distressPoint = targetCount > distressIdx ? candidates[distressIdx]! : null;
    frames.push(new DistressTraceFrame(
      targetCount, candidates.length, revealed, coveringSensorIndex, distressPoint,
    ));
  }
  return Object.freeze(frames);
}
