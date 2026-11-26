import { ExtrapolationResult, type ExtrapolationStrategy } from './strategy';

/** Returns true iff every element in `row` equals `0n`. */
export function isAllZero(row: readonly bigint[]): boolean {
  return row.every((value) => value === 0n);
}

/** Computes adjacent forward differences (`row[i + 1] - row[i]`) for a row of length >= 2. */
export function computeDifferences(row: readonly bigint[]): readonly bigint[] {
  if (row.length < 2) {
    throw new Error('computeDifferences requires at least 2 values');
  }
  const diffs: bigint[] = [];
  for (let i = 0; i < row.length - 1; i += 1) {
    diffs.push(row[i + 1]! - row[i]!);
  }
  return Object.freeze(diffs);
}

/**
 * Immutable finite-difference pyramid built from a single integer history
 * down to its terminating all-zero layer.
 */
export class DifferencePyramid {
  readonly layers: readonly (readonly bigint[])[];

  private constructor(layers: readonly (readonly bigint[])[]) {
    this.layers = layers;
    Object.freeze(this);
  }

  /** Constructs a `DifferencePyramid`, validating non-emptiness and convergence. */
  static fromHistory(history: readonly bigint[]): DifferencePyramid {
    if (history.length === 0) {
      throw new Error('History must contain at least one integer');
    }
    let current: readonly bigint[] = Object.freeze([...history]);
    const layers: (readonly bigint[])[] = [current];
    while (!isAllZero(current)) {
      if (current.length === 1) {
        // A non-zero singleton cannot yield a non-empty zero difference row.
        throw new Error('History does not converge to an all-zero difference layer');
      }
      current = computeDifferences(current);
      layers.push(current);
    }
    return new DifferencePyramid(Object.freeze(layers));
  }

  /** Original input history (layer 0). */
  get history(): readonly bigint[] {
    return this.layers[0]!;
  }

  /** Total number of layers including the terminating all-zero row. */
  get depth(): number {
    return this.layers.length;
  }

  /** Polynomial degree inferred from difference depth (`0` for constant/zero sequences). */
  get degree(): number {
    return Math.max(0, this.layers.length - 2);
  }

  /** Number of entries in the original history. */
  get length(): number {
    return this.layers[0]!.length;
  }

  /** Rightmost value of every layer from top to bottom. */
  get rightEdge(): readonly bigint[] {
    return Object.freeze(this.layers.map((layer) => layer[layer.length - 1]!));
  }

  /** Leftmost value of every layer from top to bottom. */
  get leftEdge(): readonly bigint[] {
    return Object.freeze(this.layers.map((layer) => layer[0]!));
  }

  /** Folds bottom-up from the zero base layer using `strategy`. */
  extrapolate(strategy: ExtrapolationStrategy): ExtrapolationResult {
    const values = new Array<bigint>(this.layers.length);
    values[this.layers.length - 1] = 0n;
    for (let i = this.layers.length - 2; i >= 0; i -= 1) {
      const anchor = strategy.anchorOf(this.layers[i]!);
      values[i] = strategy.combine(anchor, values[i + 1]!);
    }
    return new ExtrapolationResult(values);
  }
}
