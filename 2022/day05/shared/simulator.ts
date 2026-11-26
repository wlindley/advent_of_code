import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../shared/core';
import { readTopMessage, type Crate, type MoveInstruction, type SupplyProcedure } from './model';

export const DEFAULT_MAX_TRACE_STEPS = 120;

/** Strategy defining how a crane orders crates lifted from a source stack. */
export interface CraneStrategy {
  readonly name: string;
  readonly modelNumber: number;
  arrangeLifted(liftedBottomToTop: readonly Crate[]): readonly Crate[];
}

export interface CraneTraceFrameInit {
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly moveIndex: number;
  readonly totalMoves: number;
  readonly appliedMove: MoveInstruction | null;
  readonly placedCrates: readonly Crate[];
  readonly stacks: readonly (readonly Crate[])[];
  readonly globalPeakHeight: number;
}

function maxStackHeight(stacks: readonly (readonly Crate[])[]): number {
  let max = 0;
  for (const stack of stacks) {
    if (stack.length > max) max = stack.length;
  }
  return max;
}

function freezeStacks(stacks: readonly (readonly Crate[])[]): readonly (readonly Crate[])[] {
  const frozen: (readonly Crate[])[] = [];
  for (const stack of stacks) {
    frozen.push(Object.freeze([...stack]));
  }
  return Object.freeze(frozen);
}

/** Immutable snapshot of cargo bay state at a sampled simulation step. */
export class CraneTraceFrame {
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly moveIndex: number;
  readonly totalMoves: number;
  readonly appliedMove: MoveInstruction | null;
  readonly placedCrates: readonly Crate[];
  readonly stacks: readonly (readonly Crate[])[];
  readonly globalPeakHeight: number;

  constructor(init: CraneTraceFrameInit) {
    this.stepIndex = init.stepIndex;
    this.totalSteps = init.totalSteps;
    this.moveIndex = init.moveIndex;
    this.totalMoves = init.totalMoves;
    this.appliedMove = init.appliedMove;
    this.placedCrates = Object.freeze([...init.placedCrates]);
    this.stacks = freezeStacks(init.stacks);
    this.globalPeakHeight = init.globalPeakHeight;
    Object.freeze(this);
  }

  get topMessage(): string {
    return readTopMessage(this.stacks);
  }

  get currentPeakHeight(): number {
    return maxStackHeight(this.stacks);
  }
}

function cloneMutableStacks(stacks: readonly (readonly Crate[])[]): Crate[][] {
  const cloned: Crate[][] = [];
  for (const stack of stacks) {
    cloned.push([...stack]);
  }
  return cloned;
}

function applyMove(
  stacks: Crate[][],
  move: MoveInstruction,
  moveNumber: number,
  crane: CraneStrategy,
): readonly Crate[] {
  const source = stacks[move.from - 1]!;
  const target = stacks[move.to - 1]!;
  if (move.count > source.length) {
    throw new RangeError(
      `Move ${moveNumber} (${move.summary}) needs ${move.count} crates, stack ${move.from} has ${source.length}`,
    );
  }
  const lifted = source.splice(source.length - move.count, move.count);
  const placed = crane.arrangeLifted(Object.freeze(lifted));
  target.push(...placed);
  return Object.freeze([...placed]);
}

/** Executes the full rearrangement procedure and returns the final top-crate message. */
export function executeProcedure(procedure: SupplyProcedure, crane: CraneStrategy): string {
  const stacks = cloneMutableStacks(procedure.initialStacks);
  for (let i = 0; i < procedure.moves.length; i += 1) {
    applyMove(stacks, procedure.moves[i]!, i + 1, crane);
  }
  return readTopMessage(stacks);
}

interface FrameSnapshot {
  readonly moveIndex: number;
  readonly appliedMove: MoveInstruction | null;
  readonly placedCrates: readonly Crate[];
  readonly stacks: Crate[][];
}

function finalizeFrames(
  snapshots: readonly FrameSnapshot[],
  totalMoves: number,
  globalPeakHeight: number,
): readonly CraneTraceFrame[] {
  const frames: CraneTraceFrame[] = [];
  for (let i = 0; i < snapshots.length; i += 1) {
    const snap = snapshots[i]!;
    frames.push(
      new CraneTraceFrame({
        stepIndex: i,
        totalSteps: snapshots.length,
        moveIndex: snap.moveIndex,
        totalMoves,
        appliedMove: snap.appliedMove,
        placedCrates: snap.placedCrates,
        stacks: snap.stacks,
        globalPeakHeight,
      }),
    );
  }
  return Object.freeze(frames);
}

/** Simulates all moves and emits up to `maxSteps` uniformly sampled trace frames. */
export function traceProcedure(
  procedure: SupplyProcedure,
  crane: CraneStrategy,
  options?: TraceOptions,
): readonly CraneTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const totalMoves = procedure.moveCount;
  const sampled = sampleTraceIndices(totalMoves + 1, limit);
  const stacks = cloneMutableStacks(procedure.initialStacks);
  let peakHeight = maxStackHeight(stacks);
  const snapshots: FrameSnapshot[] = [];
  let cursor = 0;

  if (sampled[cursor] === 0) {
    snapshots.push({ moveIndex: 0, appliedMove: null, placedCrates: [], stacks: cloneMutableStacks(stacks) });
    cursor += 1;
  }
  for (let m = 1; m <= totalMoves; m += 1) {
    const move = procedure.moves[m - 1]!;
    const placed = applyMove(stacks, move, m, crane);
    const height = maxStackHeight(stacks);
    if (height > peakHeight) peakHeight = height;
    if (sampled[cursor] === m) {
      snapshots.push({ moveIndex: m, appliedMove: move, placedCrates: placed, stacks: cloneMutableStacks(stacks) });
      cursor += 1;
    }
  }
  return finalizeFrames(snapshots, totalMoves, peakHeight);
}
