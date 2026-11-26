import { describe, expect, it } from 'vitest';
import { CANONICAL_GLYPHS, GLYPH_HEIGHT, GLYPH_WIDTH } from './bitmapFont';
import {
  PART1_EXAMPLE_DIMENSIONS,
  PART2_EXAMPLE_DIMENSIONS,
  STANDARD_IMAGE_DIMENSIONS,
  SpaceImage,
} from './imageModels';
import { buildSpaceImageTrace, DEFAULT_MAX_TRACE_FRAMES } from './trace';

describe('buildSpaceImageTrace', () => {
  it('traces layer progression, min-zero best updates, and newly resolved highlights', () => {
    const img = SpaceImage.parse('123456789012', PART1_EXAMPLE_DIMENSIONS);
    const frames = buildSpaceImageTrace(img);

    expect(DEFAULT_MAX_TRACE_FRAMES).toBe(100);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames).toHaveLength(2);

    const f0 = frames[0]!;
    expect(Object.isFrozen(f0)).toBe(true);
    expect(f0.layerIndex).toBe(0);
    expect(f0.totalLayers).toBe(2);
    expect(f0.bestLayerIndex).toBe(0);
    expect(f0.isNewBest).toBe(true);
    expect(f0.bestChecksum).toBe(1);
    expect(f0.resolvedPixelCount).toBe(5);
    expect(f0.unresolvedPixelCount).toBe(1);
    expect(f0.completionRatio).toBeCloseTo(5 / 6);
    expect(f0.newlyResolvedCount).toBe(5);
    expect(f0.isFinalLayer).toBe(false);
    expect(f0.decodedSlots).toBeNull();
    expect(f0.currentPixelAt(0, 0)).toBe(1);
    expect(f0.compositePixelAt(0, 1)).toBe(2);
    expect(f0.isNewlyResolvedAt(0, 0)).toBe(true);
    expect(f0.isNewlyResolvedAt(0, 1)).toBe(false);

    const f1 = frames[1]!;
    expect(f1.layerIndex).toBe(1);
    expect(f1.bestLayerIndex).toBe(0);
    expect(f1.isNewBest).toBe(false);
    expect(f1.resolvedPixelCount).toBe(6);
    expect(f1.unresolvedPixelCount).toBe(0);
    expect(f1.newlyResolvedCount).toBe(1);
    expect(f1.isFinalLayer).toBe(true);
    expect(f1.compositePixelAt(0, 1)).toBe(8);
    expect(f1.isNewlyResolvedAt(0, 1)).toBe(true);
    expect(f1.isNewlyResolvedAt(0, 0)).toBe(false);
  });

  it('updates bestLayerIndex when a later layer has fewer zeros and samples bounded frames', () => {
    const layers = ['0000', '0012', '0112', '1111', '2222'];
    const img = SpaceImage.parse(layers.join(''), PART2_EXAMPLE_DIMENSIONS);

    const full = buildSpaceImageTrace(img);
    expect(full).toHaveLength(5);
    expect(full[3]!.bestLayerIndex).toBe(3);
    expect(full[3]!.isNewBest).toBe(true);
    expect(full[3]!.bestChecksum).toBe(0);

    const sampled = buildSpaceImageTrace(img, { maxSteps: 3 });
    expect(sampled.map((f) => f.layerIndex)).toEqual([0, 2, 4]);
    expect(sampled[0]!.isFinalLayer).toBe(false);
    expect(sampled[2]!.isFinalLayer).toBe(true);

    expect(() => buildSpaceImageTrace(img, { maxSteps: 0 })).toThrow(RangeError);
  });

  it('exposes decodedSlots on 25x6 images and tolerates digits 3..9', () => {
    const word = ['A', 'B', 'C', 'E', 'F'];
    const templates = word.map((ch) => CANONICAL_GLYPHS.find((g) => g.letter === ch)!);
    let layer0 = '';
    for (let r = 0; r < GLYPH_HEIGHT; r += 1) {
      for (const tpl of templates) {
        for (let c = 0; c < GLYPH_WIDTH; c += 1) {
          layer0 += tpl.rows[r]![c]! === '#' ? '1' : '0';
        }
      }
    }
    const img = SpaceImage.parse(layer0, STANDARD_IMAGE_DIMENSIONS);
    const frames = buildSpaceImageTrace(img);
    expect(frames[0]!.decodedSlots).toEqual(['A', 'B', 'C', 'E', 'F']);

    const nonBinary = SpaceImage.parse('3'.repeat(150), STANDARD_IMAGE_DIMENSIONS);
    expect(buildSpaceImageTrace(nonBinary)[0]!.decodedSlots).toEqual([null, null, null, null, null]);
  });
});
