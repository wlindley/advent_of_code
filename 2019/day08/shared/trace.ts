import { sampleTraceIndices, type TraceOptions, validateMaxSteps } from '../../../shared/core';
import { isFontCompatible, tryDecodeComposite } from './bitmapFont';
import { CompositeImage, type ImageDimensions, type LayerDigitCounts, PIXEL_TRANSPARENT, type SpaceImage } from './imageModels';

export const DEFAULT_MAX_TRACE_FRAMES = 100;

interface FrameSnapshot {
  readonly layerIndex: number;
  readonly totalLayers: number;
  readonly dimensions: ImageDimensions;
  readonly layerCounts: LayerDigitCounts;
  readonly bestLayerIndex: number;
  readonly bestLayerCounts: LayerDigitCounts;
  readonly currentLayerPixels: Uint8Array;
  readonly compositePixels: Uint8Array;
  readonly resolvedByLayer: Int32Array;
}

/** Immutable per-layer snapshot of Space Image evaluation and progressive compositing. */
export class SpaceImageTraceFrame {
  readonly layerIndex: number;
  readonly totalLayers: number;
  readonly dimensions: ImageDimensions;
  readonly layerCounts: LayerDigitCounts;
  readonly bestLayerIndex: number;
  readonly bestLayerCounts: LayerDigitCounts;
  private readonly currentLayerPixels: Uint8Array;
  private readonly compositePixels: Uint8Array;
  private readonly resolvedByLayer: Int32Array;

  constructor(snapshot: FrameSnapshot) {
    this.layerIndex = snapshot.layerIndex;
    this.totalLayers = snapshot.totalLayers;
    this.dimensions = snapshot.dimensions;
    this.layerCounts = snapshot.layerCounts;
    this.bestLayerIndex = snapshot.bestLayerIndex;
    this.bestLayerCounts = snapshot.bestLayerCounts;
    this.currentLayerPixels = snapshot.currentLayerPixels;
    this.compositePixels = snapshot.compositePixels;
    this.resolvedByLayer = snapshot.resolvedByLayer;
    Object.freeze(this);
  }

  get resolvedPixelCount(): number {
    let count = 0;
    for (let i = 0; i < this.resolvedByLayer.length; i += 1) {
      if (this.resolvedByLayer[i]! !== -1) count += 1;
    }
    return count;
  }

  get unresolvedPixelCount(): number { return this.dimensions.layerSize - this.resolvedPixelCount; }
  get completionRatio(): number { return this.resolvedPixelCount / this.dimensions.layerSize; }
  get isNewBest(): boolean { return this.bestLayerIndex === this.layerIndex; }

  get newlyResolvedCount(): number {
    let count = 0;
    for (let i = 0; i < this.resolvedByLayer.length; i += 1) {
      if (this.resolvedByLayer[i]! === this.layerIndex) count += 1;
    }
    return count;
  }

  get bestChecksum(): number { return this.bestLayerCounts.checksum; }
  get isFinalLayer(): boolean { return this.layerIndex === this.totalLayers - 1; }

  get decodedSlots(): readonly (string | null)[] | null {
    if (!isFontCompatible(this.dimensions)) return null;
    const binary = new Uint8Array(this.compositePixels.length);
    for (let i = 0; i < this.compositePixels.length; i += 1) {
      const value = this.compositePixels[i]!;
      binary[i] = value > PIXEL_TRANSPARENT ? PIXEL_TRANSPARENT : value;
    }
    return tryDecodeComposite(new CompositeImage(this.dimensions, binary));
  }

  currentPixelAt(row: number, col: number): number {
    return this.currentLayerPixels[this.dimensions.indexOf(row, col)]!;
  }
  compositePixelAt(row: number, col: number): number {
    return this.compositePixels[this.dimensions.indexOf(row, col)]!;
  }
  isNewlyResolvedAt(row: number, col: number): boolean {
    return this.resolvedByLayer[this.dimensions.indexOf(row, col)]! === this.layerIndex;
  }
}

function applyLayerToComposite(
  layerPixels: Uint8Array, layerIndex: number, compositePixels: Uint8Array, resolvedByLayer: Int32Array,
): void {
  for (let i = 0; i < layerPixels.length; i += 1) {
    const pixel = layerPixels[i]!;
    if (resolvedByLayer[i]! === -1 && pixel !== PIXEL_TRANSPARENT) {
      compositePixels[i] = pixel; resolvedByLayer[i] = layerIndex;
    }
  }
}

/** Builds a bounded sampled trace of progressive Space Image layer compositing. */
export function buildSpaceImageTrace(image: SpaceImage, options?: TraceOptions): readonly SpaceImageTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_FRAMES);
  const sampled = sampleTraceIndices(image.layerCount, limit);
  const layerSize = image.dimensions.layerSize;
  const compositePixels = new Uint8Array(layerSize).fill(PIXEL_TRANSPARENT);
  const resolvedByLayer = new Int32Array(layerSize).fill(-1);
  let bestLayerIndex = 0;
  let bestLayerCounts = image.layerCounts(0);
  let sampleCursor = 0;
  const frames: SpaceImageTraceFrame[] = [];

  for (let layer = 0; layer < image.layerCount; layer += 1) {
    const layerCounts = image.layerCounts(layer);
    if (layerCounts.zeros < bestLayerCounts.zeros) {
      bestLayerIndex = layer;
      bestLayerCounts = layerCounts;
    }
    const currentLayerPixels = image.copyLayerPixels(layer);
    applyLayerToComposite(currentLayerPixels, layer, compositePixels, resolvedByLayer);
    if (sampled[sampleCursor] === layer) {
      frames.push(new SpaceImageTraceFrame({
        layerIndex: layer,
        totalLayers: image.layerCount,
        dimensions: image.dimensions,
        layerCounts,
        bestLayerIndex,
        bestLayerCounts,
        currentLayerPixels,
        compositePixels: new Uint8Array(compositePixels),
        resolvedByLayer: new Int32Array(resolvedByLayer),
      }));
      sampleCursor += 1;
    }
  }
  return Object.freeze(frames);
}
