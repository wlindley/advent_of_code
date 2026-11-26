import { describe, expect, it } from 'vitest';
import { FREE_BLOCK } from '../diskMap';
import { fileColorCss, fileColorRgb, FREE_COLOR_RGB } from './palette';

describe('palette', () => {
  it('returns neutral light-mode RGB and CSS fallback for negative / free block IDs', () => {
    expect(fileColorRgb(FREE_BLOCK)).toEqual(FREE_COLOR_RGB);
    expect(fileColorRgb(-5)).toEqual(FREE_COLOR_RGB);
    expect(fileColorCss(FREE_BLOCK)).toBe(
      `rgb(${FREE_COLOR_RGB[0]}, ${FREE_COLOR_RGB[1]}, ${FREE_COLOR_RGB[2]})`,
    );
  });

  it('produces deterministic, bounded RGB triples and CSS strings for file IDs', () => {
    const seen = new Set<string>();
    for (let id = 0; id < 32; id += 1) {
      const rgb = fileColorRgb(id);
      expect(rgb).toHaveLength(3);
      for (const ch of rgb) {
        expect(Number.isInteger(ch)).toBe(true);
        expect(ch).toBeGreaterThanOrEqual(0);
        expect(ch).toBeLessThanOrEqual(255);
      }
      const css = fileColorCss(id);
      expect(css).toBe(`rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`);
      expect(fileColorCss(id)).toBe(css);
      seen.add(css);
    }
    expect(seen.size).toBe(32);
  });
});
