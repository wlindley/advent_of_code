import { describe, expect, it } from 'vitest';
import { GridPoint } from '../../shared';
import { HARMONIC_LINE_RULE } from './index';

function keySet(points: readonly GridPoint[]): Set<string> {
  return new Set(points.map((p) => `${p.row},${p.col}`));
}

describe('HARMONIC_LINE_RULE', () => {
  it('exposes frozen rule metadata', () => {
    expect(Object.isFrozen(HARMONIC_LINE_RULE)).toBe(true);
    expect(HARMONIC_LINE_RULE.id).toBe('harmonic-line');
    expect(HARMONIC_LINE_RULE.label.length).toBeGreaterThan(0);
  });

  it('projects full coprime diagonal ray through both anchors to grid boundaries', () => {
    const proj = HARMONIC_LINE_RULE.projectPair(new GridPoint(1, 3), new GridPoint(2, 6), 5, 10);
    expect(Object.isFrozen(proj)).toBe(true);
    expect(Object.isFrozen(proj.inBounds)).toBe(true);
    expect(Object.isFrozen(proj.outOfBounds)).toBe(true);
    expect(proj.inBounds).toEqual([
      new GridPoint(0, 0),
      new GridPoint(1, 3),
      new GridPoint(2, 6),
      new GridPoint(3, 9),
    ]);
    expect(proj.outOfBounds).toEqual([new GridPoint(-1, -3), new GridPoint(4, 12)]);
  });

  it('reduces non-coprime deltas (gcd > 1) to include all interior lattice points', () => {
    const proj = HARMONIC_LINE_RULE.projectPair(new GridPoint(0, 0), new GridPoint(4, 2), 6, 4);
    expect(proj.inBounds).toEqual([new GridPoint(0, 0), new GridPoint(2, 1), new GridPoint(4, 2)]);
    expect(proj.outOfBounds).toEqual([new GridPoint(-2, -1), new GridPoint(6, 3)]);
  });

  it('handles negative-slope diagonal with multi-point backward and forward rays', () => {
    const proj = HARMONIC_LINE_RULE.projectPair(new GridPoint(3, 3), new GridPoint(1, 5), 6, 7);
    expect(proj.inBounds).toEqual([
      new GridPoint(5, 1),
      new GridPoint(4, 2),
      new GridPoint(3, 3),
      new GridPoint(2, 4),
      new GridPoint(1, 5),
      new GridPoint(0, 6),
    ]);
    expect(proj.outOfBounds).toEqual([new GridPoint(6, 0), new GridPoint(-1, 7)]);
  });

  it('projects horizontal lines (dr === 0) without producing -0 coordinates', () => {
    const proj = HARMONIC_LINE_RULE.projectPair(new GridPoint(0, 1), new GridPoint(0, 3), 2, 5);
    expect(proj.inBounds).toEqual([
      new GridPoint(0, 0),
      new GridPoint(0, 1),
      new GridPoint(0, 2),
      new GridPoint(0, 3),
      new GridPoint(0, 4),
    ]);
    expect(proj.outOfBounds).toEqual([new GridPoint(0, -1), new GridPoint(0, 5)]);
    for (const pt of [...proj.inBounds, ...proj.outOfBounds]) {
      expect(Object.is(pt.row, -0)).toBe(false);
    }
  });

  it('projects vertical lines (dc === 0) without producing -0 coordinates', () => {
    const proj = HARMONIC_LINE_RULE.projectPair(new GridPoint(1, 0), new GridPoint(3, 0), 5, 2);
    expect(proj.inBounds).toEqual([
      new GridPoint(0, 0),
      new GridPoint(1, 0),
      new GridPoint(2, 0),
      new GridPoint(3, 0),
      new GridPoint(4, 0),
    ]);
    expect(proj.outOfBounds).toEqual([new GridPoint(-1, 0), new GridPoint(5, 0)]);
    for (const pt of [...proj.inBounds, ...proj.outOfBounds]) {
      expect(Object.is(pt.col, -0)).toBe(false);
    }
  });

  it('is symmetric in anchor ordering', () => {
    const a = new GridPoint(2, 5);
    const b = new GridPoint(4, 1);
    const ab = HARMONIC_LINE_RULE.projectPair(a, b, 7, 8);
    const ba = HARMONIC_LINE_RULE.projectPair(b, a, 7, 8);
    expect(keySet(ab.inBounds)).toEqual(keySet(ba.inBounds));
    expect(keySet(ab.outOfBounds)).toEqual(keySet(ba.outOfBounds));
  });

  it('terminates on minimal 1x2 and 2x1 grids across all four exit edges', () => {
    const h = HARMONIC_LINE_RULE.projectPair(new GridPoint(0, 0), new GridPoint(0, 1), 1, 2);
    expect(h.inBounds).toEqual([new GridPoint(0, 0), new GridPoint(0, 1)]);
    expect(h.outOfBounds).toEqual([new GridPoint(0, -1), new GridPoint(0, 2)]);

    const v = HARMONIC_LINE_RULE.projectPair(new GridPoint(0, 0), new GridPoint(1, 0), 2, 1);
    expect(v.inBounds).toEqual([new GridPoint(0, 0), new GridPoint(1, 0)]);
    expect(v.outOfBounds).toEqual([new GridPoint(-1, 0), new GridPoint(2, 0)]);
  });

  it('rejects invalid grid dimensions', () => {
    const a = new GridPoint(0, 0);
    const b = new GridPoint(0, 1);
    expect(() => HARMONIC_LINE_RULE.projectPair(a, b, 0, 5)).toThrow(RangeError);
    expect(() => HARMONIC_LINE_RULE.projectPair(a, b, -2, 5)).toThrow(RangeError);
    expect(() => HARMONIC_LINE_RULE.projectPair(a, b, 2.5, 5)).toThrow(RangeError);
    expect(() => HARMONIC_LINE_RULE.projectPair(a, b, 5, 0)).toThrow(RangeError);
    expect(() => HARMONIC_LINE_RULE.projectPair(a, b, 5, -1)).toThrow(RangeError);
    expect(() => HARMONIC_LINE_RULE.projectPair(a, b, 5, 1.5)).toThrow(RangeError);
  });

  it('rejects out-of-bounds anchor a on all four edges', () => {
    const b = new GridPoint(1, 1);
    expect(() => HARMONIC_LINE_RULE.projectPair(new GridPoint(-1, 1), b, 3, 3)).toThrow(RangeError);
    expect(() => HARMONIC_LINE_RULE.projectPair(new GridPoint(3, 1), b, 3, 3)).toThrow(RangeError);
    expect(() => HARMONIC_LINE_RULE.projectPair(new GridPoint(1, -1), b, 3, 3)).toThrow(RangeError);
    expect(() => HARMONIC_LINE_RULE.projectPair(new GridPoint(1, 3), b, 3, 3)).toThrow(RangeError);
  });

  it('rejects out-of-bounds anchor b on all four edges and identical anchors', () => {
    const a = new GridPoint(1, 1);
    expect(() => HARMONIC_LINE_RULE.projectPair(a, new GridPoint(-1, 1), 3, 3)).toThrow(RangeError);
    expect(() => HARMONIC_LINE_RULE.projectPair(a, new GridPoint(3, 1), 3, 3)).toThrow(RangeError);
    expect(() => HARMONIC_LINE_RULE.projectPair(a, new GridPoint(1, -1), 3, 3)).toThrow(RangeError);
    expect(() => HARMONIC_LINE_RULE.projectPair(a, new GridPoint(1, 3), 3, 3)).toThrow(RangeError);
    expect(() => HARMONIC_LINE_RULE.projectPair(a, new GridPoint(1, 1), 3, 3)).toThrow(RangeError);
  });
});
