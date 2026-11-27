import {
  sampleTraceIndices,
  validateMaxSteps,
  type PuzzleSolver,
  type TraceOptions,
} from '../../../shared/core';
import { parsePolymerFormula } from './parser';
import {
  validateStepCount,
  type ElementFrequency,
  type PairReaction,
  type PolymerFormula,
  type PolymerState,
} from './polymer';

export const PART1_STEPS = 10;
export const PART2_STEPS = 40;
export const DEFAULT_MAX_TRACE_STEPS = 41;

/** Immutable snapshot of polymer state and derived metrics at a single step. */
export class PolymerTraceFrame {
  readonly step: number;
  readonly state: PolymerState;
  readonly formula: PolymerFormula;

  constructor(step: number, state: PolymerState, formula: PolymerFormula) {
    this.step = step;
    this.state = state;
    this.formula = formula;
    Object.freeze(this);
  }

  get totalLength(): bigint {
    return this.state.totalLength;
  }

  get mostCommon(): ElementFrequency {
    return this.state.mostCommon;
  }

  get leastCommon(): ElementFrequency {
    return this.state.leastCommon;
  }

  get spread(): bigint {
    return this.state.spread;
  }

  get activePairCount(): number {
    return this.state.activePairCount;
  }

  get activeReactions(): readonly PairReaction[] {
    return this.state.activeReactions(this.formula);
  }

  get insertionsNext(): bigint {
    return this.state.insertionsNext(this.formula);
  }
}

/** Streams polymerization steps and retains uniformly sampled trace frames up to `maxSteps`. */
export function tracePolymerization(
  formula: PolymerFormula,
  steps: number,
  options?: TraceOptions,
): readonly PolymerTraceFrame[] {
  const totalSteps = validateStepCount(steps);
  const maxSteps = validateMaxSteps(
    options === undefined ? undefined : options.maxSteps,
    DEFAULT_MAX_TRACE_STEPS,
  );
  const indices = sampleTraceIndices(totalSteps + 1, maxSteps);
  const frames: PolymerTraceFrame[] = [];
  let nextSample = 0;
  let current = formula.initialState();

  for (let step = 0; step <= totalSteps; step += 1) {
    if (indices[nextSample] === step) {
      frames.push(new PolymerTraceFrame(step, current, formula));
      nextSample += 1;
    }
    if (step < totalSteps) {
      current = current.step(formula);
    }
  }
  return Object.freeze(frames);
}

/** Parameterizable puzzle solver for Extended Polymerization parts 1 and 2. */
export class PolymerizationSolver
  implements Required<PuzzleSolver<PolymerFormula, bigint, PolymerTraceFrame>>
{
  readonly steps: number;

  constructor(steps: number) {
    this.steps = validateStepCount(steps);
    Object.freeze(this);
  }

  parse(raw: string): PolymerFormula {
    return parsePolymerFormula(raw);
  }

  solve(input: PolymerFormula): bigint {
    return input.initialState().advance(input, this.steps).spread;
  }

  trace(input: PolymerFormula, options?: TraceOptions): readonly PolymerTraceFrame[] {
    return tracePolymerization(input, this.steps, options);
  }

  formatAnswer(answer: bigint): string {
    return answer.toString();
  }
}
