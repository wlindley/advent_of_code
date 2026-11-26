import { describe, expect, it } from 'vitest';
import { MonkeyBoard } from './board';
import { CubeNetTopology } from './cubeNetTopology';
import { FACING_DELTAS, Tile, type Facing, type Pose } from './types';

function boardFromStrings(rows: readonly string[]): MonkeyBoard {
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

function expandPattern(pattern: readonly string[], scale: number): MonkeyBoard {
  const rows: string[] = [];
  for (const row of pattern) {
    let expanded = '';
    for (const ch of row) {
      expanded += (ch === '1' ? '.' : ' ').repeat(scale);
    }
    for (let k = 0; k < scale; k += 1) rows.push(expanded);
  }
  return boardFromStrings(rows);
}

function assertFullBoundaryInvolution(board: MonkeyBoard, topo: CubeNetTopology): number {
  const reverse = (f: Facing): Facing => ((f + 2) % 4) as Facing;
  let seamEdges = 0;
  for (let r = 0; r < board.height; r += 1) {
    for (let c = 0; c < board.width; c += 1) {
      if (!board.isPlayable(r, c)) continue;
      for (const f of [0, 1, 2, 3] as const) {
        const [dr, dc] = FACING_DELTAS[f];
        if (!board.isPlayable(r + dr, c + dc)) seamEdges += 1;
        const start: Pose = { row: r, col: c, facing: f };
        const landed = topo.step(start);
        const returned = topo.step({
          row: landed.row,
          col: landed.col,
          facing: reverse(landed.facing),
        });
        expect({ row: returned.row, col: returned.col, facing: reverse(returned.facing) }).toEqual(
          start,
        );
      }
    }
  }
  return seamEdges;
}

const EXAMPLE_NET = expandPattern(['  1 ', '111 ', '  11'], 4);

describe('CubeNetTopology', () => {
  it('folds the official S=4 example net, matches known seams, and satisfies 96-edge involution', () => {
    const topo = new CubeNetTopology(EXAMPLE_NET);
    expect(topo.name).toBe('cube-net');
    expect(topo.faceSize).toBe(4);
    expect(topo.faces).toHaveLength(6);
    expect(Object.isFrozen(topo)).toBe(true);

    // Official AoC example seams:
    expect(topo.step({ row: 5, col: 11, facing: 0 })).toEqual({ row: 8, col: 14, facing: 1 });
    expect(topo.step({ row: 11, col: 10, facing: 1 })).toEqual({ row: 7, col: 1, facing: 3 });
    // Unfolded internal step across face boundary:
    expect(topo.step({ row: 3, col: 8, facing: 1 })).toEqual({ row: 4, col: 8, facing: 1 });

    expect(assertFullBoundaryInvolution(EXAMPLE_NET, topo)).toBe(56);
  });

  it('satisfies full boundary involution on an alternate S=2 net and S=1 cross net', () => {
    const netS2 = expandPattern([' 11', ' 1 ', '11 ', '1  '], 2);
    const topoS2 = new CubeNetTopology(netS2);
    expect(topoS2.faceSize).toBe(2);
    expect(assertFullBoundaryInvolution(netS2, topoS2)).toBe(28);

    const netS1 = expandPattern([' 1 ', '111', ' 1 ', ' 1 '], 1);
    const topoS1 = new CubeNetTopology(netS1);
    expect(topoS1.faceSize).toBe(1);
    expect(assertFullBoundaryInvolution(netS1, topoS1)).toBe(14);
  });

  it('rejects 0 playable tiles, non-cube tile counts, and partial/misaligned blocks', () => {
    expect(() => new CubeNetTopology(boardFromStrings(['   ']))).toThrow(/playable/i);
    expect(() => new CubeNetTopology(boardFromStrings(['.....']))).toThrow(/6 square faces/i);
    expect(() => new CubeNetTopology(boardFromStrings(['....  ', '....  ', '......', '......', '  ....', '  ..  ']))).toThrow(/6 square faces/i);
    expect(() =>
      new CubeNetTopology(
        boardFromStrings([
          '..    ',
          '..    ',
          '......',
          '......',
          '..  ..',
          '..  ..',
          '..    ',
          '. .   ',
        ]),
      ),
    ).toThrow(/6 square faces/i);
    // 24 tiles (S=2) with partial 2x2 blocks:
    expect(() =>
      new CubeNetTopology(
        boardFromStrings([
          '....  ',
          '....  ',
          '....  ',
          '....  ',
          '....  ',
          '..  ..',
        ]),
      ),
    ).toThrow(/block/i);
  });

  it('rejects disconnected 3+3 nets, overlapping normals, and step() on void/off-face poses', () => {
    const disconnected = expandPattern(['111   ', '   111'], 2);
    expect(() => new CubeNetTopology(disconnected)).toThrow(/disconnected/i);

    const overlapping = expandPattern(['11111', ' 1   '], 2);
    expect(() => new CubeNetTopology(overlapping)).toThrow(/overlapping/i);

    const topo = new CubeNetTopology(EXAMPLE_NET);
    expect(() => topo.step({ row: 0, col: 0, facing: 0 })).toThrow(/cube face/i);
    expect(() => topo.step({ row: -1, col: 8, facing: 0 })).toThrow(/cube face/i);
  });
});
