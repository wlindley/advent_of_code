import { describe, expect, it } from 'vitest';
import { D4_COUNT, type D4Orientation, SquareBitmap, transformSquare } from './d4';
import { Tile } from './tile';

function makeBitmapFromRows(rows: readonly string[]): SquareBitmap {
  const side = rows.length;
  const buf = new Uint8Array(side * side);
  for (let r = 0; r < side; r += 1) {
    const row = rows[r]!;
    for (let c = 0; c < side; c += 1) {
      buf[r * side + c] = row[c] === '#' ? 1 : 0;
    }
  }
  return new SquareBitmap(side, buf);
}

describe('2020 Day 20 shared/tile', () => {
  it('computes all 8 D4 orientations with matching border bitmasks and pixels', () => {
    // 4x4 asymmetric tile:
    // #..# -> 1001 = 9
    // .#.. ->
    // ..#. ->
    // ###. -> 1110 = 14
    const bmp = makeBitmapFromRows(['#..#', '.#..', '..#.', '###.']);
    const tile = new Tile(2, 2311, bmp);

    expect(tile.tileIndex).toBe(2);
    expect(tile.id).toBe(2311);
    expect(tile.bitmap).toBe(bmp);
    expect(tile.orientations.length).toBe(D4_COUNT);

    const idOri = tile.orientation(0);
    expect(idOri.tileIndex).toBe(2);
    expect(idOri.tileId).toBe(2311);
    expect(idOri.ori).toBe(0);
    expect(idOri.top).toBe(0b1001);
    expect(idOri.bottom).toBe(0b1110);
    expect(idOri.left).toBe(0b1001);
    expect(idOri.right).toBe(0b1000);

    // Verify every orientation matches transformSquare(bmp, ori) pixel-for-pixel
    for (let o = 0; o < D4_COUNT; o += 1) {
      const ori = o as D4Orientation;
      const t = transformSquare(bmp, ori);
      const oData = tile.orientation(ori);
      for (let r = 0; r < 4; r += 1) {
        for (let c = 0; c < 4; c += 1) {
          expect(tile.pixelAt(ori, r, c)).toBe(t.at(r, c));
        }
      }
      // Flip H (ori 4) swaps left/right and reverses top/bottom
      if (ori === 4) {
        expect(oData.top).toBe(0b1001);
        expect(oData.bottom).toBe(0b0111);
        expect(oData.left).toBe(0b1000);
        expect(oData.right).toBe(0b1001);
      }
      // Flip V (ori 6) swaps top/bottom and reverses left/right
      if (ori === 6) {
        expect(oData.top).toBe(0b1110);
        expect(oData.bottom).toBe(0b1001);
        expect(oData.left).toBe(0b1001);
        expect(oData.right).toBe(0b0001);
      }
    }
  });
});
