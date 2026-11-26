import {
  sampleTraceIndices,
  validateMaxSteps,
  type PuzzleSolver,
  type TraceOptions,
} from '../../../../shared/core';
import {
  parsePrintQueue,
  type ApplicableRule,
  type PrintQueue,
  type PrintUpdate,
} from '../../shared';

export const DEFAULT_MAX_TRACE_STEPS = 200;

/** Immutable per-update trace snapshot for Part 1 validation. */
export class PrintQueueTraceFrame {
  readonly updateIndex: number;
  readonly totalUpdates: number;
  readonly update: PrintUpdate;
  readonly applicableRules: readonly ApplicableRule[];
  readonly validCountSoFar: number;
  readonly middleSumSoFar: number;

  constructor(
    updateIndex: number,
    totalUpdates: number,
    update: PrintUpdate,
    applicableRules: readonly ApplicableRule[],
    validCountSoFar: number,
    middleSumSoFar: number,
  ) {
    this.updateIndex = updateIndex;
    this.totalUpdates = totalUpdates;
    this.update = update;
    this.applicableRules = Object.freeze([...applicableRules]);
    this.validCountSoFar = validCountSoFar;
    this.middleSumSoFar = middleSumSoFar;
    Object.freeze(this);
  }

  get isValid(): boolean {
    for (const rule of this.applicableRules) {
      if (!rule.isSatisfied) return false;
    }
    return true;
  }

  get violationCount(): number {
    let count = 0;
    for (const rule of this.applicableRules) {
      if (!rule.isSatisfied) count += 1;
    }
    return count;
  }

  get middleContribution(): number {
    return this.isValid ? this.update.middlePage : 0;
  }
}

/** Sums middle pages of every update that satisfies all applicable ordering rules. */
export function sumValidMiddlePages(queue: PrintQueue): number {
  let total = 0;
  for (const update of queue.updates) {
    if (queue.rules.isValidOrder(update.pages)) {
      total += update.middlePage;
    }
  }
  return total;
}

/** Traces queue validation across all updates, uniformly sampling up to `maxSteps` frames. */
export function tracePrintQueue(
  queue: PrintQueue,
  options?: TraceOptions,
): readonly PrintQueueTraceFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sampled = new Set(sampleTraceIndices(queue.updates.length, maxSteps));
  const frames: PrintQueueTraceFrame[] = [];
  let validCount = 0;
  let middleSum = 0;

  for (let i = 0; i < queue.updates.length; i++) {
    const update = queue.updates[i]!;
    if (queue.rules.isValidOrder(update.pages)) {
      validCount += 1;
      middleSum += update.middlePage;
    }
    if (sampled.has(i)) {
      frames.push(
        new PrintQueueTraceFrame(
          i,
          queue.updates.length,
          update,
          queue.rules.applicableRules(update.pages),
          validCount,
          middleSum,
        ),
      );
    }
  }
  return Object.freeze(frames);
}

export const solver: PuzzleSolver<PrintQueue, number, PrintQueueTraceFrame> = Object.freeze({
  parse: parsePrintQueue,
  solve: sumValidMiddlePages,
  trace: tracePrintQueue,
});
