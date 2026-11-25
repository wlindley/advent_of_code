import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import { IdRange, RepeatedPatternBand, parseIdRanges } from '../../shared';

export const DEFAULT_MAX_TRACE_STEPS = 250;
export const DEFAULT_MAX_BAND_SAMPLES = 6;
export type InclusionSign = 1n | -1n;

export interface RepeatTerm { readonly patternLength: number; readonly repeats: number; readonly sign: InclusionSign; }
export interface SignedBandSample { readonly band: RepeatedPatternBand; readonly sign: InclusionSign; readonly samplePatterns: readonly bigint[]; }
export interface RangeInclusionFrame {
  readonly step: number;
  readonly range: IdRange | null;
  readonly checkedDigitLengths: readonly number[];
  readonly bands: readonly SignedBandSample[];
  readonly rangeMatchCount: bigint;
  readonly rangeSum: bigint;
  readonly cumulativeMatchCount: bigint;
  readonly cumulativeSum: bigint;
}

/** Signed squarefree Möbius repeat terms for L-digit periodic numbers (period < L). */
export function squarefreeRepeatTerms(digitLength: number): readonly RepeatTerm[] {
  if (!Number.isSafeInteger(digitLength) || digitLength < 1) {
    throw new RangeError(`digitLength must be a positive safe integer, got ${digitLength}`);
  }
  if (digitLength === 1) return [];

  const terms: RepeatTerm[] = [];
  const addPrime = (p: number): void => {
    const prior = terms.length;
    terms.push({ patternLength: digitLength / p, repeats: p, sign: 1n });
    for (let i = 0; i < prior; i += 1) {
      const t = terms[i]!;
      terms.push({ patternLength: t.patternLength / p, repeats: t.repeats * p, sign: t.sign === 1n ? -1n : 1n });
    }
  };

  let rem = digitLength;
  for (let d = 2; d * d <= rem; d += 1) {
    if (rem % d !== 0) continue;
    while (rem % d === 0) rem /= d;
    addPrime(d);
  }
  if (rem > 1) addPrime(rem);
  return terms.sort((a, b) => a.repeats - b.repeats);
}

function collectInclusionBands(range: IdRange) {
  const checkedDigitLengths: number[] = [];
  const rawBands: { band: RepeatedPatternBand; sign: InclusionSign }[] = [];
  for (let len = Math.max(2, range.minDigits); len <= range.maxDigits; len += 1) {
    checkedDigitLengths.push(len);
    for (const term of squarefreeRepeatTerms(len)) {
      const band = range.repeatedPatternBand(term.patternLength, term.repeats);
      if (band) rawBands.push({ band, sign: term.sign });
    }
  }
  return { checkedDigitLengths, rawBands };
}

export const solver: PuzzleSolver<readonly IdRange[], bigint, RangeInclusionFrame> = {
  parse: parseIdRanges,
  solve(ranges: readonly IdRange[]): bigint {
    let total = 0n;
    for (const range of ranges) {
      for (const { band, sign } of collectInclusionBands(range).rawBands) total += sign * band.sum;
    }
    return total;
  },
  trace(ranges: readonly IdRange[], options?: TraceOptions): readonly RangeInclusionFrame[] {
    const maxSteps = options?.maxSteps ?? DEFAULT_MAX_TRACE_STEPS;
    if (!Number.isInteger(maxSteps) || maxSteps < 1) throw new RangeError(`maxSteps must be a positive integer, got ${maxSteps}`);
    const stride = maxSteps === 1 ? Infinity : ranges.length + 1 <= maxSteps ? 1 : Math.ceil(ranges.length / (maxSteps - 1));
    const frames: RangeInclusionFrame[] = [];
    let cumulativeMatchCount = 0n;
    let cumulativeSum = 0n;
    let lastFrame: RangeInclusionFrame = {
      step: 0, range: null, checkedDigitLengths: [], bands: [],
      rangeMatchCount: 0n, rangeSum: 0n, cumulativeMatchCount, cumulativeSum,
    };
    if (maxSteps > 1) frames.push(lastFrame);
    for (const [index, range] of ranges.entries()) {
      const { checkedDigitLengths, rawBands } = collectInclusionBands(range);
      let rangeMatchCount = 0n;
      let rangeSum = 0n;
      const bands: SignedBandSample[] = rawBands.map(({ band, sign }) => {
        rangeMatchCount += sign * band.count;
        rangeSum += sign * band.sum;
        return { band, sign, samplePatterns: band.samplePatterns(DEFAULT_MAX_BAND_SAMPLES) };
      });
      cumulativeMatchCount += rangeMatchCount;
      cumulativeSum += rangeSum;
      const step = index + 1;
      lastFrame = { step, range, checkedDigitLengths, bands, rangeMatchCount, rangeSum, cumulativeMatchCount, cumulativeSum };
      if (step % stride === 0) frames.push(lastFrame);
    }
    // Preserve exact final totals even when range count is not divisible by stride.
    if (frames.at(-1) !== lastFrame) frames.push(lastFrame);
    return frames;
  },
};
