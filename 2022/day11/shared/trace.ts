import { type TraceOptions, sampleTraceIndices, validateMaxSteps } from '../../../shared/core';
import { type KeepAwaySetup } from './setup';
import {
  type KeepAwayRule,
  computeMonkeyBusiness,
  findTopTwoIndices,
  validateRuleRounds,
} from './simulation';

export const DEFAULT_MAX_TRACE_STEPS = 200;

function validateFrameBounds(round: number, totalRounds: number): void {
  if (!Number.isSafeInteger(round) || round < 0) {
    throw new RangeError(`Frame round must be a non-negative safe integer, got ${round}`);
  }
  if (!Number.isSafeInteger(totalRounds) || totalRounds < round) {
    throw new RangeError(`Frame totalRounds (${totalRounds}) must be a safe integer >= ${round}`);
  }
}

function validateFrameDimensions(
  counts: readonly number[],
  queues: readonly (readonly bigint[])[],
  throwMatrix: readonly (readonly number[])[],
): void {
  const n = counts.length;
  if (n < 2) throw new RangeError(`Trace frame requires >= 2 monkeys, got ${n}`);
  if (queues.length !== n) {
    throw new RangeError(`Queue count (${queues.length}) must match monkey count (${n})`);
  }
  if (throwMatrix.length !== n) {
    throw new RangeError(`Throw matrix rows (${throwMatrix.length}) must match monkey count (${n})`);
  }
  for (let i = 0; i < n; i += 1) {
    if (throwMatrix[i]!.length !== n) {
      throw new RangeError(`Throw matrix row ${i} length (${throwMatrix[i]!.length}) must equal ${n}`);
    }
  }
}

/** Immutable snapshot of Keep Away counts, item queues, and cumulative throw edges after a round. */
export class KeepAwayTraceFrame {
  readonly round: number;
  readonly totalRounds: number;
  readonly counts: readonly number[];
  readonly queues: readonly (readonly bigint[])[];
  readonly throwMatrix: readonly (readonly number[])[];

  constructor(
    round: number,
    totalRounds: number,
    counts: readonly number[],
    queues: readonly (readonly bigint[])[],
    throwMatrix: readonly (readonly number[])[],
  ) {
    validateFrameBounds(round, totalRounds);
    validateFrameDimensions(counts, queues, throwMatrix);
    this.round = round;
    this.totalRounds = totalRounds;
    this.counts = Object.freeze([...counts]);
    this.queues = Object.freeze(queues.map((q) => Object.freeze([...q])));
    this.throwMatrix = Object.freeze(throwMatrix.map((row) => Object.freeze([...row])));
    Object.freeze(this);
  }

  get monkeyCount(): number {
    return this.counts.length;
  }

  get totalItems(): number {
    return this.queues.reduce((sum, q) => sum + q.length, 0);
  }

  get totalInspections(): number {
    return this.counts.reduce((sum, c) => sum + c, 0);
  }

  get monkeyBusiness(): bigint {
    return computeMonkeyBusiness(this.counts);
  }

  get topTwoIndices(): readonly [number, number] {
    return findTopTwoIndices(this.counts);
  }

  get isComplete(): boolean {
    return this.round === this.totalRounds;
  }
}

function stepOneRound(
  setup: KeepAwaySetup,
  rule: KeepAwayRule,
  commonModulus: bigint,
  counts: number[],
  queues: bigint[][],
  throwMatrix: number[][],
): void {
  const monkeys = setup.monkeys;
  for (let m = 0; m < monkeys.length; m += 1) {
    const monkey = monkeys[m]!;
    // O(1) FIFO swap avoids shift() overhead and handles empty queues naturally.
    const items = queues[m]!;
    queues[m] = [];
    for (let i = 0; i < items.length; i += 1) {
      counts[m]! += 1;
      const worry = rule.relieve(monkey.operation.apply(items[i]!), commonModulus);
      const target = worry % monkey.divisor === 0n ? monkey.trueTarget : monkey.falseTarget;
      throwMatrix[m]![target]! += 1;
      queues[target]!.push(worry);
    }
  }
}

/** Simulates Keep Away round-by-round and records up to `maxSteps` uniformly sampled frames. */
export function buildKeepAwayTrace(
  setup: KeepAwaySetup,
  rule: KeepAwayRule,
  options?: TraceOptions,
): readonly KeepAwayTraceFrame[] {
  const totalRounds = validateRuleRounds(rule.rounds);
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sampleSet = new Set(sampleTraceIndices(totalRounds + 1, limit));
  const n = setup.monkeyCount;
  const commonModulus = setup.commonModulus;
  const counts = new Array<number>(n).fill(0);
  const queues = setup.monkeys.map((m) => [...m.startingItems]);
  const throwMatrix = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  const frames: KeepAwayTraceFrame[] = [];

  if (sampleSet.has(0)) {
    frames.push(new KeepAwayTraceFrame(0, totalRounds, counts, queues, throwMatrix));
  }
  for (let round = 1; round <= totalRounds; round += 1) {
    stepOneRound(setup, rule, commonModulus, counts, queues, throwMatrix);
    if (sampleSet.has(round)) {
      frames.push(new KeepAwayTraceFrame(round, totalRounds, counts, queues, throwMatrix));
    }
  }
  return Object.freeze(frames);
}
