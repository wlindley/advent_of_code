import { describe, expect, it } from 'vitest';
import {
  buildGlyphLookup,
  CANONICAL_GLYPHS,
  decodeCompositeMessage,
  decodeGlyphMask,
  formatGlyphMask,
  GLYPH_BIT_COUNT,
  GLYPH_HEIGHT,
  GLYPH_WIDTH,
  isFontCompatible,
  MAX_GLYPH_MASK,
  packGlyphMask,
  tryDecodeComposite,
} from './bitmapFont';
import {
  CompositeImage,
  ImageDimensions,
  PART1_EXAMPLE_DIMENSIONS,
  PIXEL_BLACK,
  PIXEL_TRANSPARENT,
  PIXEL_WHITE,
  STANDARD_IMAGE_DIMENSIONS,
} from './imageModels';

function buildCompositeFromGlyphRows(rowsList: readonly (readonly string[])[]): CompositeImage {
  const dims = new ImageDimensions(rowsList.length * GLYPH_WIDTH, GLYPH_HEIGHT);
  const pixels = new Uint8Array(dims.layerSize);
  for (let slot = 0; slot < rowsList.length; slot += 1) {
    const rows = rowsList[slot]!;
    for (let r = 0; r < GLYPH_HEIGHT; r += 1) {
      for (let c = 0; c < GLYPH_WIDTH; c += 1) {
        const ch = rows[r]![c]!;
        pixels[dims.indexOf(r, slot * GLYPH_WIDTH + c)] =
          ch === '#' ? PIXEL_WHITE : ch === '.' ? PIXEL_BLACK : PIXEL_TRANSPARENT;
      }
    }
  }
  return new CompositeImage(dims, pixels);
}

describe('bitmapFont constants & masks', () => {
  it('defines canonical 5x6 constants and checks dimension compatibility', () => {
    expect(GLYPH_WIDTH).toBe(5);
    expect(GLYPH_HEIGHT).toBe(6);
    expect(GLYPH_BIT_COUNT).toBe(30);
    expect(MAX_GLYPH_MASK).toBe((1 << 30) - 1);
    expect(isFontCompatible(STANDARD_IMAGE_DIMENSIONS)).toBe(true);
    expect(isFontCompatible(PART1_EXAMPLE_DIMENSIONS)).toBe(false);
    expect(isFontCompatible(new ImageDimensions(7, 6))).toBe(false);
  });

  it('packs, formats, and decodes all canonical glyphs including I, S, and Y variants', () => {
    const lookup = buildGlyphLookup(CANONICAL_GLYPHS);
    expect(CANONICAL_GLYPHS).toHaveLength(20);
    for (const template of CANONICAL_GLYPHS) {
      const mask = packGlyphMask(template.rows);
      expect(formatGlyphMask(mask)).toBe(template.rows.join('\n'));
      expect(decodeGlyphMask(mask, lookup)).toBe(template.letter);
    }
    expect(decodeGlyphMask(0, lookup)).toBeNull();
  });

  it('rejects invalid masks, glyph rows, duplicate masks, and invalid letters', () => {
    expect(() => packGlyphMask(['.....'])).toThrow(RangeError);
    expect(() => packGlyphMask(['....', '....', '....', '....', '....', '....'])).toThrow(RangeError);
    expect(() => packGlyphMask(['....?', '.....', '.....', '.....', '.....', '.....'])).toThrow(Error);
    expect(() => formatGlyphMask(-1)).toThrow(RangeError);
    expect(() => formatGlyphMask(MAX_GLYPH_MASK + 1)).toThrow(RangeError);
    expect(() => formatGlyphMask(1.5)).toThrow(RangeError);
    expect(() => decodeGlyphMask(-1, new Map())).toThrow(RangeError);

    expect(() => buildGlyphLookup([{ letter: 'a', rows: CANONICAL_GLYPHS[0]!.rows }])).toThrow(Error);
    expect(() =>
      buildGlyphLookup([CANONICAL_GLYPHS[0]!, { letter: 'Z', rows: CANONICAL_GLYPHS[0]!.rows }]),
    ).toThrow(Error);
  });
});

describe('composite message decoding', () => {
  it('decodes full messages and supports partial slot decoding via tryDecodeComposite', () => {
    const abcy = CANONICAL_GLYPHS.filter((g) => ['A', 'B', 'S', 'Y'].includes(g.letter));
    const composite = buildCompositeFromGlyphRows(abcy.map((g) => g.rows));
    expect(decodeCompositeMessage(composite)).toBe('ABSSY');
    expect(tryDecodeComposite(composite)).toEqual(['A', 'B', 'S', 'S', 'Y']);

    const partial = buildCompositeFromGlyphRows([
      CANONICAL_GLYPHS[0]!.rows,
      ['?....', '.....', '.....', '.....', '.....', '.....'],
      ['.....', '.....', '.....', '.....', '.....', '.....'],
    ]);
    expect(tryDecodeComposite(partial)).toEqual(['A', null, null]);
    expect(tryDecodeComposite(new CompositeImage(PART1_EXAMPLE_DIMENSIONS, new Uint8Array(6)))).toBeNull();
  });

  it('throws descriptive errors for incompatible dims, unresolved pixels, and unknown glyphs', () => {
    const badDims = new CompositeImage(PART1_EXAMPLE_DIMENSIONS, new Uint8Array(6));
    expect(() => decodeCompositeMessage(badDims)).toThrow(RangeError);

    const unresolved = buildCompositeFromGlyphRows([
      ['?....', '.....', '.....', '.....', '.....', '.....'],
    ]);
    expect(() => decodeCompositeMessage(unresolved)).toThrow(Error);

    const unknown = buildCompositeFromGlyphRows([
      ['#####', '.....', '.....', '.....', '.....', '.....'],
    ]);
    expect(() => decodeCompositeMessage(unknown)).toThrow(/#####/);
  });
});
