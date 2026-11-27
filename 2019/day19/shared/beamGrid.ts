/** 2D integer coordinate in the tractor beam grid. */
export interface BeamPoint {
  readonly x: number;
  readonly y: number;
}

/** Inclusive horizontal span `[left, right]` of pulled coordinates on row `y`. */
export interface RowSpan {
  readonly y: number;
  readonly left: number;
  readonly right: number;
}

/** Computes total pulled points across a list of optional row spans. */
export function countAffectedSpans(spans: readonly (RowSpan | null)[]): number {
  let total = 0;
  for (const span of spans) {
    if (span !== null) {
      total += span.right - span.left + 1;
    }
  }
  return total;
}

function freezeValidatedSpan(span: RowSpan | null, index: number, size: number): RowSpan | null {
  if (span === null) {
    return null;
  }
  if (
    span.y !== index ||
    !Number.isInteger(span.left) ||
    !Number.isInteger(span.right) ||
    span.left < 0 ||
    span.right < span.left ||
    span.right >= size
  ) {
    throw new RangeError(`Invalid span at row ${index}: [${span.left}, ${span.right}]`);
  }
  return Object.freeze({ y: span.y, left: span.left, right: span.right });
}

/**
 * Immutable square tractor beam grid backed solely by per-row inclusive spans.
 * Derived properties (`size`, `affectedCount`) are computed dynamically without duplicate storage.
 */
export class BeamGrid {
  private readonly rowSpans: readonly (RowSpan | null)[];

  constructor(rowSpans: readonly (RowSpan | null)[]) {
    const size = rowSpans.length;
    if (size < 1) {
      throw new RangeError(`BeamGrid requires at least 1 row, got ${size}`);
    }
    const frozen = rowSpans.map((span, index) => freezeValidatedSpan(span, index, size));
    this.rowSpans = Object.freeze(frozen);
    Object.freeze(this);
  }

  get size(): number {
    return this.rowSpans.length;
  }

  get affectedCount(): number {
    return countAffectedSpans(this.rowSpans);
  }

  isPulled(x: number, y: number): boolean {
    if (
      !Number.isInteger(x) ||
      !Number.isInteger(y) ||
      x < 0 ||
      y < 0 ||
      x >= this.rowSpans.length ||
      y >= this.rowSpans.length
    ) {
      return false;
    }
    const span = this.rowSpans[y]!;
    return span !== null && x >= span.left && x <= span.right;
  }

  rowSpan(y: number): RowSpan | null {
    if (!Number.isInteger(y) || y < 0 || y >= this.rowSpans.length) {
      throw new RangeError(`Row index y=${y} out of bounds [0, ${this.rowSpans.length - 1}]`);
    }
    return this.rowSpans[y]!;
  }

  spans(): readonly (RowSpan | null)[] {
    return this.rowSpans;
  }
}
