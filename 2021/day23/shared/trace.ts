import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../shared/core';
import { type BurrowMove, BurrowState } from './burrow';
import { ROOM_COUNT } from './constants';
import { estimateRemainingEnergy } from './heuristic';
import { applyMoveToKey } from './moves';
import type { BurrowDiagram } from './parser';
import type { BurrowPolicy } from './policy';
import { findOptimalOrganization } from './search';

export const DEFAULT_MAX_TRACE_STEPS = 80;

/** Immutable trace frame along the optimal burrow organization path; derives metrics via getters. */
export class BurrowTraceFrame {
  readonly stepIndex: number;
  readonly totalMoves: number;
  readonly state: BurrowState;
  readonly lastMove: BurrowMove | null;
  readonly cumulativeEnergy: number;
  readonly statesExpanded: number;

  constructor(
    stepIndex: number,
    totalMoves: number,
    state: BurrowState,
    lastMove: BurrowMove | null,
    cumulativeEnergy: number,
    statesExpanded: number,
  ) {
    this.stepIndex = stepIndex;
    this.totalMoves = totalMoves;
    this.state = state;
    this.lastMove = lastMove;
    this.cumulativeEnergy = cumulativeEnergy;
    this.statesExpanded = statesExpanded;
    Object.freeze(this);
  }

  get moveEnergy(): number {
    return this.lastMove === null ? 0 : this.lastMove.energy;
  }

  get heuristicRemaining(): number {
    return estimateRemainingEnergy(this.state.key, this.state.roomDepth);
  }

  get settledCount(): number {
    return this.state.settledCount;
  }

  get totalAmphipods(): number {
    return this.state.roomDepth * ROOM_COUNT;
  }

  get isGoal(): boolean {
    return this.state.isGoal;
  }
}

/** Solves `diagram` under `policy` and samples up to `options.maxSteps` frames along the optimal path. */
export function traceBurrow(
  diagram: BurrowDiagram,
  policy: BurrowPolicy,
  options?: TraceOptions,
): readonly BurrowTraceFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const start = policy.prepare(diagram);
  const result = findOptimalOrganization(start);
  const totalMoves = result.moves.length;
  const sampled = new Set(sampleTraceIndices(totalMoves + 1, maxSteps));
  const frames: BurrowTraceFrame[] = [];

  let state = start;
  let cumulativeEnergy = 0;
  if (sampled.has(0)) {
    frames.push(new BurrowTraceFrame(0, totalMoves, state, null, 0, result.statesExpanded));
  }
  for (let i = 0; i < totalMoves; i += 1) {
    const move = result.moves[i]!;
    state = new BurrowState(applyMoveToKey(state.key, state.roomDepth, move), state.roomDepth);
    cumulativeEnergy += move.energy;
    if (sampled.has(i + 1)) {
      frames.push(
        new BurrowTraceFrame(i + 1, totalMoves, state, move, cumulativeEnergy, result.statesExpanded),
      );
    }
  }
  return Object.freeze(frames);
}
