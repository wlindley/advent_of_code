import { describe, expect, it } from 'vitest';
import { Contraption, parseContraption } from './contraption';
import { DIR_E, DIR_N, DIR_S, DIR_W, TILE_BACKSLASH, TILE_EMPTY, TILE_SLASH } from './optics';

describe('Contraption and parseContraption', () => {
  it('parses CRLF and trimmed whitespace into an immutable contraption', () => {
    const grid = parseContraption('  .|\\\r\n/-.\r  ');
    expect(grid.height).toBe(2);
    expect(grid.width).toBe(3);
    expect(grid.size).toBe(6);
    expect(Object.isFrozen(grid)).toBe(true);
    expect(grid.toLines()).toEqual(['.|\\', '/-.']);
    expect(Object.isFrozen(grid.toLines())).toBe(true);
    expect(grid.tileCodeAt(0, 0)).toBe(TILE_EMPTY);
    expect(grid.tileCodeAt(0, 2)).toBe(TILE_BACKSLASH);
    expect(grid.tileCodeAt(1, 0)).toBe(TILE_SLASH);
    expect(grid.tileAt(0, 1)).toBe('|');
    expect(grid.tileAt(1, 1)).toBe('-');
  });

  it('returns defensive copies from copyTiles()', () => {
    const grid = Contraption.fromLines(['./', '\\.']);
    const copy = grid.copyTiles();
    expect([...copy]).toEqual([TILE_EMPTY, TILE_SLASH, TILE_BACKSLASH, TILE_EMPTY]);
    copy[0] = 4;
    expect(grid.tileAt(0, 0)).toBe('.');
  });

  it('validates bounds on inBounds, tileCodeAt, and tileAt', () => {
    const grid = Contraption.fromLines(['./', '\\|']);
    expect(grid.inBounds(0, 0)).toBe(true);
    expect(grid.inBounds(1, 1)).toBe(true);
    expect(grid.inBounds(-1, 0)).toBe(false);
    expect(grid.inBounds(2, 0)).toBe(false);
    expect(grid.inBounds(0, -1)).toBe(false);
    expect(grid.inBounds(0, 2)).toBe(false);
    expect(grid.inBounds(0.5, 0)).toBe(false);
    expect(grid.inBounds(0, 0.5)).toBe(false);

    expect(() => grid.tileCodeAt(-1, 0)).toThrow(RangeError);
    expect(() => grid.tileAt(2, 0)).toThrow(RangeError);
    expect(() => grid.tileCodeAt(0, 2)).toThrow(RangeError);
  });

  it('enumerates all 2*(H+W) edge entries in canonical perimeter order', () => {
    const single = Contraption.fromLines(['.']);
    expect(single.edgeEntries()).toEqual([
      { row: 0, col: 0, dir: DIR_S },
      { row: 0, col: 0, dir: DIR_N },
      { row: 0, col: 0, dir: DIR_E },
      { row: 0, col: 0, dir: DIR_W },
    ]);

    const rect = Contraption.fromLines(['...', '...']);
    const edges = rect.edgeEntries();
    expect(edges).toHaveLength(10);
    expect(Object.isFrozen(edges)).toBe(true);
    expect(edges.slice(0, 3)).toEqual([
      { row: 0, col: 0, dir: DIR_S },
      { row: 0, col: 1, dir: DIR_S },
      { row: 0, col: 2, dir: DIR_S },
    ]);
    expect(edges.slice(3, 6)).toEqual([
      { row: 1, col: 0, dir: DIR_N },
      { row: 1, col: 1, dir: DIR_N },
      { row: 1, col: 2, dir: DIR_N },
    ]);
    expect(edges.slice(6, 8)).toEqual([
      { row: 0, col: 0, dir: DIR_E },
      { row: 1, col: 0, dir: DIR_E },
    ]);
    expect(edges.slice(8, 10)).toEqual([
      { row: 0, col: 2, dir: DIR_W },
      { row: 1, col: 2, dir: DIR_W },
    ]);
  });

  it('rejects empty inputs, empty rows, jagged rows, and invalid characters', () => {
    expect(() => parseContraption('')).toThrow(Error);
    expect(() => parseContraption('   \n  \r\n ')).toThrow(Error);
    expect(() => Contraption.fromLines([])).toThrow(Error);
    expect(() => Contraption.fromLines([''])).toThrow(Error);
    expect(() => Contraption.fromLines(['..', '...'])).toThrow(RangeError);
    expect(() => Contraption.fromLines(['..', '.#'])).toThrow(RangeError);
  });
});
