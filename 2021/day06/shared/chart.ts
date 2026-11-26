import { bigintLog2 } from '../../../shared/core';
import { LanternfishSchool, TIMER_BUCKETS, type TimerBucket } from './school';
import type { LanternfishTraceFrame } from './simulation';

export type GrowthScaleMode = 'linear' | 'log';
export type CohortRole = 'spawning' | 'mature' | 'reset' | 'juvenile' | 'newborn';

export const TIMER_ROLES: readonly [
  CohortRole, CohortRole, CohortRole, CohortRole, CohortRole, CohortRole, CohortRole, CohortRole, CohortRole,
] = Object.freeze([
  'spawning', 'mature', 'mature', 'mature', 'mature', 'mature', 'reset', 'juvenile', 'newborn',
] as const);

export interface CohortBar {
  readonly timer: TimerBucket;
  readonly count: bigint;
  readonly ratio: number;
  readonly compactLabel: string;
  readonly role: CohortRole;
}

export interface GrowthCurvePoint {
  readonly frameIndex: number;
  readonly day: number;
  readonly totalPopulation: bigint;
  readonly ratio: number;
  readonly compactLabel: string;
}

export interface GrowthCurve {
  readonly scaleMode: GrowthScaleMode;
  readonly maxPopulation: bigint;
  readonly points: readonly GrowthCurvePoint[];
}

const COMPACT_TIERS: readonly (readonly [number, string])[] = [
  [15, 'Q'],
  [12, 'T'],
  [9, 'B'],
  [6, 'M'],
];

function requireNonNegativeBigInt(value: bigint, label: string): void {
  if (value < 0n) {
    throw new RangeError(`${label} must be non-negative, got ${value}`);
  }
}

/** Computes exact BigInt ratio in `[0, 1]` without floating-point overflow past `2^1024`. */
export function scaleBigIntRatio(value: bigint, maxValue: bigint): number {
  requireNonNegativeBigInt(value, 'value');
  requireNonNegativeBigInt(maxValue, 'maxValue');
  if (value > maxValue) {
    throw new RangeError(`value (${value}) must not exceed maxValue (${maxValue})`);
  }
  if (maxValue === 0n) return 0;
  return Number((value * 1_000_000n) / maxValue) / 1_000_000;
}

/** Formats a non-negative `bigint` with ASCII comma thousands separators. */
export function formatGroupedBigInt(value: bigint): string {
  requireNonNegativeBigInt(value, 'value');
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatTieredDigits(digits: string, pow: number, suffix: string): string {
  const lead = digits.length - pow;
  const frac = digits.slice(lead, lead + 2).replace(/0+$/, '');
  const whole = digits.slice(0, lead);
  return frac.length > 0 ? `${whole}.${frac}${suffix}` : `${whole}${suffix}`;
}

/** Formats a non-negative `bigint` using compact K/M/B/T/Q or scientific notation. */
export function formatCompactBigInt(value: bigint): string {
  requireNonNegativeBigInt(value, 'value');
  const digits = value.toString();
  if (digits.length < 4) return digits;
  if (digits.length >= 19) return `${digits[0]}.${digits.slice(1, 3)}e${digits.length - 1}`;
  for (const [pow, suffix] of COMPACT_TIERS) {
    if (digits.length > pow) return formatTieredDigits(digits, pow, suffix);
  }
  return formatTieredDigits(digits, 3, 'K');
}

/** Builds the 9 cohort histogram bars for a single `LanternfishSchool` snapshot. */
export function buildCohortBars(school: LanternfishSchool): readonly CohortBar[] {
  const maxCount = school.maxCohortCount;
  const bars = TIMER_BUCKETS.map((timer) => {
    const count = school.countAt(timer);
    return Object.freeze({
      timer,
      count,
      ratio: scaleBigIntRatio(count, maxCount),
      compactLabel: formatCompactBigInt(count),
      role: TIMER_ROLES[timer],
    });
  });
  return Object.freeze(bars);
}

function computePointRatio(
  population: bigint,
  maxPopulation: bigint,
  maxLog: number,
  scaleMode: GrowthScaleMode,
): number {
  if (scaleMode === 'linear') {
    return scaleBigIntRatio(population, maxPopulation);
  }
  return maxLog === 0 ? 0 : bigintLog2(population + 1n) / maxLog;
}

/** Builds normalized trajectory curve points across frames in linear or Log2 mode. */
export function buildGrowthCurve(
  frames: readonly LanternfishTraceFrame[],
  scaleMode: GrowthScaleMode,
): GrowthCurve {
  if (frames.length === 0) {
    throw new RangeError('frames must not be empty');
  }
  let maxPopulation = 0n;
  for (const frame of frames) {
    if (frame.totalPopulation > maxPopulation) maxPopulation = frame.totalPopulation;
  }
  const maxLog = bigintLog2(maxPopulation + 1n);
  const points = frames.map((frame, frameIndex) =>
    Object.freeze({
      frameIndex,
      day: frame.day,
      totalPopulation: frame.totalPopulation,
      ratio: computePointRatio(frame.totalPopulation, maxPopulation, maxLog, scaleMode),
      compactLabel: formatCompactBigInt(frame.totalPopulation),
    }),
  );
  return Object.freeze({ scaleMode, maxPopulation, points: Object.freeze(points) });
}
