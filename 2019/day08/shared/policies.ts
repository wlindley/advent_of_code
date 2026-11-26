import { decodeCompositeMessage } from './bitmapFont';
import { CompositeImage, PIXEL_TRANSPARENT, type SpaceImage } from './imageModels';

export type SpaceImagePolicyId = 'min-zero-checksum' | 'decoded-message';

/** Strategy interface for evaluating a parsed Space Image under Part 1 or Part 2 rules. */
export interface SpaceImagePolicy<TAnswer> {
  readonly id: SpaceImagePolicyId;
  readonly name: string;
  evaluate(image: SpaceImage): TAnswer;
  formatAnswer(answer: TAnswer): string;
}

/** Returns the earliest layer index with the strictly smallest count of `0` digits. */
export function findMinZeroLayerIndex(image: SpaceImage): number {
  let bestLayer = 0;
  let bestZeros = image.layerCounts(0).zeros;
  for (let layer = 1; layer < image.layerCount; layer += 1) {
    const zeros = image.layerCounts(layer).zeros;
    if (zeros < bestZeros) {
      bestZeros = zeros;
      bestLayer = layer;
    }
  }
  return bestLayer;
}

/** Composites front-to-back layers ({0, 1, 2}), stopping early once all pixels are opaque. */
export function compositeSpaceImage(image: SpaceImage): CompositeImage {
  const layerSize = image.dimensions.layerSize;
  const output = new Uint8Array(layerSize).fill(PIXEL_TRANSPARENT);
  let remaining = layerSize;

  for (let layer = 0; layer < image.layerCount; layer += 1) {
    const layerPixels = image.copyLayerPixels(layer);
    for (let i = 0; i < layerSize; i += 1) {
      const pixel = layerPixels[i]!;
      if (pixel > PIXEL_TRANSPARENT) {
        throw new RangeError(`Composite layer ${layer} pixel ${i} must be in {0, 1, 2}, got ${pixel}`);
      }
      if (output[i]! === PIXEL_TRANSPARENT && pixel !== PIXEL_TRANSPARENT) {
        output[i] = pixel;
        remaining -= 1;
      }
    }
    if (remaining === 0) return new CompositeImage(image.dimensions, output);
  }
  return new CompositeImage(image.dimensions, output);
}

/** Part 1 evaluation policy: `ones * twos` on the earliest minimum-zero layer. */
export const MIN_ZERO_CHECKSUM_POLICY: SpaceImagePolicy<number> = Object.freeze<SpaceImagePolicy<number>>({
  id: 'min-zero-checksum',
  name: 'Min-Zero Layer Checksum',
  evaluate: (image) => image.layerCounts(findMinZeroLayerIndex(image)).checksum,
  formatAnswer: (answer) => String(answer),
});

/** Part 2 evaluation policy: decode composited 5x6 bitmap message. */
export const DECODED_MESSAGE_POLICY: SpaceImagePolicy<string> = Object.freeze<SpaceImagePolicy<string>>({
  id: 'decoded-message',
  name: 'Decoded BIOS Message',
  evaluate: (image) => decodeCompositeMessage(compositeSpaceImage(image)),
  formatAnswer: (answer) => answer,
});
