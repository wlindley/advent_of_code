import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import { IdRange, RepeatedPatternBand, parseIdRanges } from '../../shared';

export const DEFAULT_MAX_TRACE_STEPS = 250;
export const DEFAULT_MAX_BAND_SAMPLES = 6;

export interface BandSample {
  readonly band: RepeatedPatternBand;
  readonly samplePatterns: readonly bigint[];
}

export interface RangeScanFrame {
  readonly step: number;
  readonly range: IdRange | null;
  readonly checkedHalfLengths: readonly number[];
  readonly bands: readonly BandSample[];
  readonly rangeMatchCount: bigint;
  readonly rangeSum: bigint;
  readonly cumulativeMatchCount: bigint;
  readonly cumulativeSum: bigint;
}

function collectDoubledBands(range: IdRange) {
  const checkedHalfLengths: number[] = [];
  const bands: RepeatedPatternBand[] = [];
  const minHalf = Math.ceil(range.minDigits / 2);
  const maxHalf = Math.floor(range.maxDigits / 2);
  for (let k = minHalf; k <= maxHalf; k += 1) {
    checkedHalfLengths.push(k);
    const band = range.repeatedPatternBand(k, 2);
    if (band) bands.push(band);
  }
  return { checkedHalfLengths, bands };
}

export const solver: PuzzleSolver<readonly IdRange[], bigint, RangeScanFrame> = {
  parse: parseIdRanges,

  solve(ranges: readonly IdRange[]): bigint {
    let total = 0n;
    for (const range of ranges) {
      for (const band of collectDoubledBands(range).bands) total += band.sum;
    }
    return total;
  },

  trace(ranges: readonly IdRange[], options?: TraceOptions): readonly RangeScanFrame[] {
    const maxSteps = options?.maxSteps ?? DEFAULT_MAX_TRACE_STEPS;
    if (!Number.isInteger(maxSteps) || maxSteps < 1) {
      throw new RangeError(`maxSteps must be a positive integer, got ${maxSteps}`);
    }
    const stride =
      maxSteps === 1
        ? Number.POSITIVE_INFINITY
        : ranges.length + 1 <= maxSteps
          ? 1
          : Math.ceil(ranges.length / (maxSteps - 1));

    const frames: RangeScanFrame[] = [];
    let cumulativeMatchCount = 0n;
    let cumulativeSum = 0n;
    let lastFrame: RangeScanFrame = {
      step: 0, range: null, checkedHalfLengths: [], bands: [],
      rangeMatchCount: 0n, rangeSum: 0n, cumulativeMatchCount, cumulativeSum,
    };
    if (maxSteps > 1) frames.push(lastFrame);

    for (const [index, range] of ranges.entries()) {
      const { checkedHalfLengths, bands: rawBands } = collectDoubledBands(range);
      let rangeMatchCount = 0n;
      let rangeSum = 0n;
      const bands: BandSample[] = rawBands.map((band) => {
        rangeMatchCount += band.count;
        rangeSum += band.sum;
        return { band, samplePatterns: band.samplePatterns(DEFAULT_MAX_BAND_SAMPLES) };
      });
      cumulativeMatchCount += rangeMatchCount;
      cumulativeSum += rangeSum;
      const step = index + 1;
      lastFrame = {
        step, range, checkedHalfLengths, bands,
        rangeMatchCount, rangeSum, cumulativeMatchCount, cumulativeSum,
      };
      if (step % stride === 0) frames.push(lastFrame);
    }

    // Always retain the exact final state even when range count is not divisible by stride.
    if (frames.at(-1) !== lastFrame) frames.push(lastFrame);
    return frames;
  },
};
