import { describe, expect, it } from 'vitest';
import {
  IMPASSABLE_HEIGHT,
  MAX_HEIGHT,
  MIN_HEIGHT,
  parseTopographicMap,
  TopographicMap,
} from './index';

describe('TopographicMap & parseTopographicMap', () => {
  it('parses digits 0..9 and impassable dots into an immutable map', () => {
    const map = parseTopographicMap('0.9\n128\n');

    expect(map).toBeInstanceOf(TopographicMap);
    expect(Object.isFrozen(map)).toBe(true);
    expect(MIN_HEIGHT).toBe(0);
    expect(MAX_HEIGHT).toBe(9);
    expect(IMPASSABLE_HEIGHT).toBe(-1);
    expect(map.rows).toBe(2);
    expect(map.cols).toBe(3);
    expect(map.size).toBe(6);

    expect(map.heightAt(0, 0)).toBe(0);
    expect(map.heightAt(0, 1)).toBe(-1);
    expect(map.heightAt(0, 2)).toBe(9);
    expect(map.heightAt(1, 1)).toBe(2);
    expect(map.heightAtIndex(4)).toBe(2);
    expect(map.heightAtIndex(5)).toBe(8);
  });

  it('maps between row/col coordinates and row-major indices', () => {
    const map = parseTopographicMap('012\n345');

    expect(map.inBounds(0, 0)).toBe(true);
    expect(map.inBounds(1, 2)).toBe(true);
    expect(map.inBounds(-1, 0)).toBe(false);
    expect(map.inBounds(2, 0)).toBe(false);
    expect(map.inBounds(0, -1)).toBe(false);
    expect(map.inBounds(0, 3)).toBe(false);

    expect(map.indexOf(1, 2)).toBe(5);
    const coords = map.coordsOf(5);
    expect(coords).toEqual([1, 2]);
    expect(Object.isFrozen(coords)).toBe(true);
  });

  it('derives frozen trailhead and peak indices dynamically', () => {
    const map = parseTopographicMap('90.\n.90');
    const trailheads = map.trailheadIndices();
    const peaks = map.peakIndices();

    expect(trailheads).toEqual([1, 5]);
    expect(peaks).toEqual([0, 4]);
    expect(Object.isFrozen(trailheads)).toBe(true);
    expect(Object.isFrozen(peaks)).toBe(true);

    const bare = parseTopographicMap('12\n34');
    expect(bare.trailheadIndices()).toEqual([]);
    expect(bare.peakIndices()).toEqual([]);
  });

  it('rejects empty grid input', () => {
    expect(() => parseTopographicMap('')).toThrow();
    expect(() => parseTopographicMap('\n\n')).toThrow();
  });

  it('rejects jagged rows', () => {
    expect(() => parseTopographicMap('012\n34')).toThrow(/length 2, expected 3/);
  });

  it('rejects invalid characters with row and column coordinates', () => {
    expect(() => parseTopographicMap('012\n3x5')).toThrow(/Invalid height.*\(1, 1\)/);
    expect(() => parseTopographicMap('0 2')).toThrow(/Invalid height.*\(0, 1\)/);
  });

  it('throws RangeError when indexOf receives out-of-bounds or non-integer coordinates', () => {
    const map = parseTopographicMap('01\n23');
    expect(() => map.indexOf(-1, 0)).toThrow(RangeError);
    expect(() => map.indexOf(2, 0)).toThrow(RangeError);
    expect(() => map.indexOf(0, -1)).toThrow(RangeError);
    expect(() => map.indexOf(0, 2)).toThrow(RangeError);
    expect(() => map.indexOf(0.5, 0)).toThrow(RangeError);
  });

  it('throws RangeError when coordsOf or heightAtIndex receives invalid indices', () => {
    const map = parseTopographicMap('01\n23');
    expect(() => map.coordsOf(-1)).toThrow(RangeError);
    expect(() => map.coordsOf(4)).toThrow(RangeError);
    expect(() => map.coordsOf(1.5)).toThrow(RangeError);
    expect(() => map.coordsOf(Number.NaN)).toThrow(RangeError);
    expect(() => map.heightAtIndex(-1)).toThrow(RangeError);
    expect(() => map.heightAtIndex(4)).toThrow(RangeError);
  });
});
