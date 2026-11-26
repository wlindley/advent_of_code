import {
  sampleTraceIndices,
  validateMaxSteps,
  type TraceOptions,
} from '../../../shared/core';
import { validateExpansionFactor } from './expansion';
import type { UniverseMap } from './universe';

export const DEFAULT_MAX_TRACE_STEPS = 120;

export type SweepAxis = 'row' | 'col';

export interface CosmicExpansionTraceFrameInit {
  readonly axis: SweepAxis;
  readonly index: number;
  readonly isEmptyRift: boolean;
  readonly prefixGalaxies: number;
  readonly suffixGalaxies: number;
  readonly stepWidth: bigint;
  readonly rowTotal: bigint;
  readonly colTotal: bigint;
}

/**
 * Immutable snapshot of one row or column cut during the axis-sweep distance sum.
 * Derives `stepContribution` and `runningTotal` dynamically with zero stored derived state.
 */
export class CosmicExpansionTraceFrame {
  readonly axis: SweepAxis;
  readonly index: number;
  readonly isEmptyRift: boolean;
  readonly prefixGalaxies: number;
  readonly suffixGalaxies: number;
  readonly stepWidth: bigint;
  readonly rowTotal: bigint;
  readonly colTotal: bigint;

  constructor(init: CosmicExpansionTraceFrameInit) {
    this.axis = init.axis;
    this.index = init.index;
    this.isEmptyRift = init.isEmptyRift;
    this.prefixGalaxies = init.prefixGalaxies;
    this.suffixGalaxies = init.suffixGalaxies;
    this.stepWidth = init.stepWidth;
    this.rowTotal = init.rowTotal;
    this.colTotal = init.colTotal;
    Object.freeze(this);
  }

  get stepContribution(): bigint {
    return BigInt(this.prefixGalaxies) * BigInt(this.suffixGalaxies) * this.stepWidth;
  }

  get runningTotal(): bigint {
    return this.rowTotal + this.colTotal;
  }
}

interface AxisTraceArgs {
  readonly axis: SweepAxis;
  readonly counts: readonly number[];
  readonly totalGalaxies: number;
  readonly factor: bigint;
  readonly stepOffset: number;
  readonly priorRowTotal: bigint;
  readonly sampled: ReadonlySet<number>;
  readonly frames: CosmicExpansionTraceFrame[];
}

function sweepAxisForTrace(args: AxisTraceArgs): bigint {
  let prefix = 0;
  let axisRunning = 0n;
  for (let i = 0; i < args.counts.length; i += 1) {
    const count = args.counts[i]!;
    prefix += count;
    const suffix = args.totalGalaxies - prefix;
    const isEmptyRift = count === 0;
    const stepWidth = isEmptyRift ? args.factor : 1n;
    axisRunning += BigInt(prefix) * BigInt(suffix) * stepWidth;
    if (args.sampled.has(args.stepOffset + i)) {
      args.frames.push(
        new CosmicExpansionTraceFrame({
          axis: args.axis,
          index: i,
          isEmptyRift,
          prefixGalaxies: prefix,
          suffixGalaxies: suffix,
          stepWidth,
          rowTotal: args.axis === 'row' ? axisRunning : args.priorRowTotal,
          colTotal: args.axis === 'row' ? 0n : axisRunning,
        }),
      );
    }
  }
  return axisRunning;
}

/** Builds a bounded sampled trace sweeping all rows then all columns for a `UniverseMap`. */
export function buildCosmicExpansionTrace(
  universe: UniverseMap,
  expansionFactor: bigint,
  options?: TraceOptions,
): readonly CosmicExpansionTraceFrame[] {
  const factor = validateExpansionFactor(expansionFactor);
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const rowCounts = universe.rowCounts();
  const colCounts = universe.colCounts();
  const totalGalaxies = rowCounts.reduce((sum, n) => sum + n, 0);
  const sampled = new Set(sampleTraceIndices(rowCounts.length + colCounts.length, limit));
  const frames: CosmicExpansionTraceFrame[] = [];

  const rowTotal = sweepAxisForTrace({
    axis: 'row',
    counts: rowCounts,
    totalGalaxies,
    factor,
    stepOffset: 0,
    priorRowTotal: 0n,
    sampled,
    frames,
  });
  sweepAxisForTrace({
    axis: 'col',
    counts: colCounts,
    totalGalaxies,
    factor,
    stepOffset: rowCounts.length,
    priorRowTotal: rowTotal,
    sampled,
    frames,
  });

  return Object.freeze(frames);
}
