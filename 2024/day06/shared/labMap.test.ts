import { describe, expect, it } from 'vitest';
import { Grid2D } from '../../../shared/core';
import {
  GUARD_SYMBOLS,
  isGuardDirection,
  parseGuardDirection,
  turnRight,
  type GuardDirection,
} from './direction';
import { LabMap, parseLabMap } from './labMap';

const EXAMPLE_MAP = [
  '....#.....',
  '.........#',
  '..........',
  '..#.......',
  '.......#..',
  '..........',
  '.#..^.....',
  '........#.',
  '#.........',
  '......#...',
].join('\n');

describe('direction helpers', () => {
  it('exposes frozen guard symbols in DIRS_4 clockwise order', () => {
    expect(GUARD_SYMBOLS).toEqual(['^', '>', 'v', '<']);
    expect(Object.isFrozen(GUARD_SYMBOLS)).toBe(true);
  });

  it('validates GuardDirection integers 0..3', () => {
    for (const d of [0, 1, 2, 3]) {
      expect(isGuardDirection(d)).toBe(true);
    }
    for (const bad of [-1, 4, 1.5, Number.NaN]) {
      expect(isGuardDirection(bad)).toBe(false);
    }
  });

  it('parses guard characters and rejects non-guard characters', () => {
    expect(parseGuardDirection('^')).toBe(0);
    expect(parseGuardDirection('>')).toBe(1);
    expect(parseGuardDirection('v')).toBe(2);
    expect(parseGuardDirection('<')).toBe(3);
    expect(parseGuardDirection('.')).toBeUndefined();
    expect(parseGuardDirection('#')).toBeUndefined();
    expect(parseGuardDirection('')).toBeUndefined();
  });

  it('turns 90 degrees clockwise across all four directions', () => {
    expect(turnRight(0)).toBe(1);
    expect(turnRight(1)).toBe(2);
    expect(turnRight(2)).toBe(3);
    expect(turnRight(3)).toBe(0);
  });
});

describe('LabMap & parseLabMap', () => {
  it('parses the official 10x10 example map and freezes the instance', () => {
    const map = parseLabMap(EXAMPLE_MAP);
    expect(Object.isFrozen(map)).toBe(true);
    expect(map.rows).toBe(10);
    expect(map.cols).toBe(10);
    expect(map.size).toBe(100);
    expect(map.startRow).toBe(6);
    expect(map.startCol).toBe(4);
    expect(map.startDir).toBe(0);
    expect(map.isObstacle(0, 4)).toBe(true);
    expect(map.isObstacle(6, 4)).toBe(false);
    expect(map.inBounds(9, 9)).toBe(true);
    expect(map.inBounds(10, 0)).toBe(false);
  });

  it('supports CRLF line endings, trailing newlines, and 1x1 guard maps', () => {
    const map = parseLabMap('..#\r\n.>.\r\n\r\n');
    expect(map.rows).toBe(2);
    expect(map.cols).toBe(3);
    expect(map.startRow).toBe(1);
    expect(map.startCol).toBe(1);
    expect(map.startDir).toBe(1);

    const tiny = parseLabMap('<');
    expect(tiny.size).toBe(1);
    expect(tiny.startDir).toBe(3);
  });

  it('throws RangeError when querying isObstacle out of bounds', () => {
    const map = parseLabMap('^.');
    expect(() => map.isObstacle(-1, 0)).toThrow(RangeError);
    expect(() => map.isObstacle(0, 2)).toThrow(RangeError);
  });

  it('validates LabMap constructor invariants individually', () => {
    const grid = new Grid2D(2, 2, [false, true, false, false]);
    expect(() => new LabMap(grid, -1, 0, 0)).toThrow(RangeError);
    expect(() => new LabMap(grid, 0, 1, 0)).toThrow(Error);
    expect(() => new LabMap(grid, 0, 0, 4 as GuardDirection)).toThrow(RangeError);
  });

  it('rejects malformed lab inputs individually', () => {
    expect(() => parseLabMap('')).toThrow(Error);
    expect(() => parseLabMap('...\n..')).toThrow(Error);
    expect(() => parseLabMap('.X\n.^')).toThrow(Error);
    expect(() => parseLabMap('..\n.#')).toThrow(Error);
    expect(() => parseLabMap('^.\n.v')).toThrow(Error);
  });
});
