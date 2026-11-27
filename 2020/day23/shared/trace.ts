import type { CupMoveRecord, CupRing } from './ring';

export const DEFAULT_MAX_TRACE_STEPS = 120;
export const FULL_RING_MAX_CUPS = 20;
export const LOCAL_WINDOW_CUPS = 12;

export interface CrabCupsTraceFrameInit {
  readonly move: number;
  readonly totalMoves: number;
  readonly cupCount: number;
  readonly currentCup: number;
  readonly lastMove: CupMoveRecord | null;
  readonly windowFromOne: readonly number[];
  readonly windowFromCurrent: readonly number[];
}

/** Immutable snapshot of a Crab Cups simulation step with dynamically derived telemetry. */
export class CrabCupsTraceFrame {
  readonly move: number;
  readonly totalMoves: number;
  readonly cupCount: number;
  readonly currentCup: number;
  readonly lastMove: CupMoveRecord | null;
  readonly windowFromOne: readonly number[];
  readonly windowFromCurrent: readonly number[];

  constructor(init: CrabCupsTraceFrameInit) {
    this.move = init.move;
    this.totalMoves = init.totalMoves;
    this.cupCount = init.cupCount;
    this.currentCup = init.currentCup;
    this.lastMove = init.lastMove;
    this.windowFromOne = Object.freeze([...init.windowFromOne]);
    this.windowFromCurrent = Object.freeze([...init.windowFromCurrent]);
    Object.freeze(this);
  }

  get isFullRing(): boolean {
    return this.cupCount <= FULL_RING_MAX_CUPS;
  }

  get isFinal(): boolean {
    return this.move >= this.totalMoves;
  }

  get didWrap(): boolean {
    return this.lastMove !== null && this.lastMove.destination >= this.lastMove.sourceCup;
  }

  get firstAfterOne(): number {
    return this.windowFromOne[1]!;
  }

  get secondAfterOne(): number {
    return this.windowFromOne[2]!;
  }

  get productAfterOne(): bigint {
    return BigInt(this.firstAfterOne) * BigInt(this.secondAfterOne);
  }

  get labelsAfterOne(): string | null {
    return this.isFullRing ? this.windowFromOne.slice(1).join('') : null;
  }
}

/** Captures a full-ring or 12-cup local-window trace frame from the current CupRing state. */
export function captureTraceFrame(
  ring: CupRing,
  move: number,
  totalMoves: number,
  lastMove: CupMoveRecord | null,
): CrabCupsTraceFrame {
  const windowSize = ring.cupCount <= FULL_RING_MAX_CUPS ? ring.cupCount : LOCAL_WINDOW_CUPS;
  return new CrabCupsTraceFrame({
    move,
    totalMoves,
    cupCount: ring.cupCount,
    currentCup: ring.currentCup,
    lastMove,
    windowFromOne: ring.clockwiseFrom(1, windowSize),
    windowFromCurrent: ring.clockwiseFrom(ring.currentCup, windowSize),
  });
}
