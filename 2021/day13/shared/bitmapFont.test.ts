import { describe, expect, it } from 'vitest';
import {
  CANONICAL_GLYPHS,
  decodeDotSheet,
  formatDotSheet,
  GLYPH_HEIGHT,
  GLYPH_WIDTH,
  packGlyphMask,
  tryDecodeDotSheet,
} from './bitmapFont';
import { DotSheet, type Dot } from './models';

function dotsFromRows(rows: readonly string[], offsetX: number, offsetY: number): Dot[] {
  const dots: Dot[] = [];
  for (let y = 0; y < rows.length; y += 1) {
    const line = rows[y]!;
    for (let x = 0; x < line.length; x += 1) {
      if (line[x] === '#') dots.push({ x: offsetX + x, y: offsetY + y });
    }
  }
  return dots;
}

describe('bitmapFont', () => {
  it('decodes all 20 canonical 5x6 AoC glyphs including shifted origins', () => {
    expect(CANONICAL_GLYPHS).toHaveLength(20);
    expect(GLYPH_WIDTH).toBe(5);
    expect(GLYPH_HEIGHT).toBe(6);

    for (const template of CANONICAL_GLYPHS) {
      const sheet = new DotSheet(dotsFromRows(template.rows, 3, 2));
      expect(decodeDotSheet(sheet)).toBe(template.letter);
    }
  });

  it('decodes leading centered I followed by another glyph (IA)', () => {
    const centeredI = CANONICAL_GLYPHS.find(
      (g) => g.letter === 'I' && g.rows[0] === '.###.',
    )!;
    const glyphA = CANONICAL_GLYPHS.find((g) => g.letter === 'A')!;
    const dots = [
      ...dotsFromRows(centeredI.rows, 0, 0),
      ...dotsFromRows(glyphA.rows, GLYPH_WIDTH, 0),
    ];
    const sheet = new DotSheet(dots);
    expect(sheet.bounds.minX).toBe(1);
    expect(tryDecodeDotSheet(sheet)).toBe('IA');
    expect(decodeDotSheet(sheet)).toBe('IA');
  });

  it('formats a DotSheet as ASCII art', () => {
    const sheet = new DotSheet([
      { x: 2, y: 1 },
      { x: 4, y: 2 },
    ]);
    expect(formatDotSheet(sheet)).toBe('#..\n..#');
  });

  it('returns null and throws on non-6-row or unrecognized glyphs', () => {
    const wrongHeight = new DotSheet([
      { x: 0, y: 0 },
      { x: 0, y: 4 },
    ]);
    expect(tryDecodeDotSheet(wrongHeight)).toBeNull();
    expect(() => decodeDotSheet(wrongHeight)).toThrow(Error);

    const unknownGlyph = new DotSheet([
      { x: 0, y: 0 },
      { x: 4, y: 5 },
    ]);
    expect(tryDecodeDotSheet(unknownGlyph)).toBeNull();
    expect(() => decodeDotSheet(unknownGlyph)).toThrow(Error);
  });

  it('validates packGlyphMask dimensions and characters', () => {
    expect(() => packGlyphMask(['#....'])).toThrow(RangeError);
    expect(() => packGlyphMask(['#', '.', '.', '.', '.', '.'])).toThrow(RangeError);
    expect(() => packGlyphMask(['#?...', '.....', '.....', '.....', '.....', '.....'])).toThrow(Error);
  });
});
