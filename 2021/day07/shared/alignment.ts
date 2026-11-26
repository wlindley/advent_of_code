import {
  floorDiv,
  sampleTraceIndices,
  validateMaxSteps,
  type PuzzleSolver,
  type TraceOptions,
} from '../../../shared/core';
import { CrabFleet } from './fleet';
import type { FuelCostModel } from './fuelModel';
import { parseCrabFleet } from './parser';

export const DEFAULT_MAX_TRACE_STEPS = 64;
export type SearchDirection = 'left' | 'right' | 'converged';
export interface AlignmentResult { readonly target: bigint; readonly fuel: bigint; }

export interface AlignmentSearchFrameProps {
  readonly step: number;
  readonly lo: bigint;
  readonly hi: bigint;
  readonly mid: bigint;
  readonly midFuel: bigint;
  readonly nextFuel: bigint | null;
  readonly direction: SearchDirection;
}

interface BracketStep {
  readonly lo: bigint;
  readonly hi: bigint;
  readonly mid: bigint;
  readonly midFuel: bigint;
  readonly nextFuel: bigint | null;
  readonly direction: SearchDirection;
  readonly nextLo: bigint;
  readonly nextHi: bigint;
}

/** Immutable snapshot of one binary-search probe along the convex fuel landscape. */
export class AlignmentSearchFrame {
  readonly step: number;
  readonly lo: bigint;
  readonly hi: bigint;
  readonly mid: bigint;
  readonly midFuel: bigint;
  readonly nextFuel: bigint | null;
  readonly direction: SearchDirection;

  constructor(props: AlignmentSearchFrameProps) {
    this.step = props.step;
    this.lo = props.lo;
    this.hi = props.hi;
    this.mid = props.mid;
    this.midFuel = props.midFuel;
    this.nextFuel = props.nextFuel;
    this.direction = props.direction;
    Object.freeze(this);
  }

  get bracketWidth(): bigint { return this.hi - this.lo + 1n; }
  get isConverged(): boolean { return this.direction === 'converged'; }
  get nextPosition(): bigint | null { return this.isConverged ? null : this.mid + 1n; }
}

/** Evaluates one midpoint probe in `[lo, hi]` and returns the narrowed search bracket. */
export function stepAlignmentBracket(
  fleet: CrabFleet,
  model: FuelCostModel,
  lo: bigint,
  hi: bigint,
): BracketStep {
  if (lo === hi) {
    const midFuel = fleet.fuelAt(lo, model);
    return { lo, hi, mid: lo, midFuel, nextFuel: null, direction: 'converged', nextLo: lo, nextHi: hi };
  }
  const mid = floorDiv(lo + hi, 2n);
  const midFuel = fleet.fuelAt(mid, model);
  const nextFuel = fleet.fuelAt(mid + 1n, model);
  if (midFuel <= nextFuel) {
    return { lo, hi, mid, midFuel, nextFuel, direction: 'left', nextLo: lo, nextHi: mid };
  }
  return { lo, hi, mid, midFuel, nextFuel, direction: 'right', nextLo: mid + 1n, nextHi: hi };
}

/** Finds the leftmost integer target minimizing total fleet fuel under `model`. */
export function findOptimalAlignment(fleet: CrabFleet, model: FuelCostModel): AlignmentResult {
  let lo = fleet.minPosition;
  let hi = fleet.maxPosition;
  while (true) {
    const bracket = stepAlignmentBracket(fleet, model, lo, hi);
    if (bracket.direction === 'converged') {
      return Object.freeze({ target: bracket.mid, fuel: bracket.midFuel });
    }
    lo = bracket.nextLo;
    hi = bracket.nextHi;
  }
}

/** Generates sampled binary-search frames over `[minPosition, maxPosition]` ending at convergence. */
export function traceAlignmentSearch(
  fleet: CrabFleet,
  model: FuelCostModel,
  options?: TraceOptions,
): readonly AlignmentSearchFrame[] {
  const maxSteps = options === undefined ? undefined : options.maxSteps;
  const limit = validateMaxSteps(maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const allFrames: AlignmentSearchFrame[] = [];
  let lo = fleet.minPosition;
  let hi = fleet.maxPosition;
  while (true) {
    const bracket = stepAlignmentBracket(fleet, model, lo, hi);
    allFrames.push(new AlignmentSearchFrame({ step: allFrames.length, ...bracket }));
    if (bracket.direction === 'converged') break;
    lo = bracket.nextLo;
    hi = bracket.nextHi;
  }
  const keep = new Set(sampleTraceIndices(allFrames.length, limit));
  return Object.freeze(allFrames.filter((_, index) => keep.has(index)));
}

/** Parameterized crab alignment solver bound to a specific fuel cost model. */
export class CrabAlignmentSolver
  implements Required<PuzzleSolver<CrabFleet, bigint, AlignmentSearchFrame>>
{
  readonly model: FuelCostModel;

  constructor(model: FuelCostModel) {
    this.model = model;
    Object.freeze(this);
  }

  parse(raw: string): CrabFleet { return parseCrabFleet(raw); }
  solve(fleet: CrabFleet): bigint { return findOptimalAlignment(fleet, this.model).fuel; }
  trace(fleet: CrabFleet, options?: TraceOptions): readonly AlignmentSearchFrame[] {
    return traceAlignmentSearch(fleet, this.model, options);
  }
}
