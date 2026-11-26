import {
  sampleTraceIndices,
  validateMaxSteps,
  type TraceOptions,
} from '../../../../shared/core';
import { traceHashCharacters, type HashCharTransition } from '../../shared';
import { OpticalBench, type LensBoxSnapshot, type LensMutationOutcome } from './bench';
import type { LensInstruction } from './instruction';

export const DEFAULT_MAX_TRACE_STEPS = 120;

function assertValidFrameIndices(frameIndex: number, stepIndex: number, totalSteps: number): void {
  if (!Number.isInteger(frameIndex) || frameIndex < 0) {
    throw new RangeError(`frameIndex must be a non-negative integer, got ${frameIndex}`);
  }
  if (!Number.isInteger(totalSteps) || totalSteps < 1) {
    throw new RangeError(`totalSteps must be a positive integer, got ${totalSteps}`);
  }
  if (!Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex >= totalSteps) {
    throw new RangeError(`stepIndex must be in [0, ${totalSteps - 1}], got ${stepIndex}`);
  }
}

function validateOccupiedBoxes(boxes: readonly LensBoxSnapshot[]): readonly LensBoxSnapshot[] {
  let previousBoxIndex = -1;
  for (const box of boxes) {
    if (box.lenses.length === 0) {
      throw new RangeError(`Occupied box snapshot ${box.boxIndex} must not be empty`);
    }
    if (box.boxIndex <= previousBoxIndex) {
      throw new RangeError(
        `Occupied box indices must be strictly increasing, got ${box.boxIndex} after ${previousBoxIndex}`,
      );
    }
    previousBoxIndex = box.boxIndex;
  }
  return Object.freeze([...boxes]);
}

/** Immutable sampled trace snapshot after applying a single HASHMAP instruction. */
export class HashmapTraceFrame {
  readonly frameIndex: number;
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly instruction: LensInstruction;
  readonly outcome: LensMutationOutcome;
  readonly occupiedBoxes: readonly LensBoxSnapshot[];

  constructor(
    frameIndex: number,
    stepIndex: number,
    totalSteps: number,
    instruction: LensInstruction,
    outcome: LensMutationOutcome,
    occupiedBoxes: readonly LensBoxSnapshot[],
  ) {
    assertValidFrameIndices(frameIndex, stepIndex, totalSteps);
    this.frameIndex = frameIndex;
    this.stepIndex = stepIndex;
    this.totalSteps = totalSteps;
    this.instruction = instruction;
    this.outcome = outcome;
    this.occupiedBoxes = validateOccupiedBoxes(occupiedBoxes);
    Object.freeze(this);
  }

  get processedCount(): number {
    return this.stepIndex + 1;
  }

  get labelTransitions(): readonly HashCharTransition[] {
    return traceHashCharacters(this.instruction.label);
  }

  get occupiedBoxCount(): number {
    return this.occupiedBoxes.length;
  }

  get totalLensCount(): number {
    let count = 0;
    for (const box of this.occupiedBoxes) count += box.lenses.length;
    return count;
  }

  get focusingPower(): number {
    let total = 0;
    for (const box of this.occupiedBoxes) total += box.focusingPower;
    return total;
  }
}

/** Executes a HASHMAP instruction sequence and returns uniformly sampled trace frames. */
export function traceHashmapSequence(
  instructions: readonly LensInstruction[],
  options?: TraceOptions,
): readonly HashmapTraceFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sampled = sampleTraceIndices(instructions.length, maxSteps);
  const bench = new OpticalBench();
  const frames: HashmapTraceFrame[] = [];
  let cursor = 0;
  for (let i = 0; i < instructions.length; i += 1) {
    const instruction = instructions[i]!;
    const outcome = instruction.apply(bench);
    if (sampled[cursor] === i) {
      frames.push(
        new HashmapTraceFrame(
          cursor,
          i,
          instructions.length,
          instruction,
          outcome,
          bench.snapshotOccupiedBoxes(),
        ),
      );
      cursor += 1;
    }
  }
  return Object.freeze(frames);
}
