import { type TraceOptions, sampleTraceIndices, validateMaxSteps } from '../../../shared/core';
import { PairFitEvaluation } from './matcher';
import type { TumblerInventory } from './schematic';

export const DEFAULT_MAX_TRACE_STEPS = 120;

export type TumblerTracePhase = 'testing' | 'complete';

/** Immutable snapshot of pair-fit progress at a sampled pair evaluation step. */
export class TumblerTraceFrame {
  readonly inventory: TumblerInventory;
  readonly evaluation: PairFitEvaluation | null;
  readonly matchCount: number;

  constructor(inventory: TumblerInventory, evaluation: PairFitEvaluation | null, matchCount: number) {
    if (evaluation === null && inventory.totalPairs > 0) {
      throw new Error('Null evaluation is only valid when inventory has zero pairs');
    }
    if (
      evaluation !== null &&
      (inventory.locks[evaluation.lockIndex] !== evaluation.lock ||
        inventory.keys[evaluation.keyIndex] !== evaluation.key)
    ) {
      throw new Error('Evaluation does not belong to inventory');
    }
    const tested =
      evaluation === null ? 0 : evaluation.lockIndex * inventory.keys.length + evaluation.keyIndex + 1;
    if (!Number.isInteger(matchCount) || matchCount < 0 || matchCount > tested) {
      throw new RangeError(`matchCount ${matchCount} out of range [0, ${tested}]`);
    }
    this.inventory = inventory;
    this.evaluation = evaluation;
    this.matchCount = matchCount;
    Object.freeze(this);
  }

  get pairIndex(): number | null {
    return this.evaluation === null
      ? null
      : this.evaluation.lockIndex * this.inventory.keys.length + this.evaluation.keyIndex;
  }

  get testedCount(): number {
    const idx = this.pairIndex;
    return idx === null ? 0 : idx + 1;
  }

  get totalPairs(): number { return this.inventory.totalPairs; }
  get rejectCount(): number { return this.testedCount - this.matchCount; }
  get isComplete(): boolean { return this.testedCount === this.totalPairs; }
  get phase(): TumblerTracePhase { return this.isComplete ? 'complete' : 'testing'; }

  get fitRatePercent(): number {
    const tested = this.testedCount;
    return tested === 0 ? 0 : (this.matchCount / tested) * 100;
  }
}

/** Builds a bounded trace of sampled `TumblerTraceFrame`s across all lock/key pairs. */
export function buildMatchTrace(
  inventory: TumblerInventory,
  options?: TraceOptions,
): readonly TumblerTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  if (inventory.totalPairs === 0) {
    return Object.freeze([new TumblerTraceFrame(inventory, null, 0)]);
  }
  const sampled = sampleTraceIndices(inventory.totalPairs, limit);
  const frames: TumblerTraceFrame[] = [];
  let matchCount = 0;
  let sampleCursor = 0;
  let pairIndex = 0;
  for (let li = 0; li < inventory.locks.length; li += 1) {
    const lock = inventory.locks[li]!;
    for (let ki = 0; ki < inventory.keys.length; ki += 1) {
      const key = inventory.keys[ki]!;
      if (lock.fitsWith(key)) matchCount += 1;
      if (pairIndex === sampled[sampleCursor]) {
        frames.push(new TumblerTraceFrame(inventory, new PairFitEvaluation(lock, key, li, ki), matchCount));
        sampleCursor += 1;
      }
      pairIndex += 1;
    }
  }
  return Object.freeze(frames);
}
