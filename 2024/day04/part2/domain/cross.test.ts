import { describe, expect, it } from 'vitest';
import {
  classifyXMasOrientation,
  isXMasOrientation,
  XMAS_ORIENTATIONS,
  XMasCross,
  type XMasOrientation,
} from './cross';

describe('classifyXMasOrientation & isXMasOrientation', () => {
  it('classifies all four valid X-MAS corner arrangements', () => {
    expect(classifyXMasOrientation('M', 'S', 'M', 'S')).toBe('M_LEFT');
    expect(classifyXMasOrientation('S', 'M', 'S', 'M')).toBe('M_RIGHT');
    expect(classifyXMasOrientation('M', 'M', 'S', 'S')).toBe('M_TOP');
    expect(classifyXMasOrientation('S', 'S', 'M', 'M')).toBe('M_BOTTOM');
  });

  it('rejects MAM/SAS cross traps, half-valid pairs, and char-code-sum traps', () => {
    expect(classifyXMasOrientation('M', 'S', 'S', 'M')).toBeNull();
    expect(classifyXMasOrientation('S', 'M', 'M', 'S')).toBeNull();
    expect(classifyXMasOrientation('M', 'M', 'S', 'X')).toBeNull();
    expect(classifyXMasOrientation('X', 'M', 'S', 'S')).toBeNull();
    expect(classifyXMasOrientation('P', 'P', 'P', 'P')).toBeNull();
  });

  it('validates XMasOrientation strings with isXMasOrientation', () => {
    for (const orientation of XMAS_ORIENTATIONS) {
      expect(isXMasOrientation(orientation)).toBe(true);
    }
    expect(isXMasOrientation('M_CENTER')).toBe(false);
    expect(isXMasOrientation('')).toBe(false);
  });
});

describe('XMasCross', () => {
  it('computes corners, center, 5-cell list, and M->S diagonals for all orientations', () => {
    const cases: readonly [XMasOrientation, [number, number][]] [] = [
      ['M_LEFT', [[1, 2], [3, 4], [3, 2], [1, 4]]],
      ['M_RIGHT', [[1, 4], [3, 2], [3, 4], [1, 2]]],
      ['M_TOP', [[1, 2], [3, 4], [1, 4], [3, 2]]],
      ['M_BOTTOM', [[3, 2], [1, 4], [3, 4], [1, 2]]],
    ];
    for (const [orientation, [f1, t1, f2, t2]] of cases) {
      const cross = new XMasCross(2, 3, orientation);
      expect(Object.isFrozen(cross)).toBe(true);
      expect(cross.center).toEqual({ row: 2, col: 3 });
      expect(cross.nw).toEqual({ row: 1, col: 2 });
      expect(cross.ne).toEqual({ row: 1, col: 4 });
      expect(cross.sw).toEqual({ row: 3, col: 2 });
      expect(cross.se).toEqual({ row: 3, col: 4 });
      expect(cross.cells).toHaveLength(5);
      expect(Object.isFrozen(cross.cells)).toBe(true);
      expect(Object.isFrozen(cross.diagonals)).toBe(true);
      expect(cross.diagonals).toEqual([
        { from: { row: f1![0], col: f1![1] }, to: { row: t1![0], col: t1![1] } },
        { from: { row: f2![0], col: f2![1] }, to: { row: t2![0], col: t2![1] } },
      ]);
    }
  });

  it('rejects invalid centerRow, centerCol, and orientation separately', () => {
    expect(() => new XMasCross(0, 1, 'M_LEFT')).toThrow(RangeError);
    expect(() => new XMasCross(1.5, 1, 'M_LEFT')).toThrow(RangeError);
    expect(() => new XMasCross(1, 0, 'M_LEFT')).toThrow(RangeError);
    expect(() => new XMasCross(1, 2.5, 'M_LEFT')).toThrow(RangeError);
    expect(() => new XMasCross(1, 1, 'BAD' as XMasOrientation)).toThrow(RangeError);
  });
});
