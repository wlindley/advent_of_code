import { sampleTraceIndices } from '../../../shared/core';
import { type ArrangementStep, type ArrangementTable, computeArrangementTable } from './arrangements';
import type { AdapterChain, JoltDelta } from './chain';
import { collectJoltSteps, type JoltHistogram, type JoltStep } from './differences';

/** Default frame cap applied when tracing large adapter chains. */
export const DEFAULT_MAX_TRACE_STEPS = 240;

/** Trace frame capturing one consecutive jolt-difference transition step. */
export class DifferenceTraceFrame {
  readonly phase = 'differences' as const;
  readonly totalSteps: number;
  readonly transition: JoltStep;

  constructor(totalSteps: number, transition: JoltStep) {
    if (!Number.isInteger(totalSteps) || totalSteps < transition.toIndex) {
      throw new RangeError(`totalSteps ${totalSteps} must be >= transition.toIndex ${transition.toIndex}`);
    }
    this.totalSteps = totalSteps;
    this.transition = transition;
    Object.freeze(this);
  }

  get step(): number {
    return this.transition.toIndex;
  }

  get activeIndex(): number {
    return this.transition.toIndex;
  }

  get fromIndex(): number {
    return this.transition.fromIndex;
  }

  get delta(): JoltDelta {
    return this.transition.delta;
  }

  get histogram(): JoltHistogram {
    return this.transition.histogram;
  }

  get isComplete(): boolean {
    return this.transition.toIndex === this.totalSteps;
  }
}

/** Trace frame sharing a single frozen DP table to inspect one arrangement step in O(1). */
export class ArrangementTraceFrame {
  readonly phase = 'arrangements' as const;
  readonly activeIndex: number;
  readonly table: ArrangementTable;

  constructor(activeIndex: number, table: ArrangementTable) {
    if (!Number.isInteger(activeIndex) || activeIndex < 0 || activeIndex >= table.nodeCount) {
      throw new RangeError(`activeIndex ${activeIndex} out of bounds [0, ${table.nodeCount - 1}]`);
    }
    this.activeIndex = activeIndex;
    this.table = table;
    Object.freeze(this);
  }

  get step(): number {
    return this.activeIndex + 1;
  }

  get totalSteps(): number {
    return this.table.nodeCount;
  }

  get activeStep(): ArrangementStep {
    return this.table.stepAt(this.activeIndex);
  }

  get ways(): bigint {
    return this.activeStep.ways;
  }

  get predecessorIndices(): readonly number[] {
    return this.activeStep.predecessorIndices;
  }

  get isComplete(): boolean {
    return this.activeIndex === this.table.nodeCount - 1;
  }

  waysIfComputed(index: number): bigint | null {
    const ways = this.table.waysAt(index);
    return index > this.activeIndex ? null : ways;
  }
}

/** Discriminated union of Part 1 difference frames and Part 2 arrangement frames. */
export type AdapterTraceFrame = DifferenceTraceFrame | ArrangementTraceFrame;

/** Produces a budget-bounded trace of Part 1 consecutive jolt differences. */
export function traceDifferences(chain: AdapterChain, maxSteps: number): readonly DifferenceTraceFrame[] {
  const steps = collectJoltSteps(chain);
  const indices = sampleTraceIndices(steps.length, maxSteps);
  return Object.freeze(indices.map((i) => new DifferenceTraceFrame(steps.length, steps[i]!)));
}

/** Produces a budget-bounded trace of Part 2 sliding-3-predecessor DP arrangements. */
export function traceArrangements(chain: AdapterChain, maxSteps: number): readonly ArrangementTraceFrame[] {
  const table = computeArrangementTable(chain);
  const indices = sampleTraceIndices(table.nodeCount, maxSteps);
  return Object.freeze(indices.map((i) => new ArrangementTraceFrame(i, table)));
}
