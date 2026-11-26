import { ceilDiv } from '../../../shared/core';
import { findOptimalAlignment } from './alignment';
import type { CrabFleet } from './fleet';
import type { FuelCostModel } from './fuelModel';

export const DEFAULT_HISTOGRAM_BINS = 32;
export const DEFAULT_LANDSCAPE_SAMPLES = 65;

export interface SwarmBin {
  readonly index: number;
  readonly start: bigint;
  readonly end: bigint;
  readonly count: number;
  readonly ratio: number;
}

export interface SwarmHistogram {
  readonly minPosition: bigint;
  readonly maxPosition: bigint;
  readonly maxCount: number;
  readonly totalCrabs: number;
  readonly bins: readonly SwarmBin[];
}

export interface LandscapePoint {
  readonly position: bigint;
  readonly fuel: bigint;
  readonly xRatio: number;
  readonly yRatio: number;
  readonly isOptimal: boolean;
}

export interface FuelLandscape {
  readonly minPosition: bigint;
  readonly maxPosition: bigint;
  readonly optimalTarget: bigint;
  readonly minFuel: bigint;
  readonly maxFuel: bigint;
  readonly points: readonly LandscapePoint[];
}

const COMPACT_TIERS: readonly (readonly [number, string])[] = [[15, 'Q'], [12, 'T'], [9, 'B'], [6, 'M']];

/** Maps `value` in `[min, max]` to `[0, 1]` using scaled BigInt arithmetic. */
export function scaleBigIntRange(value: bigint, min: bigint, max: bigint): number {
  if (min > max) throw new RangeError(`min (${min}) must not exceed max (${max})`);
  if (value < min || value > max) throw new RangeError(`value (${value}) outside [${min}, ${max}]`);
  if (min === max) return 0;
  return Number(((value - min) * 1_000_000n) / (max - min)) / 1_000_000;
}

/** Formats an arbitrary signed `bigint` with ASCII comma thousands separators. */
export function formatSignedGroupedBigInt(value: bigint): string {
  const sign = value < 0n ? '-' : '';
  return sign + (value < 0n ? -value : value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatTieredDigits(digits: string, pow: number, suffix: string): string {
  const lead = digits.length - pow;
  const frac = digits.slice(lead, lead + 2).replace(/0+$/, '');
  const whole = digits.slice(0, lead);
  return frac.length > 0 ? `${whole}.${frac}${suffix}` : `${whole}${suffix}`;
}

/** Formats an arbitrary signed `bigint` using compact K/M/B/T/Q or scientific notation. */
export function formatSignedCompactBigInt(value: bigint): string {
  const sign = value < 0n ? '-' : '';
  const digits = (value < 0n ? -value : value).toString();
  if (digits.length < 4) return sign + digits;
  if (digits.length >= 19) return `${sign}${digits[0]}.${digits.slice(1, 3)}e${digits.length - 1}`;
  for (const [pow, suffix] of COMPACT_TIERS) {
    if (digits.length > pow) return sign + formatTieredDigits(digits, pow, suffix);
  }
  return sign + formatTieredDigits(digits, 3, 'K');
}

function tallyHistogramBins(fleet: CrabFleet, effectiveBins: number): { counts: Int32Array; maxCount: number } {
  const min = fleet.minPosition;
  const spanCount = fleet.span + 1n;
  const B = BigInt(effectiveBins);
  const counts = new Int32Array(effectiveBins);
  let maxCount = 0;
  for (const pos of fleet.positions) {
    const idx = Number(((pos - min) * B) / spanCount);
    const next = counts[idx]! + 1;
    counts[idx] = next;
    if (next > maxCount) maxCount = next;
  }
  return { counts, maxCount };
}

/** Aggregates crab positions into contiguous equal-width coordinate bins. */
export function buildSwarmHistogram(fleet: CrabFleet, binCount: number): SwarmHistogram {
  if (!Number.isInteger(binCount) || binCount < 1) {
    throw new RangeError(`binCount must be a positive integer, got ${binCount}`);
  }
  const min = fleet.minPosition;
  const spanCount = fleet.span + 1n;
  const effectiveBins = Number(spanCount < BigInt(binCount) ? spanCount : BigInt(binCount));
  const B = BigInt(effectiveBins);
  const { counts, maxCount } = tallyHistogramBins(fleet, effectiveBins);
  const bins = Array.from({ length: effectiveBins }, (_, i) => {
    const count = counts[i]!;
    const start = min + ceilDiv(BigInt(i) * spanCount, B);
    const end = min + ceilDiv(BigInt(i + 1) * spanCount, B) - 1n;
    return Object.freeze({ index: i, start, end, count, ratio: count / maxCount });
  });
  return Object.freeze({
    minPosition: min, maxPosition: fleet.maxPosition, maxCount, totalCrabs: fleet.size, bins: Object.freeze(bins),
  });
}

function sampleLandscapePositions(fleet: CrabFleet, sampleCount: number, optimalTarget: bigint): bigint[] {
  const min = fleet.minPosition;
  const span = fleet.span;
  if (span + 1n <= BigInt(sampleCount)) {
    return Array.from({ length: Number(span + 1n) }, (_, i) => min + BigInt(i));
  }
  const denom = BigInt(sampleCount - 1);
  const positions = Array.from({ length: sampleCount }, (_, i) => min + (BigInt(i) * span) / denom);
  if (!positions.includes(optimalTarget)) {
    positions.splice(positions.findIndex((p) => p > optimalTarget), 0, optimalTarget);
  }
  return positions;
}

/** Samples the convex total-fuel curve over `[minPosition, maxPosition]` including the exact optimum. */
export function buildFuelLandscape(fleet: CrabFleet, model: FuelCostModel, sampleCount: number): FuelLandscape {
  if (!Number.isInteger(sampleCount) || sampleCount < 2) {
    throw new RangeError(`sampleCount must be an integer >= 2, got ${sampleCount}`);
  }
  const optimal = findOptimalAlignment(fleet, model);
  const evaluated = sampleLandscapePositions(fleet, sampleCount, optimal.target)
    .map((position) => ({ position, fuel: fleet.fuelAt(position, model) }));
  let maxFuel = optimal.fuel;
  for (const entry of evaluated) if (entry.fuel > maxFuel) maxFuel = entry.fuel;
  const min = fleet.minPosition;
  const max = fleet.maxPosition;
  const points = evaluated.map((e) => Object.freeze({
    position: e.position, fuel: e.fuel, isOptimal: e.position === optimal.target,
    xRatio: scaleBigIntRange(e.position, min, max), yRatio: scaleBigIntRange(e.fuel, optimal.fuel, maxFuel),
  }));
  return Object.freeze({
    minPosition: min, maxPosition: max, optimalTarget: optimal.target,
    minFuel: optimal.fuel, maxFuel, points: Object.freeze(points),
  });
}
