import { DotSheet, FoldInstruction, type Dot, type FoldAxis } from './models';

interface AxisAdapter {
  coordinate(dot: Dot): number;
  withCoordinate(dot: Dot, value: number): Dot;
}

const AXIS_ADAPTERS: Readonly<Record<FoldAxis, AxisAdapter>> = Object.freeze({
  x: Object.freeze({
    coordinate: (dot: Dot): number => dot.x,
    withCoordinate: (dot: Dot, value: number): Dot => Object.freeze({ x: value, y: dot.y }),
  }),
  y: Object.freeze({
    coordinate: (dot: Dot): number => dot.y,
    withCoordinate: (dot: Dot, value: number): Dot => Object.freeze({ x: dot.x, y: value }),
  }),
});

/** Immutable result of folding a `DotSheet` along one orthogonal crease. */
export class FoldOutcome {
  readonly sheet: DotSheet;
  readonly fold: FoldInstruction;
  readonly stationaryDots: readonly Dot[];
  readonly reflectedDots: readonly Dot[];
  readonly mergedDots: readonly Dot[];

  constructor(
    sheet: DotSheet,
    fold: FoldInstruction,
    stationaryDots: readonly Dot[],
    reflectedDots: readonly Dot[],
    mergedDots: readonly Dot[],
  ) {
    this.sheet = sheet;
    this.fold = fold;
    this.stationaryDots = Object.freeze([...stationaryDots]);
    this.reflectedDots = Object.freeze([...reflectedDots]);
    this.mergedDots = Object.freeze([...mergedDots]);
    Object.freeze(this);
  }

  get overlapCount(): number {
    return this.mergedDots.length;
  }
}

/** Applies a single orthogonal fold instruction, tracking stationary, reflected, and merged dots. */
export function applyFold(sheet: DotSheet, fold: FoldInstruction): FoldOutcome {
  const adapter = AXIS_ADAPTERS[fold.axis];
  const stationary: Dot[] = [];
  const reflected: Dot[] = [];
  const merged: Dot[] = [];
  const nextDots: Dot[] = [];

  for (const dot of sheet.dots) {
    const coord = adapter.coordinate(dot);
    if (coord === fold.value) throw new RangeError(`Dot (${dot.x}, ${dot.y}) lies on fold ${fold.axis}=${fold.value}`);
    if (coord < fold.value) {
      stationary.push(dot);
      nextDots.push(dot);
      continue;
    }
    const mirrored = fold.value - (coord - fold.value);
    if (mirrored < 0) throw new RangeError(`Fold ${fold.axis}=${fold.value} reflects dot (${dot.x}, ${dot.y}) < 0`);
    const moved = adapter.withCoordinate(dot, mirrored);
    reflected.push(moved);
    nextDots.push(moved);
    // Reflection on coord > fold.value is injective, so merges only occur with stationary dots.
    if (sheet.hasDot(moved.x, moved.y)) merged.push(moved);
  }

  return new FoldOutcome(new DotSheet(nextDots), fold, stationary, reflected, merged);
}

/** Applies the first `count` fold instructions sequentially to `sheet`. */
export function applyFolds(sheet: DotSheet, folds: readonly FoldInstruction[], count: number): DotSheet {
  if (!Number.isInteger(count) || count < 0 || count > folds.length) {
    throw new RangeError(`Fold count must be an integer in [0, ${folds.length}], got ${count}`);
  }
  let current = sheet;
  for (let i = 0; i < count; i += 1) {
    current = applyFold(current, folds[i]!).sheet;
  }
  return current;
}
