import {
  sampleTraceIndices,
  validateMaxSteps,
  type PuzzleSolver,
  type TraceOptions,
} from '../../../../shared/core';
import {
  parsePrintQueue,
  PrintUpdate,
  type ApplicableRule,
  type PageOrderRules,
  type PrintQueue,
} from '../../shared';

export const DEFAULT_MAX_TRACE_STEPS = 200;

/** Displacement of a single page from its original index to its repaired index. */
export interface PageDisplacement {
  readonly page: number;
  readonly fromIndex: number;
  readonly toIndex: number;
}

interface InvalidUpdateEntry {
  readonly updateIndex: number;
  readonly update: PrintUpdate;
}

/** Immutable per-repair trace snapshot for Part 2 topological ordering. */
export class PrintRepairTraceFrame {
  readonly repairIndex: number;
  readonly totalInvalidUpdates: number;
  readonly updateIndex: number;
  readonly totalUpdates: number;
  readonly original: PrintUpdate;
  readonly repaired: PrintUpdate;
  readonly originalRules: readonly ApplicableRule[];
  readonly repairedRules: readonly ApplicableRule[];
  readonly middleSumSoFar: number;

  constructor(
    repairIndex: number,
    totalInvalidUpdates: number,
    updateIndex: number,
    totalUpdates: number,
    original: PrintUpdate,
    repaired: PrintUpdate,
    originalRules: readonly ApplicableRule[],
    repairedRules: readonly ApplicableRule[],
    middleSumSoFar: number,
  ) {
    this.repairIndex = repairIndex;
    this.totalInvalidUpdates = totalInvalidUpdates;
    this.updateIndex = updateIndex;
    this.totalUpdates = totalUpdates;
    this.original = original;
    this.repaired = repaired;
    this.originalRules = Object.freeze([...originalRules]);
    this.repairedRules = Object.freeze([...repairedRules]);
    this.middleSumSoFar = middleSumSoFar;
    Object.freeze(this);
  }

  get repairedCountSoFar(): number {
    return this.repairIndex + 1;
  }

  get repairedMiddlePage(): number {
    return this.repaired.middlePage;
  }

  get violationCount(): number {
    let count = 0;
    for (const rule of this.originalRules) {
      if (!rule.isSatisfied) count += 1;
    }
    return count;
  }

  get movedPageCount(): number {
    let count = 0;
    for (let i = 0; i < this.original.pages.length; i++) {
      if (this.original.pages[i]! !== this.repaired.pages[i]!) count += 1;
    }
    return count;
  }

  get displacements(): readonly PageDisplacement[] {
    const targetIndex = new Map<number, number>();
    for (let i = 0; i < this.repaired.pages.length; i++) {
      targetIndex.set(this.repaired.pages[i]!, i);
    }
    const result: PageDisplacement[] = [];
    for (let i = 0; i < this.original.pages.length; i++) {
      const page = this.original.pages[i]!;
      result.push(Object.freeze({ page, fromIndex: i, toIndex: targetIndex.get(page)! }));
    }
    return Object.freeze(result);
  }
}

/** Returns a new `PrintUpdate` ordered topologically by the induced precedence subgraph. */
export function repairUpdate(rules: PageOrderRules, update: PrintUpdate): PrintUpdate {
  return new PrintUpdate(rules.inducedGraph(update.pages).topologicalOrder());
}

/** Sums middle pages of invalid updates after repairing each via topological sort. */
export function sumRepairedMiddlePages(queue: PrintQueue): number {
  let total = 0;
  for (const update of queue.updates) {
    if (!queue.rules.isValidOrder(update.pages)) {
      total += repairUpdate(queue.rules, update).middlePage;
    }
  }
  return total;
}

function collectInvalidUpdates(queue: PrintQueue): readonly InvalidUpdateEntry[] {
  const invalid: InvalidUpdateEntry[] = [];
  for (let updateIndex = 0; updateIndex < queue.updates.length; updateIndex++) {
    const update = queue.updates[updateIndex]!;
    if (!queue.rules.isValidOrder(update.pages)) {
      invalid.push({ updateIndex, update });
    }
  }
  return invalid;
}

/** Traces repairs across invalid updates, uniformly sampling up to `maxSteps` frames. */
export function tracePrintRepairs(
  queue: PrintQueue,
  options?: TraceOptions,
): readonly PrintRepairTraceFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const invalid = collectInvalidUpdates(queue);
  const sampled = new Set(sampleTraceIndices(invalid.length, maxSteps));
  const frames: PrintRepairTraceFrame[] = [];
  let middleSum = 0;

  for (let repairIndex = 0; repairIndex < invalid.length; repairIndex++) {
    const entry = invalid[repairIndex]!;
    const repaired = repairUpdate(queue.rules, entry.update);
    middleSum += repaired.middlePage;
    if (sampled.has(repairIndex)) {
      frames.push(
        new PrintRepairTraceFrame(
          repairIndex,
          invalid.length,
          entry.updateIndex,
          queue.updates.length,
          entry.update,
          repaired,
          queue.rules.applicableRules(entry.update.pages),
          queue.rules.applicableRules(repaired.pages),
          middleSum,
        ),
      );
    }
  }
  return Object.freeze(frames);
}

export const solver: PuzzleSolver<PrintQueue, number, PrintRepairTraceFrame> = Object.freeze({
  parse: parsePrintQueue,
  solve: sumRepairedMiddlePages,
  trace: tracePrintRepairs,
});
