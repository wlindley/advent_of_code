import { describe, expect, it } from 'vitest';
import { MonkeyBoard } from './board';
import { Tile } from './types';

describe('MonkeyBoard', () => {
  it('stores dimensions, defensively copies cells, and freezes instance', () => {
    const raw = new Uint8Array([Tile.Void, Tile.Open, Tile.Wall, Tile.Open]);
    const board = new MonkeyBoard(2, 2, raw);
    raw[1] = Tile.Void;

    expect(board.height).toBe(2);
    expect(board.width).toBe(2);
    expect(Object.isFrozen(board)).toBe(true);
    expect(board.tileAt(0, 1)).toBe(Tile.Open);
    expect(board.playableTileCount).toBe(3);
  });

  it('returns Tile.Void for out-of-bounds coordinates and checks playability', () => {
    const board = new MonkeyBoard(2, 2, new Uint8Array([Tile.Void, Tile.Open, Tile.Wall, Tile.Open]));

    expect(board.tileAt(-1, 0)).toBe(Tile.Void);
    expect(board.tileAt(2, 0)).toBe(Tile.Void);
    expect(board.tileAt(0, -1)).toBe(Tile.Void);
    expect(board.tileAt(0, 2)).toBe(Tile.Void);
    expect(board.isPlayable(0, 0)).toBe(false);
    expect(board.isPlayable(0, 1)).toBe(true);
    expect(board.isPlayable(1, 0)).toBe(true);
  });

  it('finds start pose skipping leading void and wall tiles on row 0', () => {
    const board = new MonkeyBoard(
      1,
      4,
      new Uint8Array([Tile.Void, Tile.Wall, Tile.Open, Tile.Open]),
    );
    expect(board.findStartPose()).toEqual({ row: 0, col: 2, facing: 0 });
  });

  it('throws if row 0 has no open tile', () => {
    const board = new MonkeyBoard(
      2,
      2,
      new Uint8Array([Tile.Void, Tile.Wall, Tile.Open, Tile.Open]),
    );
    expect(() => board.findStartPose()).toThrow(/open/i);
  });

  it('rejects invalid dimensions or mismatched cells length', () => {
    expect(() => new MonkeyBoard(0, 2, new Uint8Array(0))).toThrow(/height/i);
    expect(() => new MonkeyBoard(1.5, 2, new Uint8Array(3))).toThrow(/height/i);
    expect(() => new MonkeyBoard(2, 0, new Uint8Array(0))).toThrow(/width/i);
    expect(() => new MonkeyBoard(2, 1.5, new Uint8Array(3))).toThrow(/width/i);
    expect(() => new MonkeyBoard(2, 2, new Uint8Array(3))).toThrow(/cells/i);
  });
});
