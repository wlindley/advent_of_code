import { describe, expect, it } from 'vitest';
import {
  CANONICAL_GLYPHS,
  decodeHullRegistration,
  tryDecodeHullRegistration,
  type GlyphDefinition,
} from './bitmapFont';
import { PaintingReport, panelKey, type GridPoint, type PaintedPanel } from './robotModels';

function renderGlyphs(glyphs: readonly GlyphDefinition[], offsetX = 0, offsetY = 0): GridPoint[] {
  const points: GridPoint[] = [];
  for (let slot = 0; slot < glyphs.length; slot += 1) {
    const rows = glyphs[slot]!.rows;
    for (let row = 0; row < rows.length; row += 1) {
      for (let col = 0; col < rows[row]!.length; col += 1) {
        if (rows[row]![col] === '#') {
          points.push({ x: offsetX + slot * 5 + col, y: offsetY + row });
        }
      }
    }
  }
  return points;
}

describe('bitmapFont', () => {
  it('decodes all 20 canonical 5x6 AoC glyphs including both I, both S, and 5-wide Y', () => {
    expect(CANONICAL_GLYPHS).toHaveLength(20);
    for (const glyph of CANONICAL_GLYPHS) {
      const whitePanels = renderGlyphs([glyph], 10, -3);
      expect(decodeHullRegistration(whitePanels)).toBe(glyph.letter);
    }

    const fullString = renderGlyphs(CANONICAL_GLYPHS, -4, 7);
    expect(decodeHullRegistration(fullString)).toBe('ABCEFGHIIJKLOPRSSUYZ');
  });

  it('decodes leading centered I followed by A via minX - 1 origin fallback', () => {
    const centeredI = CANONICAL_GLYPHS.find((g) => g.letter === 'I' && g.rows[0] === '.###.')!;
    const glyphA = CANONICAL_GLYPHS.find((g) => g.letter === 'A')!;
    const points = renderGlyphs([centeredI, glyphA], 0, 0);
    expect(Math.min(...points.map((p) => p.x))).toBe(1);
    expect(decodeHullRegistration(points)).toBe('IA');
    expect(tryDecodeHullRegistration(points)).toBe('IA');
  });

  it('ignores stray black panels when decoding from PaintingReport.whitePanels', () => {
    const glyphY = CANONICAL_GLYPHS.find((g) => g.letter === 'Y')!;
    const glyphZ = CANONICAL_GLYPHS.find((g) => g.letter === 'Z')!;
    const panels = new Map<string, PaintedPanel>();
    for (const pt of renderGlyphs([glyphY, glyphZ], 2, 1)) {
      panels.set(panelKey(pt.x, pt.y), { x: pt.x, y: pt.y, color: 1, paintCount: 1 });
    }
    panels.set(panelKey(0, -10), { x: 0, y: -10, color: 0, paintCount: 1 });
    panels.set(panelKey(99, 25), { x: 99, y: 25, color: 0, paintCount: 2 });

    const report = new PaintingReport(0, panels, { x: 0, y: 0 }, 0, 10, 50);
    expect(decodeHullRegistration(report.whitePanels)).toBe('YZ');
  });

  it('rejects empty white panels, wrong tight height, and unknown glyph masks', () => {
    expect(() => decodeHullRegistration([])).toThrow();
    expect(tryDecodeHullRegistration([])).toBeNull();

    const tooShort: GridPoint[] = [
      { x: 0, y: 0 },
      { x: 0, y: 4 },
    ];
    expect(() => decodeHullRegistration(tooShort)).toThrow(RangeError);
    expect(tryDecodeHullRegistration(tooShort)).toBeNull();

    const tooTall: GridPoint[] = [
      { x: 0, y: 0 },
      { x: 0, y: 6 },
    ];
    expect(() => decodeHullRegistration(tooTall)).toThrow(RangeError);

    const unrecognized: GridPoint[] = [
      { x: 0, y: 0 },
      { x: 1, y: 2 },
      { x: 2, y: 5 },
    ];
    expect(() => decodeHullRegistration(unrecognized)).toThrow();
    expect(tryDecodeHullRegistration(unrecognized)).toBeNull();
  });
});
