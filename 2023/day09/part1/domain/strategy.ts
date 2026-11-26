import type { ExtrapolationStrategy } from '../../shared';

/** Part 1 forward extrapolation strategy: adds each layer's rightmost value to the value below. */
export const FORWARD_EXTRAPOLATION_STRATEGY: ExtrapolationStrategy = Object.freeze({
  direction: 'forward',
  label: 'Next Value (Forward)',
  operatorSymbol: '+',
  anchorOf: (layer: readonly bigint[]): bigint => layer[layer.length - 1]!,
  combine: (anchor: bigint, below: bigint): bigint => anchor + below,
});
