import { bigintLog2 } from '../../../shared/core';
import type { PairReaction, PolymerState } from './polymer';
import type { PolymerTraceFrame } from './simulation';

export type FrequencyScaleMode = 'linear' | 'log';
export type ElementRole = 'most' | 'least' | 'middle';

export const DEFAULT_TOP_REACTIONS = 8;

export interface ElementBarItem {
  readonly element: string;
  readonly count: bigint;
  readonly ratio: number;
  readonly sharePercent: number;
  readonly role: ElementRole;
}

export interface ReactionBarItem {
  readonly pair: string;
  readonly insert: string;
  readonly count: bigint;
  readonly ratio: number;
}

export interface GrowthCurvePoint {
  readonly step: number;
  readonly totalLength: bigint;
  readonly spread: bigint;
  readonly lengthRatio: number;
  readonly spreadRatio: number;
}

const COMPACT_TIERS: ReadonlyArray<readonly [bigint, string]> = [
  [1_000_000_000_000n, 'T'],
  [1_000_000_000n, 'B'],
  [1_000_000n, 'M'],
  [1_000n, 'k'],
];

/** Exact non-negative ratio in `[0, 1]` without `Number(bigint)` overflow past `2^1024`. */
export function scaleBigIntRatio(value: bigint, maxValue: bigint): number {
  if (value < 0n || maxValue < 0n) {
    throw new RangeError('scaleBigIntRatio requires non-negative BigInts');
  }
  if (maxValue === 0n || value === 0n) return 0;
  if (value >= maxValue) return 1;
  return Number((value * 10_000n) / maxValue) / 10_000;
}

/** Formats a BigInt with ASCII thousands separators. */
export function formatGroupedBigInt(value: bigint): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Formats a BigInt compactly with metric suffixes or scientific notation past `10^15`. */
export function formatCompactBigInt(value: bigint): string {
  if (value < 0n) {
    return `-${formatCompactBigInt(-value)}`;
  }
  const digits = value.toString();
  if (digits.length > 15) {
    return `${digits.slice(0, 1)}.${digits.slice(1, 3)}e${digits.length - 1}`;
  }
  for (const [threshold, suffix] of COMPACT_TIERS) {
    if (value >= threshold) {
      const tenths = (value * 10n) / threshold;
      const whole = tenths / 10n;
      const frac = tenths % 10n;
      return frac === 0n ? `${whole}${suffix}` : `${whole}.${frac}${suffix}`;
    }
  }
  return digits;
}

/** Scales a BigInt value into `[0, 1]` under linear or `log2(count + 1)` mode. */
export function scaleValue(
  value: bigint,
  maxValue: bigint,
  maxLog: number,
  scaleMode: FrequencyScaleMode,
): number {
  if (scaleMode === 'linear') {
    return scaleBigIntRatio(value, maxValue);
  }
  if (maxLog === 0) return 0;
  return bigintLog2(value + 1n) / maxLog;
}

function resolveElementRole(count: bigint, maxCount: bigint, minCount: bigint): ElementRole {
  if (count === maxCount) return 'most';
  if (count === minCount) return 'least';
  return 'middle';
}

/** Builds normalized element-frequency bars sorted descending by count. */
export function buildElementBars(
  state: PolymerState,
  scaleMode: FrequencyScaleMode,
): readonly ElementBarItem[] {
  const freqs = state.elementFrequencies;
  const maxCount = freqs[0]!.count;
  const minCount = freqs[freqs.length - 1]!.count;
  const total = state.totalLength;
  const maxLog = bigintLog2(maxCount + 1n);

  return Object.freeze(
    freqs.map((entry) =>
      Object.freeze({
        element: entry.element,
        count: entry.count,
        ratio: scaleValue(entry.count, maxCount, maxLog, scaleMode),
        sharePercent: scaleBigIntRatio(entry.count, total) * 100,
        role: resolveElementRole(entry.count, maxCount, minCount),
      }),
    ),
  );
}

/** Builds the top `limit` active pair reactions scaled to the busiest pair. */
export function buildTopReactions(
  reactions: readonly PairReaction[],
  limit: number,
): readonly ReactionBarItem[] {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError(`limit must be a positive integer, got ${limit}`);
  }
  const slice = reactions.slice(0, limit);
  const first = slice[0];
  if (first === undefined) return Object.freeze([]);
  const maxCount = first.count;

  return Object.freeze(
    slice.map((reaction) =>
      Object.freeze({
        pair: reaction.pair,
        insert: reaction.insert,
        count: reaction.count,
        ratio: scaleBigIntRatio(reaction.count, maxCount),
      }),
    ),
  );
}

/** Builds normalized length and spread trajectories across trace frames. */
export function buildGrowthCurve(
  frames: readonly PolymerTraceFrame[],
  scaleMode: FrequencyScaleMode,
): readonly GrowthCurvePoint[] {
  const first = frames[0];
  if (first === undefined) return Object.freeze([]);

  let maxLength = first.totalLength;
  let maxSpread = first.spread;
  for (const frame of frames) {
    if (frame.totalLength > maxLength) maxLength = frame.totalLength;
    if (frame.spread > maxSpread) maxSpread = frame.spread;
  }

  const maxLengthLog = bigintLog2(maxLength + 1n);
  const maxSpreadLog = bigintLog2(maxSpread + 1n);
  return Object.freeze(
    frames.map((frame) =>
      Object.freeze({
        step: frame.step,
        totalLength: frame.totalLength,
        spread: frame.spread,
        lengthRatio: scaleValue(frame.totalLength, maxLength, maxLengthLog, scaleMode),
        spreadRatio: scaleValue(frame.spread, maxSpread, maxSpreadLog, scaleMode),
      }),
    ),
  );
}
