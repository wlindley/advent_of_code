import {
  sampleTraceIndices,
  validateMaxSteps,
  type TraceOptions,
} from '../../../shared/core';
import type { DiskMap } from './diskMap';

/** Default frame limit for bounded compaction playback traces. */
export const DEFAULT_MAX_TRACE_STEPS = 250;

function assertIntMin(value: number, min: number, name: string): void {
  if (!Number.isInteger(value) || value < min) {
    throw new RangeError(`${name} must be an integer >= ${min}, got ${value}`);
  }
}

/** Immutable leftward block-extent relocation generated during compaction. */
export class CompactionMove {
  readonly fileId: number;
  readonly fromStart: number;
  readonly toStart: number;
  readonly length: number;

  constructor(fileId: number, fromStart: number, toStart: number, length: number) {
    assertIntMin(fileId, 0, 'fileId');
    assertIntMin(fromStart, 0, 'fromStart');
    assertIntMin(toStart, 0, 'toStart');
    assertIntMin(length, 1, 'length');
    if (toStart + length > fromStart) {
      throw new RangeError(
        `CompactionMove must shift strictly left without overlap (${toStart} + ${length} > ${fromStart})`,
      );
    }
    this.fileId = fileId;
    this.fromStart = fromStart;
    this.toStart = toStart;
    this.length = length;
    Object.freeze(this);
  }

  get fromEnd(): number {
    return this.fromStart + this.length;
  }

  get toEnd(): number {
    return this.toStart + this.length;
  }

  get checksumDelta(): bigint {
    return BigInt(this.fileId) * BigInt(this.length) * BigInt(this.toStart - this.fromStart);
  }
}

/** Immutable snapshot of compaction progress at a sampled move count. */
export class CompactionTraceFrame {
  readonly appliedMoves: number;
  readonly totalMoves: number;
  readonly lastMove: CompactionMove | null;
  readonly blocksMoved: number;
  readonly checksum: bigint;

  constructor(
    appliedMoves: number,
    totalMoves: number,
    lastMove: CompactionMove | null,
    blocksMoved: number,
    checksum: bigint,
  ) {
    assertIntMin(appliedMoves, 0, 'appliedMoves');
    assertIntMin(totalMoves, appliedMoves, 'totalMoves');
    assertIntMin(blocksMoved, 0, 'blocksMoved');
    if ((appliedMoves === 0) !== (lastMove === null)) {
      throw new RangeError('lastMove must be null if and only if appliedMoves === 0');
    }
    this.appliedMoves = appliedMoves;
    this.totalMoves = totalMoves;
    this.lastMove = lastMove;
    this.blocksMoved = blocksMoved;
    this.checksum = checksum;
    Object.freeze(this);
  }
}

/** Strategy contract mapping a parsed disk layout into leftward compaction moves. */
export interface CompactionStrategy {
  readonly id: string;
  readonly label: string;
  plan(disk: DiskMap): readonly CompactionMove[];
}

/** Computes exact final checksum after applying all compaction moves to `disk`. */
export function computeCompactedChecksum(
  disk: DiskMap,
  moves: readonly CompactionMove[],
): bigint {
  let checksum = disk.initialChecksum;
  for (const move of moves) {
    checksum += move.checksumDelta;
  }
  return checksum;
}

/** Uniformly samples up to `maxSteps` trace frames across `[0, moves.length]`. */
export function sampleCompactionTrace(
  disk: DiskMap,
  moves: readonly CompactionMove[],
  options?: TraceOptions,
): readonly CompactionTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sampleIndices = sampleTraceIndices(moves.length + 1, limit);
  const frames: CompactionTraceFrame[] = [];
  let samplePos = 0;
  let blocksMoved = 0;
  let checksum = disk.initialChecksum;

  if (sampleIndices[samplePos] === 0) {
    frames.push(new CompactionTraceFrame(0, moves.length, null, 0, checksum));
    samplePos += 1;
  }

  for (let i = 0; i < moves.length && samplePos < sampleIndices.length; i += 1) {
    const move = moves[i]!;
    blocksMoved += move.length;
    checksum += move.checksumDelta;
    const applied = i + 1;
    if (sampleIndices[samplePos] === applied) {
      frames.push(new CompactionTraceFrame(applied, moves.length, move, blocksMoved, checksum));
      samplePos += 1;
    }
  }
  return Object.freeze(frames);
}
