import { describe, expect, it } from 'vitest';
import { EnhancementAlgorithm, TrenchImage, type PixelBit } from './types';

function makeBits(length: number, fill: PixelBit): Uint8Array {
  return new Uint8Array(length).fill(fill);
}

describe('EnhancementAlgorithm', () => {
  it('constructs a defensive copy, exposes void outputs, and looks up 9-bit indices', () => {
    const raw = makeBits(512, 0);
    raw[0] = 1;
    raw[34] = 1;
    const algo = new EnhancementAlgorithm(raw);
    raw[0] = 0;
    raw[511] = 1;

    expect(algo.darkVoidOutput).toBe(1);
    expect(algo.litVoidOutput).toBe(0);
    expect(algo.blinksBackground).toBe(true);
    expect(algo.nextBackground(0)).toBe(1);
    expect(algo.nextBackground(1)).toBe(0);
    expect(algo.lookup(0)).toBe(1);
    expect(algo.lookup(34)).toBe(1);
    expect(algo.lookup(511)).toBe(0);

    const copy = algo.copyTable();
    copy[34] = 0;
    expect(algo.lookup(34)).toBe(1);
  });

  it('reports non-blinking regimes accurately', () => {
    const sticky = new EnhancementAlgorithm(makeBits(512, 1));
    expect(sticky.blinksBackground).toBe(false);
    expect(sticky.nextBackground(0)).toBe(1);
    expect(sticky.nextBackground(1)).toBe(1);

    const darkAlways = makeBits(512, 0);
    darkAlways[511] = 1;
    const algo = new EnhancementAlgorithm(darkAlways);
    expect(algo.blinksBackground).toBe(false);
    expect(algo.nextBackground(0)).toBe(0);
    expect(algo.nextBackground(1)).toBe(1);
  });

  it('rejects invalid table lengths, invalid bit values, and out-of-range lookup indices', () => {
    expect(() => new EnhancementAlgorithm(makeBits(511, 0))).toThrow(RangeError);
    const badBit = makeBits(512, 0);
    badBit[12] = 2;
    expect(() => new EnhancementAlgorithm(badBit)).toThrow(RangeError);

    const algo = new EnhancementAlgorithm(makeBits(512, 0));
    expect(() => algo.lookup(-1)).toThrow(RangeError);
    expect(() => algo.lookup(512)).toThrow(RangeError);
    expect(() => algo.lookup(1.5)).toThrow(RangeError);
  });
});

describe('TrenchImage', () => {
  it('stores defensive pixel copy and computes lit pixel metrics', () => {
    const raw = new Uint8Array([1, 0, 0, 1, 1, 0]);
    const image = new TrenchImage(2, 3, raw, 0);
    raw[0] = 0;

    expect(image.height).toBe(2);
    expect(image.width).toBe(3);
    expect(image.background).toBe(0);
    expect(image.finiteLitCount).toBe(3);
    expect(image.hasInfiniteLitPixels).toBe(false);
    expect(image.totalLitPixels).toBe(3);
    expect(image.pixelAt(0, 0)).toBe(1);
    expect(image.pixelAt(1, 1)).toBe(1);
    expect(image.pixelAt(0, 1)).toBe(0);

    const copy = image.copyPixels();
    copy[0] = 0;
    expect(image.pixelAt(0, 0)).toBe(1);
  });

  it('returns background outside bounds and throws totalLitPixels when background is 1', () => {
    const image = new TrenchImage(2, 2, new Uint8Array([0, 1, 0, 0]), 1);
    expect(image.hasInfiniteLitPixels).toBe(true);
    expect(image.finiteLitCount).toBe(1);
    expect(() => image.totalLitPixels).toThrow(RangeError);

    expect(image.pixelAt(-1, 0)).toBe(1);
    expect(image.pixelAt(2, 0)).toBe(1);
    expect(image.pixelAt(0, -1)).toBe(1);
    expect(image.pixelAt(0, 2)).toBe(1);
  });

  it('rejects invalid dimensions, pixel lengths, background values, and pixel bits', () => {
    expect(() => new TrenchImage(0, 2, new Uint8Array(0), 0)).toThrow(RangeError);
    expect(() => new TrenchImage(1.5, 2, new Uint8Array(3), 0)).toThrow(RangeError);
    expect(() => new TrenchImage(2, 0, new Uint8Array(0), 0)).toThrow(RangeError);
    expect(() => new TrenchImage(2, 1.5, new Uint8Array(3), 0)).toThrow(RangeError);
    expect(() => new TrenchImage(2, 2, new Uint8Array(3), 0)).toThrow(RangeError);
    expect(() => new TrenchImage(1, 1, new Uint8Array([0]), 2 as PixelBit)).toThrow(RangeError);
    expect(() => new TrenchImage(1, 1, new Uint8Array([3]), 0)).toThrow(RangeError);
  });
});
