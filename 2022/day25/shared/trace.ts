import { floorDiv, sampleTraceIndices, type TraceOptions, validateMaxSteps } from '../../../shared/core';
import type { SnafuLedger } from './ledger';
import { encodeSnafu, SNAFU_DIGITS, type SnafuDigit, type SnafuDigitValue, type SnafuNumber } from './snafu';

export const DEFAULT_TRACE_MAX_STEPS = 160;

/** Trace snapshot for adding one ledger entry into the running total. */
export class AccumulateFrame {
  readonly kind = 'accumulate' as const;
  readonly entryIndex: number;
  readonly entry: SnafuNumber;
  readonly runningDecimal: bigint;

  constructor(entryIndex: number, entry: SnafuNumber, runningDecimal: bigint) {
    if (!Number.isInteger(entryIndex) || entryIndex < 0) {
      throw new RangeError(`entryIndex must be a non-negative integer, got ${entryIndex}`);
    }
    this.entryIndex = entryIndex;
    this.entry = entry;
    this.runningDecimal = runningDecimal;
    Object.freeze(this);
  }

  get previousDecimal(): bigint { return this.runningDecimal - this.entry.decimal; }
  get runningSnafu(): string { return encodeSnafu(this.runningDecimal); }
}

/** Trace snapshot for extracting one balanced base-5 digit and carry from a total. */
export class EncodeStepFrame {
  readonly kind = 'encode' as const;
  readonly placeIndex: number;
  readonly remainingBefore: bigint;
  readonly builtSuffix: string;

  constructor(placeIndex: number, remainingBefore: bigint, builtSuffix: string) {
    if (!Number.isInteger(placeIndex) || placeIndex < 0) {
      throw new RangeError(`placeIndex must be a non-negative integer, got ${placeIndex}`);
    }
    if (builtSuffix.length !== placeIndex) {
      throw new RangeError(`builtSuffix length (${builtSuffix.length}) must match placeIndex (${placeIndex})`);
    }
    this.placeIndex = placeIndex;
    this.remainingBefore = remainingBefore;
    this.builtSuffix = builtSuffix;
    Object.freeze(this);
  }

  get placeValue(): bigint { return 5n ** BigInt(this.placeIndex); }
  get rawQuotient(): bigint { return floorDiv(this.remainingBefore, 5n); }
  get rawRemainder(): number { return Number(this.remainingBefore - 5n * this.rawQuotient); }
  get carry(): 0 | 1 { return this.rawRemainder > 2 ? 1 : 0; }
  get digitValue(): SnafuDigitValue {
    return (this.rawRemainder > 2 ? this.rawRemainder - 5 : this.rawRemainder) as SnafuDigitValue;
  }
  get digit(): SnafuDigit { return SNAFU_DIGITS[this.digitValue + 2]!; }
  get remainingAfter(): bigint { return this.rawQuotient + BigInt(this.carry); }
  get partialSnafu(): string { return this.digit + this.builtSuffix; }
  get isFinalStep(): boolean { return this.remainingAfter === 0n; }
}

export type FuelTraceFrame = AccumulateFrame | EncodeStepFrame;

/** Generates the full LSB-to-MSB SNAFU encoding cascade for a signed `bigint` total. */
export function buildEncodeFrames(total: bigint): readonly EncodeStepFrame[] {
  const frames: EncodeStepFrame[] = [];
  let remaining = total;
  let suffix = '';
  let placeIndex = 0;
  do {
    const frame = new EncodeStepFrame(placeIndex, remaining, suffix);
    frames.push(frame);
    remaining = frame.remainingAfter;
    suffix = frame.partialSnafu;
    placeIndex += 1;
  } while (remaining !== 0n);
  return Object.freeze(frames);
}

/** Samples at most `maxFrames` accumulation frames while preserving exact running prefix sums. */
export function buildAccumulateFrames(ledger: SnafuLedger, maxFrames: number): readonly AccumulateFrame[] {
  const indices = sampleTraceIndices(ledger.count, maxFrames);
  const frames: AccumulateFrame[] = [];
  let running = 0n;
  let nextSample = 0;
  for (let i = 0; i < ledger.count; i += 1) {
    const entry = ledger.entries[i]!;
    running += entry.decimal;
    if (indices[nextSample] === i) {
      frames.push(new AccumulateFrame(i, entry, running));
      nextSample += 1;
    }
  }
  return Object.freeze(frames);
}

/** Traces ledger accumulation and SNAFU encoding into a bounded sequence of frames. */
export function traceFuelLedger(ledger: SnafuLedger, options?: TraceOptions): readonly FuelTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_TRACE_MAX_STEPS);
  const encodeFrames = buildEncodeFrames(ledger.totalDecimal);
  if (limit <= encodeFrames.length) {
    const indices = sampleTraceIndices(encodeFrames.length, limit);
    const sampled: EncodeStepFrame[] = [];
    for (let i = 0; i < indices.length; i += 1) sampled.push(encodeFrames[indices[i]!]!);
    return Object.freeze(sampled);
  }
  return Object.freeze([...buildAccumulateFrames(ledger, limit - encodeFrames.length), ...encodeFrames]);
}
