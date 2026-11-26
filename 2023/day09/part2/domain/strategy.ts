import type { ExtrapolationStrategy } from '../../shared';

/** Part 2 backward extrapolation strategy: subtracts the value below from each layer's leftmost value. */
export const BACKWARD_EXTRAPOLATION_STRATEGY: ExtrapolationStrategy = Object.freeze({
  direction: 'backward',
  label: 'Previous Value (Backward)',
  operatorSymbol: '-',
  anchorOf: (layer: readonly bigint[]): bigint => layer[0]!,
  combine: (anchor: bigint, below: bigint): bigint => anchor - below,
});
