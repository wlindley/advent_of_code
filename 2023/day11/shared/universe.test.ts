import { describe, expect, it } from 'vitest';
import { parseUniverseMap, UniverseMap } from './universe';

const EXAMPLE_LINES = [
  '...#......',
  '.......#..',
  '#.........',
  '..........',
  '......#...',
  '.#........',
  '.........#',
  '..........',
  '.......#..',
  '#...#.....',
];

describe('parseUniverseMap and UniverseMap', () => {
  it('parses the AoC example grid and computes dynamic counts and galaxies', () => {
    const universe = parseUniverseMap(EXAMPLE_LINES.join('\n'));
    expect(universe).toBeInstanceOf(UniverseMap);
    expect(universe.rows).toBe(10);
    expect(universe.cols).toBe(10);
    expect(universe.size).toBe(100);
    expect(universe.at(0, 3)).toBe('#');
    expect(universe.at(0, 0)).toBe('.');

    const galaxies = universe.galaxies();
    expect(galaxies).toHaveLength(9);
    expect(galaxies[0]).toEqual({ row: 0, col: 3 });
    expect(galaxies[8]).toEqual({ row: 9, col: 4 });

    expect(universe.rowCounts()).toEqual([1, 1, 1, 0, 1, 1, 1, 0, 1, 2]);
    expect(universe.colCounts()).toEqual([2, 1, 0, 1, 1, 0, 1, 2, 0, 1]);
  });

  it('freezes the UniverseMap instance and returned arrays/coords', () => {
    const universe = parseUniverseMap('.#\n#.');
    expect(Object.isFrozen(universe)).toBe(true);
    const galaxies = universe.galaxies();
    expect(Object.isFrozen(galaxies)).toBe(true);
    expect(Object.isFrozen(galaxies[0])).toBe(true);
    expect(Object.isFrozen(universe.rowCounts())).toBe(true);
    expect(Object.isFrozen(universe.colCounts())).toBe(true);
  });

  it('handles CRLF line endings and trailing blank lines', () => {
    const universe = parseUniverseMap('.#\r\n..\r\n\r\n');
    expect(universe.rows).toBe(2);
    expect(universe.cols).toBe(2);
    expect(universe.galaxies()).toEqual([{ row: 0, col: 1 }]);
  });

  it('handles 1x1 empty and 1x1 galaxy grids', () => {
    const empty = parseUniverseMap('.');
    expect(empty.rows).toBe(1);
    expect(empty.cols).toBe(1);
    expect(empty.size).toBe(1);
    expect(empty.galaxies()).toEqual([]);
    expect(empty.rowCounts()).toEqual([0]);
    expect(empty.colCounts()).toEqual([0]);

    const single = parseUniverseMap('#');
    expect(single.galaxies()).toEqual([{ row: 0, col: 0 }]);
    expect(single.rowCounts()).toEqual([1]);
    expect(single.colCounts()).toEqual([1]);
  });

  it('handles non-square grids and all-galaxy grids', () => {
    const rect = parseUniverseMap('####\n####');
    expect(rect.rows).toBe(2);
    expect(rect.cols).toBe(4);
    expect(rect.size).toBe(8);
    expect(rect.galaxies()).toHaveLength(8);
    expect(rect.rowCounts()).toEqual([4, 4]);
    expect(rect.colCounts()).toEqual([2, 2, 2, 2]);
  });

  it('throws RangeError for out-of-bounds access', () => {
    const universe = parseUniverseMap('..\n.#');
    expect(() => universe.at(-1, 0)).toThrow(RangeError);
    expect(() => universe.at(2, 0)).toThrow(RangeError);
    expect(() => universe.at(0, 2)).toThrow(RangeError);
  });

  it('rejects empty input', () => {
    expect(() => parseUniverseMap('')).toThrow(Error);
  });

  it('rejects newline-only input', () => {
    expect(() => parseUniverseMap('\n\r\n')).toThrow(Error);
  });

  it('rejects ragged rows', () => {
    expect(() => parseUniverseMap('...\n..')).toThrow(Error);
  });

  it('rejects empty interior rows', () => {
    expect(() => parseUniverseMap('..\n\n..')).toThrow(Error);
  });

  it('rejects invalid characters', () => {
    expect(() => parseUniverseMap('.#S\n...')).toThrow(/Invalid universe cell/);
    expect(() => parseUniverseMap('. .\n...')).toThrow(/Invalid universe cell/);
  });
});
