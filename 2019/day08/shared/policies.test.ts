import { describe, expect, it } from 'vitest';
import { CANONICAL_GLYPHS, GLYPH_HEIGHT, GLYPH_WIDTH } from './bitmapFont';
import {
  ImageDimensions,
  PART1_EXAMPLE_DIMENSIONS,
  PART2_EXAMPLE_DIMENSIONS,
  PIXEL_TRANSPARENT,
  STANDARD_IMAGE_DIMENSIONS,
  SpaceImage,
} from './imageModels';
import {
  compositeSpaceImage,
  DECODED_MESSAGE_POLICY,
  findMinZeroLayerIndex,
  MIN_ZERO_CHECKSUM_POLICY,
} from './policies';

function makePrng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function naiveMinZeroChecksum(raw: string, layerSize: number): number {
  let bestZeros = Infinity;
  let bestChecksum = 0;
  for (let i = 0; i < raw.length; i += layerSize) {
    const slice = raw.slice(i, i + layerSize);
    let zeros = 0, ones = 0, twos = 0;
    for (const ch of slice) {
      if (ch === '0') zeros += 1;
      else if (ch === '1') ones += 1;
      else if (ch === '2') twos += 1;
    }
    if (zeros < bestZeros) {
      bestZeros = zeros;
      bestChecksum = ones * twos;
    }
  }
  return bestChecksum;
}

function naiveVerticalRaycast(raw: string, layerSize: number): number[] {
  const layerCount = raw.length / layerSize;
  const out: number[] = [];
  for (let p = 0; p < layerSize; p += 1) {
    let resolved = PIXEL_TRANSPARENT;
    for (let layer = 0; layer < layerCount; layer += 1) {
      const val = Number(raw[layer * layerSize + p]!);
      if (val !== PIXEL_TRANSPARENT) {
        resolved = val;
        break;
      }
    }
    out.push(resolved);
  }
  return out;
}

describe('SpaceImage policies', () => {
  it('solves official Part 1 and Part 2 examples and breaks ties to earliest layer', () => {
    const p1 = SpaceImage.parse('123456789012', PART1_EXAMPLE_DIMENSIONS);
    expect(findMinZeroLayerIndex(p1)).toBe(0);
    expect(MIN_ZERO_CHECKSUM_POLICY.id).toBe('min-zero-checksum');
    expect(MIN_ZERO_CHECKSUM_POLICY.evaluate(p1)).toBe(1);
    expect(MIN_ZERO_CHECKSUM_POLICY.formatAnswer(1)).toBe('1');

    const tied = SpaceImage.parse('01210112', PART2_EXAMPLE_DIMENSIONS);
    expect(findMinZeroLayerIndex(tied)).toBe(0);

    const p2 = SpaceImage.parse('0222112222120000', PART2_EXAMPLE_DIMENSIONS);
    const comp = compositeSpaceImage(p2);
    expect([comp.pixelAt(0, 0), comp.pixelAt(0, 1), comp.pixelAt(1, 0), comp.pixelAt(1, 1)]).toEqual([0, 1, 1, 0]);
    expect(comp.isFullyResolved).toBe(true);
  });

  it('handles incomplete transparency, invalid composite pixels, and decodes 25x6 messages', () => {
    const partial = compositeSpaceImage(SpaceImage.parse('22222022', PART2_EXAMPLE_DIMENSIONS));
    expect(partial.isFullyResolved).toBe(false);
    expect(partial.pixelAt(0, 0)).toBe(2);
    expect(partial.pixelAt(0, 1)).toBe(0);

    expect(() => compositeSpaceImage(SpaceImage.parse('0123', PART2_EXAMPLE_DIMENSIONS))).toThrow(RangeError);

    const word = ['C', 'F', 'H', 'Y', 'Z'];
    const templates = word.map((ch) => CANONICAL_GLYPHS.find((g) => g.letter === ch)!);
    let layer0 = '';
    let layer1 = '';
    for (let r = 0; r < GLYPH_HEIGHT; r += 1) {
      for (const tpl of templates) {
        for (let c = 0; c < GLYPH_WIDTH; c += 1) {
          const bit = tpl.rows[r]![c]! === '#' ? '1' : '0';
          layer0 += (r + c) % 2 === 0 ? '2' : bit;
          layer1 += bit;
        }
      }
    }
    const img = SpaceImage.parse(layer0 + layer1, STANDARD_IMAGE_DIMENSIONS);
    expect(DECODED_MESSAGE_POLICY.id).toBe('decoded-message');
    expect(DECODED_MESSAGE_POLICY.evaluate(img)).toBe('CFHYZ');
    expect(DECODED_MESSAGE_POLICY.formatAnswer('CFHYZ')).toBe('CFHYZ');
  });

  it('matches naive reference oracles across 50 seeded random cases', () => {
    const rand = makePrng(201908);
    for (let tc = 0; tc < 50; tc += 1) {
      const width = 1 + Math.floor(rand() * 6);
      const height = 1 + Math.floor(rand() * 5);
      const layers = 1 + Math.floor(rand() * 8);
      const dims = new ImageDimensions(width, height);
      const total = dims.layerSize * layers;

      let rawPart1 = '';
      let rawPart2 = '';
      for (let i = 0; i < total; i += 1) {
        rawPart1 += String(Math.floor(rand() * 10));
        rawPart2 += String(Math.floor(rand() * 3));
      }

      const img1 = SpaceImage.parse(rawPart1, dims);
      expect(MIN_ZERO_CHECKSUM_POLICY.evaluate(img1)).toBe(naiveMinZeroChecksum(rawPart1, dims.layerSize));

      const img2 = SpaceImage.parse(rawPart2, dims);
      const comp = compositeSpaceImage(img2);
      const actualPixels: number[] = [];
      for (let r = 0; r < height; r += 1) {
        for (let c = 0; c < width; c += 1) actualPixels.push(comp.pixelAt(r, c));
      }
      expect(actualPixels).toEqual(naiveVerticalRaycast(rawPart2, dims.layerSize));
    }
  });
});
