import {
  type ClosedInterval,
  type TraceOptions,
  sampleTraceIndices,
  validateMaxSteps,
} from '../../../shared/core';
import { BoatRace, RaceSheet } from './race';

export const DEFAULT_MAX_TRACE_STEPS = 200;
export const DEFAULT_PARABOLA_SEGMENTS = 64;

/** Normalized sample point along a race's quadratic distance-vs-hold-time curve. */
export interface ParabolaSample {
  readonly holdTime: bigint;
  readonly distance: bigint;
  readonly xRatio: number;
  readonly yRatio: number;
  readonly isWinner: boolean;
}

/** Exact integer-scaled ratio in `[0, 1]` safe for arbitrarily large `bigint`s. */
export function ratioBigInt(num: bigint, den: bigint): number {
  if (den < 0n) {
    throw new RangeError(`Denominator must be non-negative, got ${den}`);
  }
  if (den === 0n || num <= 0n) return 0;
  if (num >= den) return 1;
  return Number((num * 10000n) / den) / 10000;
}

function collectHoldSamples(race: BoatRace, maxSegments: number): readonly bigint[] {
  const holds = new Set<bigint>();
  if (race.time <= BigInt(maxSegments)) {
    for (let h = 0n; h <= race.time; h += 1n) holds.add(h);
  } else {
    const segs = BigInt(maxSegments);
    for (let i = 0n; i <= segs; i += 1n) holds.add((race.time * i) / segs);
    holds.add(race.peakHold);
    const range = race.winningRange;
    if (range !== undefined) {
      holds.add(range.start);
      holds.add(range.end);
    }
  }
  // Elements come from a Set, so every pair compared is strictly distinct (never equal).
  return Array.from(holds).sort((a, b) => (a < b ? -1 : 1));
}

/** Samples a race's parabolic curve up to `maxSegments`, preserving peak and winning bounds. */
export function sampleRaceParabola(
  race: BoatRace,
  maxSegments = DEFAULT_PARABOLA_SEGMENTS,
): readonly ParabolaSample[] {
  if (!Number.isInteger(maxSegments) || maxSegments < 1) {
    throw new RangeError(`maxSegments must be a positive integer, got ${maxSegments}`);
  }
  const yMax = race.maxDistance > race.recordDistance ? race.maxDistance : race.recordDistance;
  const holds = collectHoldSamples(race, maxSegments);
  const samples: ParabolaSample[] = [];
  for (const holdTime of holds) {
    const distance = race.distanceForHold(holdTime);
    samples.push(
      Object.freeze({
        holdTime,
        distance,
        xRatio: ratioBigInt(holdTime, race.time),
        yRatio: ratioBigInt(distance, yMax),
        isWinner: distance > race.recordDistance,
      }),
    );
  }
  return Object.freeze(samples);
}

/** Immutable trace snapshot for one race and the running product through that race. */
export class RaceTraceFrame {
  readonly raceIndex: number;
  readonly totalRaces: number;
  readonly race: BoatRace;
  readonly runningProduct: bigint;

  constructor(raceIndex: number, totalRaces: number, race: BoatRace, runningProduct: bigint) {
    if (!Number.isInteger(totalRaces) || totalRaces < 1) {
      throw new RangeError(`totalRaces must be a positive integer, got ${totalRaces}`);
    }
    if (!Number.isInteger(raceIndex) || raceIndex < 0 || raceIndex >= totalRaces) {
      throw new RangeError(`raceIndex ${raceIndex} out of bounds for ${totalRaces} races`);
    }
    if (runningProduct < 0n) {
      throw new RangeError(`runningProduct must be non-negative, got ${runningProduct}`);
    }
    this.raceIndex = raceIndex;
    this.totalRaces = totalRaces;
    this.race = race;
    this.runningProduct = runningProduct;
    Object.freeze(this);
  }

  get waysToWin(): bigint {
    return this.race.waysToWin;
  }

  get winningRange(): ClosedInterval | undefined {
    return this.race.winningRange;
  }

  get hasWinners(): boolean {
    return this.race.waysToWin > 0n;
  }
}

/** Produces bounded trace frames for a `RaceSheet` while maintaining exact running products. */
export function traceRaceSheet(
  sheet: RaceSheet,
  options?: TraceOptions,
): readonly RaceTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const total = sheet.races.length;
  const indices = sampleTraceIndices(total, limit);
  const frames: RaceTraceFrame[] = [];
  let running = 1n;
  let samplePtr = 0;

  for (let i = 0; i < total; i += 1) {
    const race = sheet.races[i]!;
    running *= race.waysToWin;
    if (i === indices[samplePtr]) {
      frames.push(new RaceTraceFrame(i, total, race, running));
      samplePtr += 1;
    }
  }
  return Object.freeze(frames);
}
