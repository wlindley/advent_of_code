import { describe, expect, it } from 'vitest';
import { ImageDimensions, LayerDigitCounts, STANDARD_IMAGE_DIMENSIONS } from './imageModels';
import { computeGridLayout, computeHistogramBars } from './vizLayout';

describe('vizLayout', () => {
  it('computes bounded SVG grid layout coordinates for small and standard dimensions', () => {
    const small = computeGridLayout(new ImageDimensions(3, 2));
    expect(Object.isFrozen(small)).toBe(true);
    expect(small.cellSize).toBe(36);
    expect(small.svgWidth).toBe(small.padding * 2 + 3 * small.cellSize + 2 * small.gap);
    expect(small.svgHeight).toBe(small.padding * 2 + 2 * small.cellSize + small.gap);

    const standard = computeGridLayout(STANDARD_IMAGE_DIMENSIONS);
    expect(standard.cellSize).toBe(15);
    expect(standard.svgWidth).toBe(standard.padding * 2 + 25 * 15 + 24 * standard.gap);
  });

  it('computes stacked histogram bars, handles zero-max safely, and rejects empty counts', () => {
    expect(() => computeHistogramBars([], 0, 0)).toThrow(RangeError);

    const zeroOnly = computeHistogramBars([new LayerDigitCounts(0, 0, 0)], 0, 0);
    expect(Object.isFrozen(zeroOnly)).toBe(true);
    expect(zeroOnly.maxZeros).toBe(1);
    expect(zeroOnly.bars[0]!.zeroRatio).toBe(0);
    expect(zeroOnly.bars[0]!.zeroHeight).toBe(0);

    const layout = computeHistogramBars(
      [new LayerDigitCounts(2, 2, 2), new LayerDigitCounts(1, 3, 2), new LayerDigitCounts(4, 1, 1)],
      2,
      1,
    );
    expect(layout.maxZeros).toBe(4);
    expect(layout.bars).toHaveLength(3);
    expect(layout.bars[1]!.isBest).toBe(true);
    expect(layout.bars[1]!.isActive).toBe(false);
    expect(layout.bars[2]!.isActive).toBe(true);
    expect(layout.bars[2]!.isBest).toBe(false);
    expect(layout.bars[2]!.zeroRatio).toBe(1);
    const b0 = layout.bars[0]!;
    expect(b0.zeroHeight + b0.oneHeight + b0.twoHeight).toBeCloseTo(layout.plotHeight);
    expect(b0.twoY).toBeCloseTo(layout.plotTop);
  });
});
