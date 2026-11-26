import { sampleTraceIndices, validateMaxSteps, type PuzzleSolver, type TraceOptions } from '../../../shared/core';
import { GridBounds, GridPoint, MotionPlan } from './motionPlan';

export const DEFAULT_DENSE_CELL_LIMIT = 4_000_000;
export const DEFAULT_MAX_TRACE_STEPS = 400;

export interface RopeBridgeSolver extends PuzzleSolver<MotionPlan, number, RopeTraceFrame> {
  trace(input: MotionPlan, options?: TraceOptions): readonly RopeTraceFrame[];
}

function requireIntAtLeast(value: number, min: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < min) {
    throw new RangeError(`${label} must be an integer >= ${min}, got ${value}`);
  }
  return value;
}

/** Immutable snapshot of all rope knots and newly visited tail cells at a trace frame. */
export class RopeTraceFrame {
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly commandIndex: number;
  readonly knots: readonly GridPoint[];
  readonly newlyVisitedTailCells: readonly GridPoint[];

  constructor(
    stepIndex: number,
    totalSteps: number,
    commandIndex: number,
    knots: readonly GridPoint[],
    newlyVisitedTailCells: readonly GridPoint[],
  ) {
    this.stepIndex = requireIntAtLeast(stepIndex, 0, 'stepIndex');
    this.totalSteps = requireIntAtLeast(totalSteps, 0, 'totalSteps');
    if (this.stepIndex > this.totalSteps) {
      throw new RangeError(`stepIndex (${this.stepIndex}) exceeds totalSteps (${this.totalSteps})`);
    }
    this.commandIndex = requireIntAtLeast(commandIndex, -1, 'commandIndex');
    if (knots.length === 0) throw new RangeError('RopeTraceFrame requires at least one knot');
    this.knots = Object.freeze([...knots]);
    this.newlyVisitedTailCells = Object.freeze([...newlyVisitedTailCells]);
    Object.freeze(this);
  }

  get head(): GridPoint { return this.knots[0]!; }
  get tail(): GridPoint { return this.knots[this.knots.length - 1]!; }
  get knotCount(): number { return this.knots.length; }
  get isComplete(): boolean { return this.stepIndex === this.totalSteps; }
  get newlyVisitedCount(): number { return this.newlyVisitedTailCells.length; }
}

interface TailVisitedTracker {
  mark(x: number, y: number): boolean;
  readonly count: number;
}

class DenseTailTracker implements TailVisitedTracker {
  private readonly minX: number;
  private readonly minY: number;
  private readonly width: number;
  private readonly cells: Uint8Array;
  private visitedCount = 0;

  constructor(bounds: GridBounds) {
    this.minX = bounds.minX;
    this.minY = bounds.minY;
    this.width = bounds.width;
    this.cells = new Uint8Array(bounds.area);
  }

  mark(x: number, y: number): boolean {
    const idx = (y - this.minY) * this.width + (x - this.minX);
    if (this.cells[idx]! === 1) return false;
    this.cells[idx] = 1;
    this.visitedCount += 1;
    return true;
  }

  get count(): number { return this.visitedCount; }
}

class SparseTailTracker implements TailVisitedTracker {
  private readonly seen = new Set<string>();

  mark(x: number, y: number): boolean {
    const key = `${x},${y}`;
    if (this.seen.has(key)) return false;
    this.seen.add(key);
    return true;
  }

  get count(): number { return this.seen.size; }
}

class RopeState {
  private readonly knotsX: Int32Array;
  private readonly knotsY: Int32Array;

  constructor(knotCount: number) {
    this.knotsX = new Int32Array(knotCount);
    this.knotsY = new Int32Array(knotCount);
  }

  step(dx: number, dy: number): void {
    this.knotsX[0] = this.knotsX[0]! + dx;
    this.knotsY[0] = this.knotsY[0]! + dy;
    for (let i = 1; i < this.knotsX.length; i += 1) {
      const ddx = this.knotsX[i - 1]! - this.knotsX[i]!;
      const ddy = this.knotsY[i - 1]! - this.knotsY[i]!;
      // Early-break: stationary knot leaves all trailing knots unmoved.
      if (Math.abs(ddx) <= 1 && Math.abs(ddy) <= 1) break;
      this.knotsX[i] = this.knotsX[i]! + Math.sign(ddx);
      this.knotsY[i] = this.knotsY[i]! + Math.sign(ddy);
    }
  }

  get tailX(): number { return this.knotsX[this.knotsX.length - 1]!; }
  get tailY(): number { return this.knotsY[this.knotsY.length - 1]!; }

  snapshot(): readonly GridPoint[] {
    const points: GridPoint[] = [];
    for (let i = 0; i < this.knotsX.length; i += 1) {
      points.push(new GridPoint(this.knotsX[i]!, this.knotsY[i]!));
    }
    return Object.freeze(points);
  }
}

function createTailTracker(plan: MotionPlan): TailVisitedTracker {
  const bounds = plan.computeBounds();
  return bounds.area <= DEFAULT_DENSE_CELL_LIMIT ? new DenseTailTracker(bounds) : new SparseTailTracker();
}

/** Counts unique lattice cells visited by the tail knot over a motion plan. */
export function countVisitedTailCells(plan: MotionPlan, knotCount: number): number {
  requireIntAtLeast(knotCount, 1, 'knotCount');
  const rope = new RopeState(knotCount);
  const tracker = createTailTracker(plan);
  tracker.mark(rope.tailX, rope.tailY);
  for (const cmd of plan.commands) {
    for (let s = 0; s < cmd.steps; s += 1) {
      rope.step(cmd.dx, cmd.dy);
      tracker.mark(rope.tailX, rope.tailY);
    }
  }
  return tracker.count;
}

function stepRopeAndMark(
  rope: RopeState,
  tracker: TailVisitedTracker,
  dx: number,
  dy: number,
  pending: GridPoint[],
): void {
  rope.step(dx, dy);
  if (tracker.mark(rope.tailX, rope.tailY)) pending.push(new GridPoint(rope.tailX, rope.tailY));
}

/** Simulates a motion plan and captures uniformly sampled frames with endpoint preservation. */
export function traceRopeBridge(plan: MotionPlan, knotCount: number, options?: TraceOptions): readonly RopeTraceFrame[] {
  requireIntAtLeast(knotCount, 1, 'knotCount');
  const sampled = sampleTraceIndices(plan.totalSteps + 1, validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS));
  const rope = new RopeState(knotCount);
  const tracker = createTailTracker(plan);
  const frames: RopeTraceFrame[] = [];
  const pending: GridPoint[] = [GridPoint.ORIGIN];
  let samplePtr = 0;
  let stepIndex = 0;
  tracker.mark(0, 0);
  if (sampled[0] === 0) {
    frames.push(new RopeTraceFrame(0, plan.totalSteps, -1, rope.snapshot(), pending));
    pending.length = 0;
    samplePtr = 1;
  }
  for (let cmdIdx = 0; cmdIdx < plan.commands.length; cmdIdx += 1) {
    const cmd = plan.commands[cmdIdx]!;
    for (let s = 0; s < cmd.steps; s += 1) {
      stepIndex += 1;
      stepRopeAndMark(rope, tracker, cmd.dx, cmd.dy, pending);
      if (sampled[samplePtr] === stepIndex) {
        frames.push(new RopeTraceFrame(stepIndex, plan.totalSteps, cmdIdx, rope.snapshot(), pending));
        pending.length = 0;
        samplePtr += 1;
      }
    }
  }
  return Object.freeze(frames);
}
