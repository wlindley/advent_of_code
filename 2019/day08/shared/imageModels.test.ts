import { describe, expect, it } from 'vitest';
import {
  CompositeImage,
  ImageDimensions,
  LayerDigitCounts,
  PART1_EXAMPLE_DIMENSIONS,
  PART2_EXAMPLE_DIMENSIONS,
  PIXEL_BLACK,
  PIXEL_TRANSPARENT,
  PIXEL_WHITE,
  STANDARD_IMAGE_DIMENSIONS,
  SpaceImage,
} from './imageModels';

describe('ImageDimensions & constants', () => {
  it('exposes canonical pixel and dimension constants', () => {
    expect(PIXEL_BLACK).toBe(0);
    expect(PIXEL_WHITE).toBe(1);
    expect(PIXEL_TRANSPARENT).toBe(2);
    expect(STANDARD_IMAGE_DIMENSIONS.equals(new ImageDimensions(25, 6))).toBe(true);
    expect(PART1_EXAMPLE_DIMENSIONS.equals(new ImageDimensions(3, 2))).toBe(true);
    expect(PART2_EXAMPLE_DIMENSIONS.equals(new ImageDimensions(2, 2))).toBe(true);
    expect(STANDARD_IMAGE_DIMENSIONS.layerSize).toBe(150);
    expect(Object.isFrozen(STANDARD_IMAGE_DIMENSIONS)).toBe(true);
  });

  it('validates positive dimensions and row/col bounds', () => {
    expect(() => new ImageDimensions(0, 2)).toThrow(RangeError);
    expect(() => new ImageDimensions(2, -1)).toThrow(RangeError);
    expect(() => new ImageDimensions(1.5, 2)).toThrow(RangeError);
    expect(() => new ImageDimensions(2, 2.5)).toThrow(RangeError);

    const dims = new ImageDimensions(3, 2);
    expect(dims.equals(new ImageDimensions(3, 3))).toBe(false);
    expect(dims.equals(new ImageDimensions(2, 2))).toBe(false);
    expect(dims.indexOf(1, 2)).toBe(5);
    expect(() => dims.indexOf(-1, 0)).toThrow(RangeError);
    expect(() => dims.indexOf(2, 0)).toThrow(RangeError);
    expect(() => dims.indexOf(0, -1)).toThrow(RangeError);
    expect(() => dims.indexOf(0, 3)).toThrow(RangeError);
    expect(() => dims.indexOf(0.5, 0)).toThrow(RangeError);
    expect(() => dims.indexOf(0, 0.5)).toThrow(RangeError);
  });
});

describe('LayerDigitCounts', () => {
  it('validates non-negative counts and computes checksum dynamically', () => {
    const counts = new LayerDigitCounts(1, 2, 3);
    expect(counts.zeros).toBe(1);
    expect(counts.ones).toBe(2);
    expect(counts.twos).toBe(3);
    expect(counts.checksum).toBe(6);
    expect(Object.isFrozen(counts)).toBe(true);

    expect(() => new LayerDigitCounts(-1, 0, 0)).toThrow(RangeError);
    expect(() => new LayerDigitCounts(0, -1, 0)).toThrow(RangeError);
    expect(() => new LayerDigitCounts(0, 0, -1)).toThrow(RangeError);
    expect(() => new LayerDigitCounts(0.5, 0, 0)).toThrow(RangeError);
  });
});

describe('SpaceImage', () => {
  it('parses digits, counts layers, and returns defensive pixel copies', () => {
    const image = SpaceImage.parse('  123456789012\n', PART1_EXAMPLE_DIMENSIONS);
    expect(Object.isFrozen(image)).toBe(true);
    expect(image.layerCount).toBe(2);
    expect(image.totalPixels).toBe(12);
    expect(image.pixelAt(0, 0, 0)).toBe(1);
    expect(image.pixelAt(1, 1, 2)).toBe(2);
    expect(image.layerCounts(0)).toEqual(new LayerDigitCounts(0, 1, 1));
    expect(image.layerCounts(1)).toEqual(new LayerDigitCounts(1, 1, 1));
    expect(image.allLayerCounts()).toHaveLength(2);

    const copy = image.copyLayerPixels(0);
    expect(Array.from(copy)).toEqual([1, 2, 3, 4, 5, 6]);
    copy[0] = 9;
    expect(image.pixelAt(0, 0, 0)).toBe(1);
  });

  it('rejects invalid inputs, bad framing, out-of-range bytes, and bad layer indices', () => {
    expect(() => SpaceImage.parse('   ', PART1_EXAMPLE_DIMENSIONS)).toThrow(Error);
    expect(() => SpaceImage.parse('12a456', PART1_EXAMPLE_DIMENSIONS)).toThrow(Error);
    expect(() => SpaceImage.parse('12/456', PART1_EXAMPLE_DIMENSIONS)).toThrow(Error);
    expect(() => SpaceImage.parse('12345', PART1_EXAMPLE_DIMENSIONS)).toThrow(RangeError);
    expect(() => new SpaceImage(PART1_EXAMPLE_DIMENSIONS, new Uint8Array(0))).toThrow(RangeError);
    expect(() => new SpaceImage(PART1_EXAMPLE_DIMENSIONS, new Uint8Array([0, 1, 2, 3, 4, 10]))).toThrow(RangeError);

    const raw = new Uint8Array([0, 1, 2, 0, 1, 2]);
    const image = new SpaceImage(PART1_EXAMPLE_DIMENSIONS, raw);
    raw[0] = 9;
    expect(image.pixelAt(0, 0, 0)).toBe(0);

    expect(() => image.pixelAt(-1, 0, 0)).toThrow(RangeError);
    expect(() => image.pixelAt(1, 0, 0)).toThrow(RangeError);
    expect(() => image.pixelAt(0.5, 0, 0)).toThrow(RangeError);
    expect(() => image.layerCounts(1)).toThrow(RangeError);
    expect(() => image.copyLayerPixels(1)).toThrow(RangeError);
  });
});

describe('CompositeImage', () => {
  it('validates pixels, computes resolution dynamically, and formats ASCII', () => {
    const input = new Uint8Array([0, 1, 1, 2]);
    const composite = new CompositeImage(PART2_EXAMPLE_DIMENSIONS, input);
    input[0] = 2;

    expect(Object.isFrozen(composite)).toBe(true);
    expect(composite.pixelAt(0, 0)).toBe(0);
    expect(composite.pixelAt(0, 1)).toBe(1);
    expect(composite.pixelAt(1, 1)).toBe(2);
    expect(composite.resolvedCount).toBe(3);
    expect(composite.isFullyResolved).toBe(false);
    expect(composite.toAsciiLines()).toEqual(['.#', '# ']);
    expect(composite.toString()).toBe('.#\n# ');

    const full = new CompositeImage(PART2_EXAMPLE_DIMENSIONS, new Uint8Array([0, 1, 1, 0]));
    expect(full.resolvedCount).toBe(4);
    expect(full.isFullyResolved).toBe(true);

    expect(() => new CompositeImage(PART2_EXAMPLE_DIMENSIONS, new Uint8Array([0, 1]))).toThrow(RangeError);
    expect(() => new CompositeImage(PART2_EXAMPLE_DIMENSIONS, new Uint8Array([0, 1, 2, 3]))).toThrow(RangeError);
  });
});
