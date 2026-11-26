import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../../shared/core';
import {
  assertPrintableAscii,
  HASH_BUCKET_COUNT,
  hashAscii,
  HashCharTransition,
  traceHashCharacters,
} from '../../shared';

export const DEFAULT_MAX_TRACE_STEPS = 120;

/** Validates a 256-entry bucket histogram and returns a frozen copy. */
export function validateBucketCounts(counts: readonly number[]): readonly number[] {
  if (counts.length !== HASH_BUCKET_COUNT) {
    throw new RangeError(`Expected ${HASH_BUCKET_COUNT} bucket counts, got ${counts.length}`);
  }
  for (let i = 0; i < counts.length; i += 1) {
    const count = counts[i]!;
    if (!Number.isInteger(count) || count < 0) {
      throw new RangeError(`Bucket ${i} count must be a non-negative integer, got ${count}`);
    }
  }
  return Object.freeze([...counts]);
}

function validateFrameBounds(frameIndex: number, stepIndex: number, totalSteps: number): void {
  if (!Number.isInteger(frameIndex) || frameIndex < 0) {
    throw new RangeError(`frameIndex must be a non-negative integer, got ${frameIndex}`);
  }
  if (!Number.isInteger(totalSteps) || totalSteps < 1) {
    throw new RangeError(`totalSteps must be a positive integer, got ${totalSteps}`);
  }
  if (!Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex >= totalSteps) {
    throw new RangeError(`stepIndex ${stepIndex} out of bounds for totalSteps ${totalSteps}`);
  }
}

function validateFrameToken(token: string): void {
  if (token.length === 0) {
    throw new RangeError('Frame token must not be empty');
  }
  assertPrintableAscii(token);
  if (token.includes(' ')) {
    throw new RangeError(`Frame token "${token}" must not contain spaces`);
  }
}

/** Immutable sampled snapshot of the HASH sequence evaluation at `stepIndex`. */
export class HashSequenceFrame {
  readonly frameIndex: number;
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly token: string;
  readonly bucketCounts: readonly number[];

  constructor(
    frameIndex: number,
    stepIndex: number,
    totalSteps: number,
    token: string,
    bucketCounts: readonly number[],
  ) {
    validateFrameBounds(frameIndex, stepIndex, totalSteps);
    validateFrameToken(token);
    this.frameIndex = frameIndex;
    this.stepIndex = stepIndex;
    this.totalSteps = totalSteps;
    this.token = token;
    this.bucketCounts = validateBucketCounts(bucketCounts);
    Object.freeze(this);
  }

  get processedCount(): number {
    return this.stepIndex + 1;
  }

  get tokenHash(): number {
    return hashAscii(this.token);
  }

  get charTransitions(): readonly HashCharTransition[] {
    return traceHashCharacters(this.token);
  }

  get runningSum(): number {
    let sum = 0;
    for (let b = 0; b < HASH_BUCKET_COUNT; b += 1) {
      sum += b * this.bucketCounts[b]!;
    }
    return sum;
  }

  get occupiedBuckets(): number {
    let occupied = 0;
    for (let b = 0; b < HASH_BUCKET_COUNT; b += 1) {
      if (this.bucketCounts[b]! > 0) occupied += 1;
    }
    return occupied;
  }

  get maxBucketCount(): number {
    let peak = 0;
    for (let b = 0; b < HASH_BUCKET_COUNT; b += 1) {
      const count = this.bucketCounts[b]!;
      if (count > peak) peak = count;
    }
    return peak;
  }
}

/** Generates up to `maxSteps` uniformly sampled frames across `steps`. */
export function traceHashSequence(
  steps: readonly string[],
  options?: TraceOptions,
): readonly HashSequenceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sampled = sampleTraceIndices(steps.length, limit);
  const counts = new Uint32Array(HASH_BUCKET_COUNT);
  const frames: HashSequenceFrame[] = [];
  let cursor = 0;
  for (let i = 0; i < steps.length; i += 1) {
    const token = steps[i]!;
    const h = hashAscii(token);
    counts[h] = counts[h]! + 1;
    if (sampled[cursor] === i) {
      frames.push(new HashSequenceFrame(cursor, i, steps.length, token, Array.from(counts)));
      cursor += 1;
    }
  }
  return Object.freeze(frames);
}
