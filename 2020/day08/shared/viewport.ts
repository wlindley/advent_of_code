import type { BootTraceFrame } from './trace';

/** Default number of visible instruction rows in the debugger viewport. */
export const DEFAULT_WINDOW_ROWS = 19;

function clampRow(pc: number, windowStart: number, windowEnd: number): number {
  const maxRow = windowEnd - windowStart - 1;
  return Math.max(0, Math.min(pc - windowStart, maxRow));
}

/** Immutable projection of a jump transition onto a clipped debugger viewport window. */
export class JumpArcProjection {
  readonly fromPc: number;
  readonly toPc: number;
  readonly windowStart: number;
  readonly windowEnd: number;

  constructor(fromPc: number, toPc: number, windowStart: number, windowEnd: number) {
    if (!Number.isInteger(windowStart) || windowStart < 0) {
      throw new RangeError(`windowStart must be a non-negative integer, got ${windowStart}`);
    }
    if (!Number.isInteger(windowEnd) || windowEnd <= windowStart) {
      throw new RangeError(`windowEnd must exceed windowStart (${windowStart}), got ${windowEnd}`);
    }
    this.fromPc = fromPc;
    this.toPc = toPc;
    this.windowStart = windowStart;
    this.windowEnd = windowEnd;
    Object.freeze(this);
  }

  get delta(): number {
    return this.toPc - this.fromPc;
  }

  get isBackward(): boolean {
    return this.toPc < this.fromPc;
  }

  get isFromClipped(): boolean {
    return this.fromPc < this.windowStart || this.fromPc >= this.windowEnd;
  }

  get isToClipped(): boolean {
    return this.toPc < this.windowStart || this.toPc >= this.windowEnd;
  }

  get fromRow(): number {
    return clampRow(this.fromPc, this.windowStart, this.windowEnd);
  }

  get toRow(): number {
    return clampRow(this.toPc, this.windowStart, this.windowEnd);
  }
}

/** Immutable visible-row slice and active jump arc for a debugger frame. */
export class DebuggerWindow {
  readonly totalRows: number;
  readonly startPc: number;
  readonly endPc: number;
  readonly activePc: number;
  readonly jumpArc: JumpArcProjection | null;

  constructor(
    totalRows: number,
    startPc: number,
    endPc: number,
    activePc: number,
    jumpArc: JumpArcProjection | null,
  ) {
    if (!Number.isInteger(totalRows) || totalRows < 1) {
      throw new RangeError(`totalRows must be >= 1, got ${totalRows}`);
    }
    if (!Number.isInteger(startPc) || startPc < 0 || endPc <= startPc || endPc > totalRows) {
      throw new RangeError(`Invalid window [${startPc}, ${endPc}) for totalRows=${totalRows}`);
    }
    this.totalRows = totalRows;
    this.startPc = startPc;
    this.endPc = endPc;
    this.activePc = activePc;
    this.jumpArc = jumpArc;
    Object.freeze(this);
  }

  get visibleCount(): number {
    return this.endPc - this.startPc;
  }

  get hasRowsAbove(): boolean {
    return this.startPc > 0;
  }

  get hasRowsBelow(): boolean {
    return this.endPc < this.totalRows;
  }
}

/** Computes a centered DebuggerWindow around the frame's active program counter. */
export function computeDebuggerWindow(
  frame: BootTraceFrame,
  maxVisibleRows: number,
): DebuggerWindow {
  if (!Number.isInteger(maxVisibleRows) || maxVisibleRows < 1) {
    throw new RangeError(`maxVisibleRows must be a positive integer, got ${maxVisibleRows}`);
  }
  const totalRows = frame.program.length;
  const visibleCount = Math.min(totalRows, maxVisibleRows);
  const focusPc = Math.max(0, Math.min(frame.activePc, totalRows - 1));
  const half = Math.floor(visibleCount / 2);
  const startPc = Math.max(0, Math.min(focusPc - half, totalRows - visibleCount));
  const endPc = startPc + visibleCount;
  const jumpArc = frame.step.isJump
    ? new JumpArcProjection(frame.step.pc, frame.step.nextPc, startPc, endPc)
    : null;
  return new DebuggerWindow(totalRows, startPc, endPc, frame.activePc, jumpArc);
}
