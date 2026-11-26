import { describe, expect, it } from 'vitest';
import {
  compareJunctionPairs,
  parseJunctions,
  squaredDistance3D,
  type JunctionPair,
} from './index';

describe('parseJunctions', () => {
  it('parses valid 3D coordinates, trims outer whitespace, handles CRLF, and normalizes -0', () => {
    const pts = parseJunctions('  10,-20,30\r\n-0,0,5  \n');
    expect(pts).toEqual([
      { x: 10, y: -20, z: 30 },
      { x: 0, y: 0, z: 5 },
    ]);
    expect(Object.is(pts[1]!.x, 0)).toBe(true);
    expect(Object.isFrozen(pts)).toBe(true);
    expect(Object.isFrozen(pts[0])).toBe(true);
  });

  it('rejects empty or whitespace-only input', () => {
    expect(() => parseJunctions('')).toThrow(Error);
    expect(() => parseJunctions('   \n\t ')).toThrow(Error);
  });

  it('rejects malformed lines, wrong token counts, non-integers, and unsafe integers', () => {
    expect(() => parseJunctions('1,2')).toThrow(Error);
    expect(() => parseJunctions('1,2,3,4')).toThrow(Error);
    expect(() => parseJunctions('1, 2, 3')).toThrow(Error);
    expect(() => parseJunctions('1,2.5,3')).toThrow(Error);
    expect(() => parseJunctions('1,abc,3')).toThrow(Error);
    expect(() => parseJunctions('1,2,9007199254740992')).toThrow(RangeError);
  });
});

describe('squaredDistance3D', () => {
  it('computes exact squared Euclidean distance in 3D', () => {
    expect(squaredDistance3D({ x: 1, y: 2, z: 3 }, { x: 4, y: -2, z: 3 })).toBe(25);
  });

  it('throws RangeError when squared distance exceeds safe integer precision', () => {
    expect(() =>
      squaredDistance3D({ x: 0, y: 0, z: 0 }, { x: 100_000_000, y: 0, z: 0 }),
    ).toThrow(RangeError);
  });
});

describe('compareJunctionPairs', () => {
  it('orders by distSq ascending, then u, then v', () => {
    const a: JunctionPair = { u: 1, v: 3, distSq: 10 };
    const b: JunctionPair = { u: 0, v: 5, distSq: 12 };
    const c: JunctionPair = { u: 0, v: 4, distSq: 10 };
    const d: JunctionPair = { u: 1, v: 2, distSq: 10 };
    expect([a, b, c, d].sort(compareJunctionPairs)).toEqual([c, d, a, b]);
    expect(compareJunctionPairs(a, a)).toBe(0);
  });
});
