/** Direction of difference-pyramid extrapolation. */
export type ExtrapolationDirection = 'forward' | 'backward';

/** Arithmetic operator displayed between anchor and lower extrapolated term. */
export type ExtrapolationOperator = '+' | '-';

/**
 * Strategy defining how to anchor and combine values during bottom-up
 * extrapolation of a difference pyramid (forward for Part 1, backward for Part 2).
 */
export interface ExtrapolationStrategy {
  readonly direction: ExtrapolationDirection;
  readonly label: string;
  readonly operatorSymbol: ExtrapolationOperator;
  anchorOf(layer: readonly bigint[]): bigint;
  combine(anchor: bigint, below: bigint): bigint;
}

/**
 * Immutable result of extrapolating every layer of a `DifferencePyramid`.
 * `valuesByLayer[0]` is the extrapolated value for the original history.
 */
export class ExtrapolationResult {
  readonly valuesByLayer: readonly bigint[];

  constructor(valuesByLayer: readonly bigint[]) {
    if (valuesByLayer.length === 0) {
      throw new Error('ExtrapolationResult requires at least one layer value');
    }
    this.valuesByLayer = Object.freeze([...valuesByLayer]);
    Object.freeze(this);
  }

  /** Extrapolated value at the top (history) layer. */
  get value(): bigint {
    return this.valuesByLayer[0]!;
  }
}
