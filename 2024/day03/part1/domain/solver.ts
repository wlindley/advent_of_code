import {
  sampleTraceIndices,
  validateMaxSteps,
  type PuzzleSolver,
  type TraceOptions,
} from '../../../../shared/core';
import { MulInstruction, parseCorruptedMemory, ParsedMemory } from '../../shared';

export const DEFAULT_MAX_TRACE_STEPS = 200;

export interface MulScanTraceFrame {
  readonly processedCount: number;
  readonly totalMuls: number;
  readonly activeMul: MulInstruction | null;
  readonly runningSum: number;
}

function createTraceFrame(
  processedCount: number,
  totalMuls: number,
  activeMul: MulInstruction | null,
  runningSum: number,
): MulScanTraceFrame {
  return Object.freeze({ processedCount, totalMuls, activeMul, runningSum });
}

/** Sums `x * y` across all valid `mul(X,Y)` instructions in corrupted memory. */
export function sumMultiplications(memory: ParsedMemory): number {
  const muls = memory.mulInstructions;
  let total = 0;
  for (let i = 0; i < muls.length; i += 1) {
    total += muls[i]!.product;
  }
  return total;
}

/** Traces `mul(X,Y)` accumulation sampled uniformly up to `maxSteps` frames. */
export function traceMultiplications(
  memory: ParsedMemory,
  options?: TraceOptions,
): readonly MulScanTraceFrame[] {
  const muls = memory.mulInstructions;
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sampledCounts = sampleTraceIndices(muls.length + 1, limit);
  const frames: MulScanTraceFrame[] = [];
  let sampleCursor = 0;
  let runningSum = 0;

  for (let processedCount = 0; processedCount <= muls.length; processedCount += 1) {
    const activeMul = processedCount > 0 ? muls[processedCount - 1]! : null;
    if (activeMul !== null) runningSum += activeMul.product;
    if (sampledCounts[sampleCursor] === processedCount) {
      frames.push(createTraceFrame(processedCount, muls.length, activeMul, runningSum));
      sampleCursor += 1;
    }
  }
  return Object.freeze(frames);
}

export const solver: PuzzleSolver<ParsedMemory, number, MulScanTraceFrame> = Object.freeze({
  parse: parseCorruptedMemory,
  solve: sumMultiplications,
  trace: traceMultiplications,
});
