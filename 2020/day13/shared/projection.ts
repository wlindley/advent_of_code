import { bigintLog2 } from '../../../shared/core';
import type { BusEntry, BusSchedule } from './model';
import type { CrtLockFrame, EarliestBusFrame } from './policies';

export const RATIO_SCALE = 1_000_000n;

/** Projected bar datum for one shuttle bus in the Part 1 wait-time chart. */
export interface Part1BarDatum {
  readonly bus: BusEntry;
  readonly wait: bigint;
  readonly departure: bigint;
  readonly ratio: number;
  readonly isEvaluated: boolean;
  readonly isCurrent: boolean;
  readonly isBest: boolean;
}

/** Projected row datum for one CRT lock frame in the Part 2 alignment chart. */
export interface Part2RowDatum {
  readonly step: number;
  readonly bus: BusEntry;
  readonly timestamp: bigint;
  readonly modulus: bigint;
  readonly previousModulus: bigint;
  readonly modulusBits: number;
  readonly logRatio: number;
  readonly lockedCount: number;
}

/** Computes the maximum wait across all active buses in `schedule`. */
export function computeMaxWait(schedule: BusSchedule): bigint {
  let maxWait = 0n;
  for (const bus of schedule.buses) {
    const wait = bus.waitFrom(schedule.earliestTimestamp);
    if (wait > maxWait) maxWait = wait;
  }
  return maxWait;
}

/** Computes a BigInt-safe normalized wait ratio in `[0, 1]`. */
export function computeWaitBarRatio(wait: bigint, maxWait: bigint): number {
  if (wait < 0n || maxWait < 0n || wait > maxWait) {
    throw new RangeError(`Invalid wait ratio inputs: wait=${wait}, maxWait=${maxWait}`);
  }
  if (maxWait === 0n) return 0;
  return Number((wait * RATIO_SCALE) / maxWait) / Number(RATIO_SCALE);
}

/** Computes a BigInt-safe logarithmic modulus progress ratio in `[0, 1]`. */
export function computeModulusLogRatio(modulus: bigint, finalModulus: bigint): number {
  if (modulus <= 0n || finalModulus <= 0n || modulus > finalModulus) {
    throw new RangeError(`Invalid modulus log ratio inputs: modulus=${modulus}, finalModulus=${finalModulus}`);
  }
  if (finalModulus === 1n) return 1;
  return bigintLog2(modulus) / bigintLog2(finalModulus);
}

/** Projects a Part 1 `EarliestBusFrame` into normalized bar data for all active buses. */
export function computePart1Bars(frame: EarliestBusFrame): readonly Part1BarDatum[] {
  const { schedule, evaluatedCount, currentBus, bestBus } = frame;
  const maxWait = computeMaxWait(schedule);
  return Object.freeze(
    schedule.buses.map((bus, index) => {
      const wait = bus.waitFrom(schedule.earliestTimestamp);
      return Object.freeze({
        bus,
        wait,
        departure: schedule.earliestTimestamp + wait,
        ratio: computeWaitBarRatio(wait, maxWait),
        isEvaluated: index < evaluatedCount,
        isCurrent: bus === currentBus,
        isBest: bus === bestBus,
      });
    }),
  );
}

/** Projects Part 2 `CrtLockFrame` snapshots into log-scaled row data. */
export function computePart2Rows(frames: readonly CrtLockFrame[]): readonly Part2RowDatum[] {
  if (frames.length === 0) return Object.freeze([]);
  const finalModulus = frames[frames.length - 1]!.modulus;
  return Object.freeze(
    frames.map((frame) =>
      Object.freeze({
        step: frame.step,
        bus: frame.currentBus,
        timestamp: frame.timestamp,
        modulus: frame.modulus,
        previousModulus: frame.previousModulus,
        modulusBits: frame.modulusBits,
        logRatio: computeModulusLogRatio(frame.modulus, finalModulus),
        lockedCount: frame.lockedCount,
      }),
    ),
  );
}
