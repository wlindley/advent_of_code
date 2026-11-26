import { sampleTraceIndices, type TraceOptions, validateMaxSteps } from '../../../shared/core';
import { type CavePoint } from './caveScan';
import { type ReservoirField } from './simulation';

export const DEFAULT_MAX_TRACE_STEPS = 160;

export type ReservoirPhase = 'pouring' | 'escaped' | 'blocked';

/** Immutable playback snapshot of sand pouring at a sampled settled count. */
export class ReservoirTraceFrame {
  readonly settledCount: number;
  readonly totalSettled: number;
  readonly activeGrain: CavePoint | null;
  readonly phase: ReservoirPhase;

  constructor(
    settledCount: number,
    totalSettled: number,
    activeGrain: CavePoint | null,
    phase: ReservoirPhase,
  ) {
    if (!Number.isSafeInteger(totalSettled) || totalSettled < 0) {
      throw new RangeError(`totalSettled must be a non-negative integer, got ${totalSettled}`);
    }
    if (!Number.isSafeInteger(settledCount) || settledCount < 0 || settledCount > totalSettled) {
      throw new RangeError(`settledCount ${settledCount} out of range [0, ${totalSettled}]`);
    }
    this.settledCount = settledCount;
    this.totalSettled = totalSettled;
    this.activeGrain = activeGrain;
    this.phase = phase;
    Object.freeze(this);
  }

  get isComplete(): boolean {
    return this.phase !== 'pouring';
  }
}

function frameAtIndex(field: ReservoirField, idx: number): ReservoirTraceFrame {
  if (idx > field.settledCount) {
    return new ReservoirTraceFrame(field.settledCount, field.settledCount, null, 'escaped');
  }
  const activeGrain = idx === 0 ? null : field.settledPointAt(idx - 1);
  const phase: ReservoirPhase = !field.escaped && idx === field.settledCount ? 'blocked' : 'pouring';
  return new ReservoirTraceFrame(idx, field.settledCount, activeGrain, phase);
}

/** Builds a bounded trace of sand-pouring frames directly from settled grain order. */
export function buildReservoirTrace(
  field: ReservoirField,
  options?: TraceOptions,
): readonly ReservoirTraceFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const total = field.settledCount + (field.escaped ? 2 : 1);
  const indices = sampleTraceIndices(total, maxSteps);
  const frames: ReservoirTraceFrame[] = [];
  for (const idx of indices) frames.push(frameAtIndex(field, idx));
  return Object.freeze(frames);
}
