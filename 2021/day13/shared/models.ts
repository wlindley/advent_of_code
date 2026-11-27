/** Immutable 2D dot coordinate on the transparent origami paper. */
export interface Dot {
  readonly x: number;
  readonly y: number;
}

/** Orthogonal fold crease axis. */
export type FoldAxis = 'x' | 'y';

function assertSafeInt(value: number, label: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${label} must be a safe integer, got ${value}`);
  }
}

/** Row-major (y, x) comparator for canonical dot ordering and binary search. */
export function compareDots(a: Dot, b: Dot): number {
  return a.y !== b.y ? a.y - b.y : a.x - b.x;
}

function normalizeDots(dots: readonly Dot[]): readonly Dot[] {
  if (dots.length === 0) throw new Error('DotSheet requires at least one dot');
  const sorted = dots.map((dot) => {
    assertSafeInt(dot.x, 'Dot x');
    assertSafeInt(dot.y, 'Dot y');
    if (dot.x < 0 || dot.y < 0) throw new RangeError(`Dot coordinates must be non-negative: (${dot.x}, ${dot.y})`);
    return Object.freeze({ x: dot.x, y: dot.y });
  });
  sorted.sort(compareDots);
  const unique: Dot[] = [sorted[0]!];
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = unique[unique.length - 1]!;
    const curr = sorted[i]!;
    if (curr.x !== prev.x || curr.y !== prev.y) unique.push(curr);
  }
  return Object.freeze(unique);
}

function computeBounds(dots: readonly Dot[]): DotBounds {
  let minX = dots[0]!.x;
  let maxX = minX;
  for (let i = 1; i < dots.length; i += 1) {
    const x = dots[i]!.x;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
  }
  return new DotBounds(minX, maxX, dots[0]!.y, dots[dots.length - 1]!.y);
}

/** Inclusive bounding box of a non-empty `DotSheet` with dynamic dimensions. */
export class DotBounds {
  constructor(
    readonly minX: number,
    readonly maxX: number,
    readonly minY: number,
    readonly maxY: number,
  ) {
    assertSafeInt(minX, 'minX');
    assertSafeInt(maxX, 'maxX');
    assertSafeInt(minY, 'minY');
    assertSafeInt(maxY, 'maxY');
    if (minX > maxX || minY > maxY) throw new RangeError('Bounds require min <= max on both axes');
    Object.freeze(this);
  }

  get width(): number {
    return this.maxX - this.minX + 1;
  }

  get height(): number {
    return this.maxY - this.minY + 1;
  }
}

/** Validated orthogonal fold instruction (`fold along axis=value`). */
export class FoldInstruction {
  constructor(
    readonly axis: FoldAxis,
    readonly value: number,
  ) {
    if (axis !== 'x' && axis !== 'y') throw new Error(`Invalid fold axis: ${String(axis)}`);
    assertSafeInt(value, 'Fold value');
    if (value < 1) throw new RangeError(`Fold value must be >= 1, got ${value}`);
    Object.freeze(this);
  }
}

/** Immutable, sorted, deduplicated collection of dots on transparent paper. */
export class DotSheet {
  readonly dots: readonly Dot[];

  constructor(dots: readonly Dot[]) {
    this.dots = normalizeDots(dots);
    Object.freeze(this);
  }

  get dotCount(): number {
    return this.dots.length;
  }

  get bounds(): DotBounds {
    return computeBounds(this.dots);
  }

  hasDot(x: number, y: number): boolean {
    let low = 0;
    let high = this.dots.length - 1;
    while (low <= high) {
      const mid = (low + high) >>> 1;
      const dot = this.dots[mid]!;
      const cmp = y !== dot.y ? y - dot.y : x - dot.x;
      if (cmp === 0) return true;
      if (cmp < 0) high = mid - 1;
      else low = mid + 1;
    }
    return false;
  }
}

/** Parsed origami manual containing initial dot coordinates and fold sequence. */
export class OrigamiManual {
  readonly initialSheet: DotSheet;
  readonly folds: readonly FoldInstruction[];

  constructor(initialSheet: DotSheet, folds: readonly FoldInstruction[]) {
    if (folds.length === 0) throw new Error('OrigamiManual requires at least one fold instruction');
    this.initialSheet = initialSheet;
    this.folds = Object.freeze([...folds]);
    Object.freeze(this);
  }

  get foldCount(): number {
    return this.folds.length;
  }
}
