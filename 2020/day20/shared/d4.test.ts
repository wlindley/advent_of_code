import { describe, expect, it } from 'vitest';
import {
  canonicalEdge,
  D4_COUNT,
  type D4Orientation,
  d4SourceIndex,
  reverseBits,
  SquareBitmap,
  transformSquare,
} from './d4';

function makeRampBitmap(side: number): SquareBitmap {
  const data = new Uint8Array(side * side);
  for (let i = 0; i < data.length; i += 1) data[i] = i;
  return new SquareBitmap(side, data);
}

describe('2020 Day 20 shared/d4', () => {
  it('computes pullback source indices across all 8 D4 orientations', () => {
    expect(D4_COUNT).toBe(8);
    // 3x3 grid: indices 0..8, corners: TL=0, TR=2, BL=6, BR=8
    expect(d4SourceIndex(0, 0, 0, 3)).toBe(0);
    expect(d4SourceIndex(1, 0, 0, 3)).toBe(6); // 90 CW: TL <- BL
    expect(d4SourceIndex(2, 0, 0, 3)).toBe(8); // 180: TL <- BR
    expect(d4SourceIndex(3, 0, 0, 3)).toBe(2); // 270 CW: TL <- TR
    expect(d4SourceIndex(4, 0, 0, 3)).toBe(2); // Flip H: TL <- TR
    expect(d4SourceIndex(5, 0, 0, 3)).toBe(8); // Anti-diag: TL <- BR
    expect(d4SourceIndex(6, 0, 0, 3)).toBe(6); // Flip V: TL <- BL
    expect(d4SourceIndex(7, 0, 0, 3)).toBe(0); // Main-diag: TL <- TL
    expect(d4SourceIndex(7, 1, 2, 3)).toBe(7); // (2, 1) -> 2*3 + 1 = 7
  });

  it('reverses bit masks sign-safely up to width 30 and computes canonical edges', () => {
    expect(reverseBits(0b10110, 5)).toBe(0b01101);
    expect(reverseBits(0b1100, 4)).toBe(0b0011);
    expect(reverseBits(1, 30)).toBe(1 << 29);
    expect(reverseBits(1 << 29, 30)).toBe(1);

    expect(canonicalEdge(0b10110, 5)).toBe(0b01101);
    expect(canonicalEdge(0b01101, 5)).toBe(0b01101);
    expect(canonicalEdge(0b1001, 4)).toBe(0b1001);
  });

  it('wraps Uint8Array in SquareBitmap and generates 8 distinct D4 transforms', () => {
    const bmp = makeRampBitmap(3);
    expect(bmp.side).toBe(3);
    expect(bmp.at(1, 2)).toBe(5);
    expect(bmp.atIndex(7)).toBe(7);

    const seen = new Set<string>();
    for (let o = 0; o < D4_COUNT; o += 1) {
      const t = transformSquare(bmp, o as D4Orientation);
      const flat = Array.from({ length: 9 }, (_, i) => t.atIndex(i)).join(',');
      seen.add(flat);
    }
    expect(seen.size).toBe(8);

    // 4 consecutive 90-CW rotations return to identity
    let rot = bmp;
    for (let k = 0; k < 4; k += 1) rot = transformSquare(rot, 1);
    for (let r = 0; r < 3; r += 1) {
      for (let c = 0; c < 3; c += 1) {
        expect(rot.at(r, c)).toBe(bmp.at(r, c));
      }
    }
  });

  it('validates SquareBitmap dimensions and buffer length', () => {
    expect(() => new SquareBitmap(0, new Uint8Array(0))).toThrow();
    expect(() => new SquareBitmap(2, new Uint8Array(3))).toThrow();
  });
});
