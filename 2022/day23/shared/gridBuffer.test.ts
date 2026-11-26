import { describe, expect, it } from 'vitest';
import { DEFAULT_INITIAL_PADDING, DiffusionGrid } from './gridBuffer';
import { parseElves } from './parser';

const SMALL_FIVE = parseElves(['.....', '..##.', '..#..', '.....', '..##.', '.....'].join('\n'));

describe('Day 23 DiffusionGrid', () => {
  it('exposes DEFAULT_INITIAL_PADDING and captures isolated snapshots across rounds', () => {
    expect(DEFAULT_INITIAL_PADDING).toBe(12);
    const grid = new DiffusionGrid(SMALL_FIVE, DEFAULT_INITIAL_PADDING);
    expect(grid.elfCount).toBe(5);

    const frame0 = grid.initialFrame();
    const rows0Copy = new Int32Array(frame0.elfRows);
    const cols0Copy = new Int32Array(frame0.elfCols);

    const summary1 = grid.stepRound(1);
    expect(summary1).toEqual({ round: 1, movedCount: 3, collisionCount: 1 });
    const frame1 = grid.toFrame(summary1);
    expect(frame1.round).toBe(1);
    expect(frame1.movedCount).toBe(3);
    expect(frame1.collisionCount).toBe(1);

    const rows1Copy = new Int32Array(frame1.elfRows);
    const summary2 = grid.stepRound(2);
    expect(summary2.round).toBe(2);

    // Earlier snapshots must remain untouched by subsequent steps.
    expect(frame0.elfRows).toEqual(rows0Copy);
    expect(frame0.elfCols).toEqual(cols0Copy);
    expect(frame1.elfRows).toEqual(rows1Copy);
  });

  it('handles W<->E collisions symmetrically with N<->S collisions', () => {
    const weCollision = [
      { row: 0, col: -1 },
      { row: 1, col: -2 },
      { row: 1, col: -1 }, // blocked N/S/W -> proposes E to (1, 0)
      { row: 2, col: -1 },
      { row: 0, col: 1 },
      { row: 1, col: 1 }, // blocked N/S -> proposes W to (1, 0)
      { row: 2, col: 1 },
    ];
    const grid = new DiffusionGrid(weCollision, 4);
    const summary = grid.stepRound(1);
    expect(summary.collisionCount).toBe(1);
    const frame = grid.toFrame(summary);
    // Neither (1, -1) nor (1, 1) moved into (1, 0)
    expect(frame.movedFlags[2]).toBe(0);
    expect(frame.movedFlags[5]).toBe(0);
  });

  it('grows margin when elves reach North, South, West, and East edges', () => {
    const northGrid = new DiffusionGrid([{ row: 0, col: 0 }, { row: 0, col: 1 }], 1);
    expect(northGrid.stepRound(1).movedCount).toBe(2);
    expect(northGrid.bounds.minRow).toBe(-1);
    expect(northGrid.stepRound(2).movedCount).toBe(2);
    expect(northGrid.bounds.minRow).toBe(0);

    const southGrid = new DiffusionGrid([{ row: 0, col: 0 }, { row: 0, col: 1 }], 1);
    expect(southGrid.stepRound(2).movedCount).toBe(2);
    expect(southGrid.stepRound(3).movedCount).toBe(2);
    expect(southGrid.bounds.maxRow).toBe(1);

    const westGrid = new DiffusionGrid([{ row: 0, col: 0 }, { row: 1, col: 0 }], 1);
    expect(westGrid.stepRound(3).movedCount).toBe(2);
    expect(westGrid.bounds.minCol).toBe(-1);
    expect(westGrid.stepRound(4).movedCount).toBe(2);
    expect(westGrid.bounds.minCol).toBe(0);

    const eastGrid = new DiffusionGrid([{ row: 0, col: 0 }, { row: 1, col: 0 }], 1);
    expect(eastGrid.stepRound(4).movedCount).toBe(2);
    expect(eastGrid.stepRound(5).movedCount).toBe(2);
    expect(eastGrid.bounds.maxCol).toBe(1);
  });

  it('rejects invalid constructor and stepRound arguments separately', () => {
    expect(() => new DiffusionGrid([], 4)).toThrow(RangeError);
    expect(() => new DiffusionGrid([{ row: 0, col: 0 }], 0)).toThrow(RangeError);
    expect(() => new DiffusionGrid([{ row: 0, col: 0 }], -1)).toThrow(RangeError);
    expect(() => new DiffusionGrid([{ row: 0, col: 0 }], 1.5)).toThrow(RangeError);
    expect(() => new DiffusionGrid([{ row: 0.5, col: 0 }], 4)).toThrow(RangeError);
    expect(() => new DiffusionGrid([{ row: 0, col: 0.5 }], 4)).toThrow(RangeError);
    expect(() => new DiffusionGrid([{ row: 1, col: 2 }, { row: 1, col: 2 }], 4)).toThrow();

    const grid = new DiffusionGrid([{ row: 0, col: 0 }], 4);
    expect(() => grid.stepRound(0)).toThrow(RangeError);
    expect(() => grid.stepRound(-1)).toThrow(RangeError);
    expect(() => grid.stepRound(1.5)).toThrow(RangeError);
    grid.stepRound(2);
    expect(() => grid.stepRound(2)).toThrow(RangeError);
    expect(() => grid.stepRound(1)).toThrow(RangeError);
  });
});
