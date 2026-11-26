import { describe, expect, it } from 'vitest';
import {
  CANONICAL_GLYPHS,
  compositeSpaceImage,
  GLYPH_HEIGHT,
  GLYPH_WIDTH,
  type GlyphTemplate,
  PART2_EXAMPLE_DIMENSIONS,
  SpaceImage,
  STANDARD_IMAGE_DIMENSIONS,
} from '../../shared';
import { solver } from './index';

const LAYER_SIZE = STANDARD_IMAGE_DIMENSIONS.layerSize;
const SLOTS_PER_ROW = STANDARD_IMAGE_DIMENSIONS.width / GLYPH_WIDTH;

function nextSeed(seed: number): number {
  return (Math.imul(seed, 1664525) + 1013904223) >>> 0;
}

function encodeGlyphLayers(glyphs: readonly GlyphTemplate[], layers: number): string {
  let out = '';
  for (let layer = 0; layer < layers; layer += 1) {
    for (let row = 0; row < GLYPH_HEIGHT; row += 1) {
      for (let slot = 0; slot < SLOTS_PER_ROW; slot += 1) {
        const line = glyphs[slot]!.rows[row]!;
        const reveal = (slot + row) % layers;
        for (let col = 0; col < GLYPH_WIDTH; col += 1) {
          const white = line[col] === '#';
          out += layer < reveal ? '2' : layer === reveal ? (white ? '1' : '0') : white ? '0' : '1';
        }
      }
    }
  }
  return out;
}

function generateSeededCase(seedStart: number): { readonly raw: string; readonly seed: number } {
  let seed = seedStart;
  const glyphs: GlyphTemplate[] = [];
  for (let s = 0; s < SLOTS_PER_ROW; s += 1) {
    seed = nextSeed(seed);
    glyphs.push(CANONICAL_GLYPHS[seed % CANONICAL_GLYPHS.length]!);
  }
  seed = nextSeed(seed);
  const layers = 2 + (seed % 7);
  const grid = Array.from({ length: layers }, () => new Array<string>(LAYER_SIZE).fill('2'));
  for (let row = 0; row < GLYPH_HEIGHT; row += 1) {
    for (let slot = 0; slot < SLOTS_PER_ROW; slot += 1) {
      const line = glyphs[slot]!.rows[row]!;
      for (let col = 0; col < GLYPH_WIDTH; col += 1) {
        seed = nextSeed(seed);
        const reveal = seed % layers;
        const idx = row * STANDARD_IMAGE_DIMENSIONS.width + slot * GLYPH_WIDTH + col;
        grid[reveal]![idx] = line[col] === '#' ? '1' : '0';
        for (let l = reveal + 1; l < layers; l += 1) {
          seed = nextSeed(seed);
          grid[l]![idx] = String(seed % 3);
        }
      }
    }
  }
  return { raw: grid.map((layer) => layer.join('')).join(''), seed };
}

function raycastOracleDecode(raw: string): string {
  const layers = raw.length / LAYER_SIZE;
  const rows: string[] = [];
  for (let r = 0; r < GLYPH_HEIGHT; r += 1) {
    let line = '';
    for (let c = 0; c < STANDARD_IMAGE_DIMENSIONS.width; c += 1) {
      let ch = ' ';
      for (let layer = 0; layer < layers; layer += 1) {
        const digit = raw[layer * LAYER_SIZE + r * STANDARD_IMAGE_DIMENSIONS.width + c]!;
        if (digit !== '2') {
          ch = digit === '1' ? '#' : '.';
          break;
        }
      }
      line += ch;
    }
    rows.push(line);
  }
  let word = '';
  for (let slot = 0; slot < SLOTS_PER_ROW; slot += 1) {
    const start = slot * GLYPH_WIDTH;
    const slotRows = rows.map((row) => row.slice(start, start + GLYPH_WIDTH));
    const match = CANONICAL_GLYPHS.find((g) => g.rows.every((line, r) => line === slotRows[r]));
    if (!match) throw new Error(`Oracle failed on slot ${slot}`);
    word += match.letter;
  }
  return word;
}

describe('2019 Day 8 Part 2 domain solver', () => {
  it('composites the official 2x2 example and rejects non-25x6 solver input', () => {
    const composite = compositeSpaceImage(SpaceImage.parse('0222112222120000', PART2_EXAMPLE_DIMENSIONS));
    const pixels = [0, 1].flatMap((r) => [0, 1].map((c) => composite.pixelAt(r, c)));

    expect(pixels).toEqual([0, 1, 1, 0]);
    expect(composite.toString()).toBe('.#\n#.');
    expect(composite.isFullyResolved).toBe(true);
    expect(() => solver.parse('0222112222120000')).toThrow(RangeError);
  });

  it('decodes all 20 canonical templates across all 18 letters end-to-end', () => {
    expect(CANONICAL_GLYPHS).toHaveLength(20);
    expect(new Set(CANONICAL_GLYPHS.map((g) => g.letter)).size).toBe(18);

    for (const start of [0, 5, 10, 15]) {
      const group = CANONICAL_GLYPHS.slice(start, start + 5);
      const image = solver.parse(encodeGlyphLayers(group, 3));
      expect(image.dimensions.equals(STANDARD_IMAGE_DIMENSIONS)).toBe(true);
      expect(solver.solve(image)).toBe(group.map((g) => g.letter).join(''));
    }
  });

  it('rejects unresolved transparent pixels, invalid composite digits, unknown glyphs, and bad parse inputs', () => {
    expect(() => solver.solve(solver.parse('2'.repeat(LAYER_SIZE)))).toThrow(/transparent/i);
    expect(() => solver.solve(solver.parse('3' + '1'.repeat(LAYER_SIZE - 1)))).toThrow(RangeError);
    expect(() => solver.solve(solver.parse('1'.repeat(LAYER_SIZE)))).toThrow(/#####/);
    expect(() => solver.parse('')).toThrow(Error);
    expect(() => solver.parse('  \n\t ')).toThrow(Error);
    expect(() => solver.parse('012x' + '0'.repeat(LAYER_SIZE - 4))).toThrow(Error);
    expect(() => solver.parse('0'.repeat(LAYER_SIZE - 1))).toThrow(RangeError);
  });

  it('produces bounded, monotonic traces and validates maxSteps', () => {
    const sixLayer = solver.parse(encodeGlyphLayers(CANONICAL_GLYPHS.slice(0, 5), 6));
    const single = solver.trace(sixLayer, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]!.isFinalLayer).toBe(true);

    const sampled = solver.trace(sixLayer, { maxSteps: 3 });
    expect(sampled).toHaveLength(3);
    expect(sampled[0]!.layerIndex).toBe(0);
    expect(sampled[2]!.layerIndex).toBe(5);
    expect(sampled[1]!.resolvedPixelCount).toBeGreaterThanOrEqual(sampled[0]!.resolvedPixelCount);
    expect(sampled[2]!.resolvedPixelCount).toBeGreaterThanOrEqual(sampled[1]!.resolvedPixelCount);

    const big = solver.parse(encodeGlyphLayers(CANONICAL_GLYPHS.slice(10, 15), 120));
    const bounded = solver.trace(big, { maxSteps: 100 });
    expect(bounded).toHaveLength(100);
    expect(bounded[0]!.layerIndex).toBe(0);
    expect(bounded[99]!.layerIndex).toBe(119);
    expect(bounded[99]!.isFinalLayer).toBe(true);
    expect(() => solver.trace(sixLayer, { maxSteps: 0 })).toThrow(RangeError);
  });

  it('matches an independent raw-string raycast oracle across 30 seeded random images', () => {
    let seed = 20190802;
    for (let trial = 0; trial < 30; trial += 1) {
      const generated = generateSeededCase(seed);
      seed = generated.seed;
      const expected = raycastOracleDecode(generated.raw);
      const image = solver.parse(generated.raw);
      const trace = solver.trace(image);

      expect(solver.solve(image)).toBe(expected);
      expect(trace[trace.length - 1]!.decodedSlots?.join('')).toBe(expected);
    }
  });
});
