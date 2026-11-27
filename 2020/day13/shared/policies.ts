import { sampleTraceIndices, solveCongruences, type Congruence } from '../../../shared/core';
import type { BusEntry, BusSchedule } from './model';

export type ShuttlePolicyId = 'earliest-bus' | 'consecutive-alignment';

/** Strategy interface governing how a shuttle schedule is solved and traced. */
export interface ShuttlePolicy<TTrace> {
  readonly id: ShuttlePolicyId;
  readonly label: string;
  solve(schedule: BusSchedule): bigint;
  trace(schedule: BusSchedule, maxSteps: number): readonly TTrace[];
}

function validateStepIndex(stepCount: number, maxCount: number, label: string): void {
  if (!Number.isSafeInteger(stepCount) || stepCount < 1 || stepCount > maxCount) {
    throw new RangeError(`${label} must be an integer in [1, ${maxCount}], got ${stepCount}`);
  }
}

/** Part 1 evaluation snapshot after inspecting `evaluatedCount` buses. */
export class EarliestBusFrame {
  readonly schedule: BusSchedule;
  readonly evaluatedCount: number;
  readonly bestBus: BusEntry;

  constructor(schedule: BusSchedule, evaluatedCount: number, bestBus: BusEntry) {
    validateStepIndex(evaluatedCount, schedule.activeCount, 'evaluatedCount');
    if (!schedule.buses.slice(0, evaluatedCount).includes(bestBus)) {
      throw new RangeError('bestBus must belong to the evaluated bus prefix');
    }
    this.schedule = schedule;
    this.evaluatedCount = evaluatedCount;
    this.bestBus = bestBus;
    Object.freeze(this);
  }

  get step(): number { return this.evaluatedCount; }
  get currentBus(): BusEntry { return this.schedule.buses[this.evaluatedCount - 1]!; }
  get isNewBest(): boolean { return this.currentBus === this.bestBus; }
  get isFinal(): boolean { return this.evaluatedCount === this.schedule.activeCount; }
  get currentWait(): bigint { return this.currentBus.waitFrom(this.schedule.earliestTimestamp); }
  get currentDeparture(): bigint { return this.currentBus.nextDepartureFrom(this.schedule.earliestTimestamp); }
  get bestWait(): bigint { return this.bestBus.waitFrom(this.schedule.earliestTimestamp); }
  get bestDeparture(): bigint { return this.bestBus.nextDepartureFrom(this.schedule.earliestTimestamp); }
  get product(): bigint { return this.bestBus.id * this.bestWait; }
}

/** Part 2 incremental CRT lock snapshot after locking `lockedCount` buses. */
export class CrtLockFrame {
  readonly schedule: BusSchedule;
  readonly lockedCount: number;
  readonly congruence: Congruence;
  readonly previousModulus: bigint;

  constructor(schedule: BusSchedule, lockedCount: number, congruence: Congruence, previousModulus: bigint) {
    validateStepIndex(lockedCount, schedule.activeCount, 'lockedCount');
    const { remainder, modulus } = congruence;
    if (modulus <= 0n || remainder < 0n || remainder >= modulus) {
      throw new RangeError(`Invalid normalized congruence (${remainder} mod ${modulus})`);
    }
    if (previousModulus <= 0n) {
      throw new RangeError(`previousModulus must be positive, got ${previousModulus}`);
    }
    this.schedule = schedule;
    this.lockedCount = lockedCount;
    this.congruence = Object.freeze({ remainder, modulus });
    this.previousModulus = previousModulus;
    Object.freeze(this);
  }

  get step(): number { return this.lockedCount; }
  get currentBus(): BusEntry { return this.schedule.buses[this.lockedCount - 1]!; }
  get lockedBuses(): readonly BusEntry[] { return Object.freeze(this.schedule.buses.slice(0, this.lockedCount)); }
  get isFinal(): boolean { return this.lockedCount === this.schedule.activeCount; }
  get timestamp(): bigint { return this.congruence.remainder; }
  get modulus(): bigint { return this.congruence.modulus; }
  get modulusBits(): number { return this.congruence.modulus.toString(2).length; }
}

function solveEarliestBus(schedule: BusSchedule): bigint {
  let bestBus = schedule.buses[0]!;
  let bestWait = bestBus.waitFrom(schedule.earliestTimestamp);
  for (let i = 1; i < schedule.buses.length; i += 1) {
    const bus = schedule.buses[i]!;
    const wait = bus.waitFrom(schedule.earliestTimestamp);
    if (wait < bestWait) {
      bestBus = bus;
      bestWait = wait;
    }
  }
  return bestBus.id * bestWait;
}

function traceEarliestBus(schedule: BusSchedule, maxSteps: number): readonly EarliestBusFrame[] {
  const indices = sampleTraceIndices(schedule.activeCount, maxSteps);
  const frames: EarliestBusFrame[] = [];
  let bestBus = schedule.buses[0]!;
  let bestWait = bestBus.waitFrom(schedule.earliestTimestamp);
  let cursor = 0;
  for (let i = 0; i < schedule.buses.length; i += 1) {
    const bus = schedule.buses[i]!;
    const wait = bus.waitFrom(schedule.earliestTimestamp);
    if (wait < bestWait) {
      bestBus = bus;
      bestWait = wait;
    }
    if (i === indices[cursor]) {
      frames.push(new EarliestBusFrame(schedule, i + 1, bestBus));
      cursor += 1;
    }
  }
  return Object.freeze(frames);
}

function solveConsecutiveAlignment(schedule: BusSchedule): bigint {
  return solveCongruences(schedule.congruences).remainder;
}

function traceConsecutiveAlignment(schedule: BusSchedule, maxSteps: number): readonly CrtLockFrame[] {
  const indices = sampleTraceIndices(schedule.activeCount, maxSteps);
  const frames: CrtLockFrame[] = [];
  let acc: Congruence = Object.freeze({ remainder: 0n, modulus: 1n });
  let cursor = 0;
  for (let i = 0; i < schedule.buses.length; i += 1) {
    const previousModulus = acc.modulus;
    acc = solveCongruences([acc, schedule.buses[i]!.congruence]);
    if (i === indices[cursor]) {
      frames.push(new CrtLockFrame(schedule, i + 1, acc, previousModulus));
      cursor += 1;
    }
  }
  return Object.freeze(frames);
}

/** Part 1 policy: pick the active bus with the smallest wait after `earliestTimestamp`. */
export const EARLIEST_BUS_POLICY: ShuttlePolicy<EarliestBusFrame> = Object.freeze({
  id: 'earliest-bus',
  label: 'Earliest Bus',
  solve: solveEarliestBus,
  trace: traceEarliestBus,
});

/** Part 2 policy: solve offset departure congruences via generalized CRT. */
export const CONSECUTIVE_ALIGNMENT_POLICY: ShuttlePolicy<CrtLockFrame> = Object.freeze({
  id: 'consecutive-alignment',
  label: 'Consecutive Alignment',
  solve: solveConsecutiveAlignment,
  trace: traceConsecutiveAlignment,
});
