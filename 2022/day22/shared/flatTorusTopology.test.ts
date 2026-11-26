import { describe, expect, it } from 'vitest';
import { MonkeyBoard } from './board';
import { FlatTorusTopology } from './flatTorusTopology';
import { Tile, type Facing, type Pose } from './types';

function makeBoard(rows: readonly string[]): MonkeyBoard {
  const height = rows.length;
  const width = Math.max(...rows.map((r) => r.length));
  const cells = new Uint8Array(height * width);
  for (let r = 0; r < height; r += 1) {
    const line = rows[r]!;
    for (let c = 0; c < line.length; c += 1) {
      cells[r * width + c] =
        line[c] === '.' ? Tile.Open : line[c] === '#' ? Tile.Wall : Tile.Void;
    }
  }
  return new MonkeyBoard(height, width, cells);
}

describe('FlatTorusTopology', () => {
  it('exposes name flat-torus and freezes instance', () => {
    const topo = new FlatTorusTopology(makeBoard(['..']));
    expect(topo.name).toBe('flat-torus');
    expect(Object.isFrozen(topo)).toBe(true);
  });

  it('steps directly onto adjacent playable tiles including walls', () => {
    const topo = new FlatTorusTopology(makeBoard(['.#', '..']));
    expect(topo.step({ row: 0, col: 0, facing: 0 })).toEqual({ row: 0, col: 1, facing: 0 });
    expect(topo.step({ row: 0, col: 0, facing: 1 })).toEqual({ row: 1, col: 0, facing: 1 });
  });

  it('wraps around row and column boundaries in all four directions', () => {
    const topo = new FlatTorusTopology(makeBoard([' ... ', ' ... ', ' ... ']));
    expect(topo.step({ row: 1, col: 3, facing: 0 })).toEqual({ row: 1, col: 1, facing: 0 });
    expect(topo.step({ row: 1, col: 1, facing: 2 })).toEqual({ row: 1, col: 3, facing: 2 });
    expect(topo.step({ row: 2, col: 2, facing: 1 })).toEqual({ row: 0, col: 2, facing: 1 });
    expect(topo.step({ row: 0, col: 2, facing: 3 })).toEqual({ row: 2, col: 2, facing: 3 });
  });

  it('preserves exact involution even across U-shaped internal void gaps', () => {
    const board = makeBoard(['... ...', '.......']);
    const topo = new FlatTorusTopology(board);
    const reverse = (f: Facing): Facing => ((f + 2) % 4) as Facing;

    for (let r = 0; r < board.height; r += 1) {
      for (let c = 0; c < board.width; c += 1) {
        if (!board.isPlayable(r, c)) continue;
        for (const f of [0, 1, 2, 3] as const) {
          const start: Pose = { row: r, col: c, facing: f };
          const next = topo.step(start);
          const back = topo.step({ row: next.row, col: next.col, facing: reverse(next.facing) });
          expect({ row: back.row, col: back.col, facing: reverse(back.facing) }).toEqual(start);
        }
      }
    }
  });
});
