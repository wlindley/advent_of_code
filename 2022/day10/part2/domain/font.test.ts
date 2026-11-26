import { describe, expect, it } from 'vitest';
import {
  CANONICAL_GLYPHS,
  GLYPH_BIT_COUNT,
  GLYPH_COUNT,
  GLYPH_WIDTH,
  MAX_GLYPH_MASK,
  buildGlyphLookup,
  decodeGlyphMask,
  formatGlyphMask,
  packGlyphMask,
} from './index';

describe('Day 10 Part 2 CRT font & glyph masks', () => {
  it('exposes canonical constants and deep-frozen glyph templates', () => {
    expect(GLYPH_WIDTH).toBe(5);
    expect(GLYPH_COUNT).toBe(8);
    expect(GLYPH_BIT_COUNT).toBe(30);
    expect(MAX_GLYPH_MASK).toBe((1 << 30) - 1);
    expect(CANONICAL_GLYPHS).toHaveLength(19);
    expect(Object.isFrozen(CANONICAL_GLYPHS)).toBe(true);
    expect(Object.isFrozen(CANONICAL_GLYPHS[0])).toBe(true);
    expect(Object.isFrozen(CANONICAL_GLYPHS[0]!.rows)).toBe(true);
  });

  it('round-trips every canonical glyph through pack, format, and decode with zero collisions', () => {
    const masks = new Set<number>();
    for (const glyph of CANONICAL_GLYPHS) {
      const mask = packGlyphMask(glyph.rows);
      expect(mask).toBeGreaterThan(0);
      expect(mask).toBeLessThanOrEqual(MAX_GLYPH_MASK);
      expect(masks.has(mask)).toBe(false);
      masks.add(mask);
      expect(formatGlyphMask(mask)).toBe(glyph.rows.join('\n'));
      expect(decodeGlyphMask(mask)).toBe(glyph.letter);
    }
    expect(decodeGlyphMask(0)).toBeNull();
    expect(decodeGlyphMask(MAX_GLYPH_MASK)).toBeNull();
  });

  it('rejects malformed glyph row arrays in packGlyphMask', () => {
    expect(() => packGlyphMask(['#####'])).toThrow(/6 rows/i);
    expect(() =>
      packGlyphMask(['####', '....', '....', '....', '....', '....']),
    ).toThrow(/5 columns/i);
    expect(() =>
      packGlyphMask(['####.', '....x', '....#', '....#', '....#', '....#']),
    ).toThrow(/invalid pixel/i);
  });

  it('rejects out-of-range or non-integer masks in formatGlyphMask and decodeGlyphMask', () => {
    for (const badMask of [-1, MAX_GLYPH_MASK + 1, 1.5, Number.NaN]) {
      expect(() => formatGlyphMask(badMask)).toThrow(/mask/i);
      expect(() => decodeGlyphMask(badMask)).toThrow(/mask/i);
    }
  });

  it('validates letter labels and duplicate masks in buildGlyphLookup', () => {
    const sampleRows = ['####.', '#....', '###..', '#....', '#....', '####.'];
    expect(() => buildGlyphLookup([{ letter: 'e', rows: sampleRows }])).toThrow(/letter/i);
    expect(() => buildGlyphLookup([{ letter: 'AB', rows: sampleRows }])).toThrow(/letter/i);
    expect(() =>
      buildGlyphLookup([
        { letter: 'E', rows: sampleRows },
        { letter: 'F', rows: sampleRows },
      ]),
    ).toThrow(/duplicate/i);
  });
});
