import { describe, expect, it } from 'vitest';
import { parseTrailMap } from './trailMap';

const MINI_MAZE = [
  '#.###',
  '#...#',
  '#.v.#',
  '#>#.#',
  '###.#',
].join('\n');

describe('trailMap', () => {
  it('parses valid trail maps and exposes dynamic grid metrics and endpoints', () => {
    const map = parseTrailMap(`${MINI_MAZE}\n`);
    expect(map.rows).toBe(5);
    expect(map.cols).toBe(5);
    expect(map.size).toBe(25);
    expect(map.start).toBe(1);
    expect(map.end).toBe(23);
    expect(map.coordOf(map.start)).toEqual({ row: 0, col: 1 });
    expect(map.coordOf(map.end)).toEqual({ row: 4, col: 3 });
    expect(map.tileAt(map.start)).toBe('.');
    expect(map.tileAt(12)).toBe('v');
  });

  it('rejects invalid dimensions, invalid characters, and non-unique top/bottom openings', () => {
    expect(() => parseTrailMap('#.#')).toThrow();
    expect(() => parseTrailMap('#.#\n#X#')).toThrow();
    expect(() => parseTrailMap('###\n#.#')).toThrow();
    expect(() => parseTrailMap('..#\n#.#')).toThrow();
    expect(() => parseTrailMap('#.#\n###')).toThrow();
    expect(() => parseTrailMap('#.#\n..#')).toThrow();
  });

  it('validates cell bounds in coordOf and tileAt', () => {
    const map = parseTrailMap(MINI_MAZE);
    expect(() => map.coordOf(-1)).toThrow(RangeError);
    expect(() => map.coordOf(25)).toThrow(RangeError);
    expect(() => map.tileAt(1.5)).toThrow(RangeError);
  });

  it('computes walkableDegree and directional outgoingNeighbors using SLOPE_DELTA', () => {
    const slopeMaze = [
      '#.###',
      '#.<>#',
      '#^v.#',
      '###.#',
    ].join('\n');
    const map = parseTrailMap(slopeMaze);

    expect(map.walkableDegree(0)).toBe(0);
    expect(map.walkableDegree(map.start)).toBe(1);
    expect(map.walkableDegree(6)).toBe(3);

    expect(map.outgoingNeighbors(0, false)).toEqual([]);
    expect(map.outgoingNeighbors(map.start, false)).toEqual([6]);
    expect(map.outgoingNeighbors(7, false)).toEqual([6]); // '<' left
    expect(map.outgoingNeighbors(8, false)).toEqual([]); // '>' into '#'
    expect(map.outgoingNeighbors(11, false)).toEqual([6]); // '^' up
    expect(map.outgoingNeighbors(12, false)).toEqual([]); // 'v' into '#'
    expect(map.outgoingNeighbors(map.end, false)).toEqual([13]); // boundary check

    expect(map.outgoingNeighbors(7, true)).toEqual([8, 12, 6]);
    expect(map.outgoingNeighbors(8, true)).toEqual([13, 7]);
  });
});
