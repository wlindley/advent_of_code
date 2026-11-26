import { describe, expect, it } from 'vitest';
import { DishPlatform, TILT_DIRECTIONS, parseDishPlatform } from './index';

const EXAMPLE = [
  'O....#....',
  'O.OO#....#',
  '.....##...',
  'OO.#O....O',
  '.O.....O#.',
  'O.#..O.#.#',
  '..O..#O..O',
  '.......O..',
  '#....###..',
  '#OO..#....',
].join('\n');

describe('2023/day14/shared/platform', () => {
  it('parses the official example and computes north-tilt load and row loads', () => {
    const initial = parseDishPlatform(EXAMPLE);
    const tilted = initial.tilt('north');
    expect(initial.height).toBe(10);
    expect(initial.width).toBe(10);
    expect(initial.roundedCount).toBe(18);
    expect(tilted.roundedCount).toBe(18);
    expect(tilted.northLoad).toBe(136);
    expect(tilted.rowLoads).toEqual([50, 18, 32, 21, 0, 0, 12, 3, 0, 0]);
    expect(tilted.toLines()[0]).toBe('OOOO.#.O..');
    expect(tilted.cellAt(0, 0)).toBe('O');
    expect(tilted.cellAt(0, 5)).toBe('#');
    expect(tilted.cellAt(9, 9)).toBe('.');
  });

  it('normalizes CRLF/CR line endings and outer whitespace', () => {
    const crlf = parseDishPlatform('  .O\r\n#.  \r\n');
    const cr = parseDishPlatform('.O\r#.');
    expect(crlf.toLines()).toEqual(['.O', '#.']);
    expect(cr.fingerprint()).toBe('.O#.');
  });

  it('handles 1x1, 1xN, Nx1, and 3x5 platforms with idempotence and rock conservation', () => {
    const oneByOne = parseDishPlatform('O');
    expect(oneByOne.tilt('north').northLoad).toBe(1);
    const row = parseDishPlatform('.O.#O');
    expect(row.tilt('west').toLines()).toEqual(['O..#O']);
    const col = parseDishPlatform('.\nO\n#\n.\nO');
    expect(col.tilt('north').toLines()).toEqual(['O', '.', '#', 'O', '.']);

    const rect = parseDishPlatform('.O.#.\n..O.O\n#..O.');
    for (const dir of TILT_DIRECTIONS) {
      const once = rect.tilt(dir);
      const twice = once.tilt(dir);
      expect(once.roundedCount).toBe(rect.roundedCount);
      expect(twice.fingerprint()).toBe(once.fingerprint());
    }
  });

  it('returns frozen platform instances and derived collections without mutating source', () => {
    const platform = parseDishPlatform('..\nO.');
    const beforeFp = platform.fingerprint();
    const tilted = platform.tilt('north');
    expect(Object.isFrozen(platform)).toBe(true);
    expect(Object.isFrozen(platform.rowLoads)).toBe(true);
    expect(Object.isFrozen(platform.toLines())).toBe(true);
    expect(platform.fingerprint()).toBe(beforeFp);
    expect(tilted.fingerprint()).toBe('O...');
  });

  it('rejects empty inputs, zero-width rows, ragged rows, internal blank lines, and invalid chars', () => {
    expect(() => parseDishPlatform('')).toThrow(RangeError);
    expect(() => parseDishPlatform('  \n\t ')).toThrow(RangeError);
    expect(() => DishPlatform.fromLines([])).toThrow(RangeError);
    expect(() => DishPlatform.fromLines([''])).toThrow(RangeError);
    expect(() => parseDishPlatform('..\n.')).toThrow(RangeError);
    expect(() => parseDishPlatform('..\n\n..')).toThrow(RangeError);
    expect(() => parseDishPlatform('..\n.X')).toThrow(RangeError);
  });

  it.each([
    [1.5, 0],
    [-1, 0],
    [2, 0],
    [0, 1.5],
    [0, -1],
    [0, 3],
  ])('rejects out-of-bounds cellAt(%s, %s)', (row, col) => {
    const platform = parseDishPlatform('...\n...');
    expect(() => platform.cellAt(row, col)).toThrow(RangeError);
  });
});
