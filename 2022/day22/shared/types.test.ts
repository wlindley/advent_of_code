import { describe, expect, it } from 'vitest';
import {
  computePassword,
  FACING_DELTAS,
  FACING_SYMBOLS,
  Tile,
  turnFacing,
  type Facing,
} from './types';

describe('types', () => {
  it('defines Tile values Void, Open, and Wall', () => {
    expect(Tile.Void).toBe(0);
    expect(Tile.Open).toBe(1);
    expect(Tile.Wall).toBe(2);
  });

  it('defines 4-element FACING_DELTAS and FACING_SYMBOLS matching AoC order', () => {
    expect(FACING_DELTAS).toEqual([
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ]);
    expect(FACING_SYMBOLS).toEqual(['>', 'v', '<', '^']);
  });

  it('rotates facing clockwise on R and counter-clockwise on L', () => {
    const rightExpected: readonly Facing[] = [1, 2, 3, 0];
    const leftExpected: readonly Facing[] = [3, 0, 1, 2];
    for (const f of [0, 1, 2, 3] as const) {
      expect(turnFacing(f, 'R')).toBe(rightExpected[f]);
      expect(turnFacing(f, 'L')).toBe(leftExpected[f]);
    }
  });

  it('computes final password as 1000*(row+1) + 4*(col+1) + facing', () => {
    expect(computePassword({ row: 5, col: 7, facing: 0 })).toBe(6032);
    expect(computePassword({ row: 4, col: 6, facing: 3 })).toBe(5031);
  });
});
