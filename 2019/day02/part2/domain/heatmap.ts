import { bigintLog2 } from '../../../../shared/core';
import type { IntcodeProgram } from '../../../shared/intcode';
import { runGravityAssist } from '../../shared';

/** Default per-axis sample resolution for the Part 2 error-landscape heatmap. */
export const DEFAULT_HEATMAP_SAMPLES = 21;

/** Computes log2(|error|) + 1 for non-zero errors and 0 for exact matches so unit errors stay distinct. */
export function computeLogError(absError: bigint): number {
  return absError === 0n ? 0 : bigintLog2(absError) + 1;
}

function assertAxisIndex(index: number, length: number, label: string): void {
  if (!Number.isInteger(index) || index < 0 || index >= length) {
    throw new RangeError(`${label} out of bounds: ${index}`);
  }
}

/** Immutable wrapper over a sampled normalized log-error landscape across (noun, verb) inputs. */
export class SearchHeatmap {
  readonly nounSamples: readonly bigint[];
  readonly verbSamples: readonly bigint[];
  private readonly normalizedErrors: Float64Array;
  readonly maxError: bigint;

  constructor(
    nounSamples: readonly bigint[],
    verbSamples: readonly bigint[],
    normalizedErrors: Float64Array,
    maxError: bigint,
  ) {
    this.nounSamples = Object.freeze([...nounSamples]);
    this.verbSamples = Object.freeze([...verbSamples]);
    // Typed arrays cannot be Object.freeze()'d; keep un-frozen and encapsulate behind bounds-checked reads.
    this.normalizedErrors = normalizedErrors;
    this.maxError = maxError;
    Object.freeze(this);
  }

  get size(): number {
    return this.nounSamples.length;
  }

  get maxInput(): bigint {
    return this.nounSamples[this.nounSamples.length - 1]!;
  }

  normalizedErrorAt(nounIndex: number, verbIndex: number): number {
    assertAxisIndex(nounIndex, this.nounSamples.length, 'nounIndex');
    assertAxisIndex(verbIndex, this.verbSamples.length, 'verbIndex');
    return this.normalizedErrors[nounIndex * this.verbSamples.length + verbIndex]!;
  }
}

/** Builds a frozen ascending BigInt sample axis across [0, maxInput] using exact range or rounded interpolation. */
export function buildAxisSamples(maxInput: bigint, sampleCount: number): readonly bigint[] {
  if (maxInput < 1n) {
    throw new RangeError(`maxInput must be >= 1, got ${maxInput}`);
  }
  if (!Number.isInteger(sampleCount) || sampleCount < 2) {
    throw new RangeError(`sampleCount must be an integer >= 2, got ${sampleCount}`);
  }
  const samples: bigint[] = [];
  if (maxInput + 1n <= BigInt(sampleCount)) {
    for (let v = 0n; v <= maxInput; v += 1n) {
      samples.push(v);
    }
    return Object.freeze(samples);
  }
  const denom = BigInt(sampleCount - 1);
  const half = denom / 2n;
  for (let i = 0; i < sampleCount; i += 1) {
    samples.push((BigInt(i) * maxInput + half) / denom);
  }
  return Object.freeze(samples);
}

function normalizeErrors(errors: Float64Array, maxLog: number): void {
  if (maxLog <= 0) {
    return;
  }
  for (let i = 0; i < errors.length; i += 1) {
    errors[i] = errors[i]! / maxLog;
  }
}

/** Evaluates a sampled (noun, verb) grid and normalizes log2 error distances relative to target. */
export function buildSearchHeatmap(
  program: IntcodeProgram,
  target: bigint,
  maxInput: bigint,
  sampleCount: number,
): SearchHeatmap {
  const samples = buildAxisSamples(maxInput, sampleCount);
  const size = samples.length;
  const errors = new Float64Array(size * size);
  let maxError = 0n;
  let maxLog = 0;
  for (let ni = 0; ni < size; ni += 1) {
    for (let vi = 0; vi < size; vi += 1) {
      const output = runGravityAssist(program, { noun: samples[ni]!, verb: samples[vi]! });
      const absError = output >= target ? output - target : target - output;
      if (absError > maxError) maxError = absError;
      const logError = computeLogError(absError);
      if (logError > maxLog) maxLog = logError;
      errors[ni * size + vi] = logError;
    }
  }
  normalizeErrors(errors, maxLog);
  return new SearchHeatmap(samples, samples, errors, maxError);
}
