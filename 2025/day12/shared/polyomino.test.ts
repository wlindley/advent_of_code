import { describe, expect, it } from 'vitest';
import { PolyominoOrientation, PolyominoShape, type CellCoord } from './polyomino';

const c = (coords: [number, number][]): CellCoord[] => coords.map(([row, col]) => ({ row, col }));

describe('PolyominoShape and PolyominoOrientation', () => {
  it('tight-normalizes coordinates, sorts column-major, and freezes instances', () => {
    const shape = new PolyominoShape(2, c([[5, 4], [4, 3], [5, 3]]));
    expect(shape.id).toBe(2);
    expect([shape.area, shape.width, shape.height, shape.shortSide, shape.longSide]).toEqual([3, 2, 2, 2, 2]);
    expect(shape.cells).toEqual(c([[0, 0], [1, 0], [1, 1]]));
    expect(Object.isFrozen(shape)).toBe(true);
    expect(Object.isFrozen(shape.cells)).toBe(true);
    expect(Object.isFrozen(shape.cells[0])).toBe(true);
  });

  it('computes anchorRow > 0 when top-left cell of bounding box is empty', () => {
    const orient = new PolyominoOrientation(c([[1, 0], [0, 1], [1, 1]]));
    expect([orient.area, orient.width, orient.height, orient.anchorRow]).toEqual([3, 2, 2, 1]);
    expect(Object.isFrozen(orient)).toBe(true);
  });

  it('generates exact unique D4 orientations for canonical polyominoes', () => {
    const cases: [string, [number, number][], number][] = [
      ['1x1', [[0, 0]], 1],
      ['2x2', [[0, 0], [0, 1], [1, 0], [1, 1]], 1],
      ['1x3', [[0, 0], [0, 1], [0, 2]], 2],
      ['T', [[0, 0], [0, 1], [0, 2], [1, 1]], 4],
      ['S', [[0, 1], [0, 2], [1, 0], [1, 1]], 4],
      ['F', [[0, 1], [0, 2], [1, 0], [1, 1], [2, 1]], 8],
    ];
    for (const [, coords, expected] of cases) {
      expect(new PolyominoShape(0, c(coords)).orientations).toHaveLength(expected);
    }
  });

  it('checks fitsIn and orientationFitting for hit and miss boxes', () => {
    const bar3 = new PolyominoShape(0, c([[0, 0], [0, 1], [0, 2]]));
    expect([bar3.fitsIn(3, 1), bar3.fitsIn(1, 3), bar3.fitsIn(2, 2)]).toEqual([true, true, false]);
    expect(bar3.orientationFitting(3, 1)).toMatchObject({ width: 3, height: 1 });
    expect(bar3.orientationFitting(1, 3)).toMatchObject({ width: 1, height: 3 });
    expect(bar3.orientationFitting(2, 2)).toBeNull();
  });

  it('rejects negative id', () => {
    expect(() => new PolyominoShape(-1, c([[0, 0]]))).toThrow(RangeError);
  });

  it('rejects non-integer id', () => {
    expect(() => new PolyominoShape(1.5, c([[0, 0]]))).toThrow(RangeError);
  });

  it('rejects empty cells', () => {
    expect(() => new PolyominoShape(0, [])).toThrow(RangeError);
  });

  it('rejects non-integer coordinates', () => {
    expect(() => new PolyominoShape(0, c([[0.5, 0]]))).toThrow(RangeError);
    expect(() => new PolyominoShape(0, c([[0, Number.NaN]]))).toThrow(RangeError);
  });

  it('rejects duplicate coordinates', () => {
    expect(() => new PolyominoShape(0, c([[1, 2], [1, 2]]))).toThrow(Error);
  });
});
