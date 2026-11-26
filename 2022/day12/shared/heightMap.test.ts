import { describe, expect, it } from 'vitest';
import { HeightMap, parseHeightMap } from './index';

const OFFICIAL_EXAMPLE = [
  'Sabqponm',
  'abcryxxl',
  'accszExk',
  'acctuvwj',
  'abdefghi',
].join('\n');

describe('parseHeightMap', () => {
  it('parses the official 5x8 example with S=0 at (0,0) and E=25 at (2,5)', () => {
    const map = parseHeightMap(OFFICIAL_EXAMPLE);
    expect(map.rows).toBe(5);
    expect(map.cols).toBe(8);
    expect(map.size).toBe(40);
    expect(map.startIndex).toBe(0);
    expect(map.goalIndex).toBe(2 * 8 + 5);
    expect(map.heightAt(0, 0)).toBe(0);
    expect(map.heightAt(2, 5)).toBe(25);
    expect(map.heightAt(2, 4)).toBe(25);
    expect(map.heightAt(4, 7)).toBe(8);
    expect(map.coordsOf(map.goalIndex)).toEqual([2, 5]);
    expect(map.indexOf(2, 5)).toBe(21);
    expect(Object.isFrozen(map)).toBe(true);
  });

  it('handles CRLF line endings and trailing blank lines', () => {
    const map = parseHeightMap('Sab\r\ncdE\r\n\r\n');
    expect(map.rows).toBe(2);
    expect(map.cols).toBe(3);
    expect(map.heightAt(1, 0)).toBe(2);
    expect(map.heightAt(1, 2)).toBe(25);
  });

  it('supports 1x26 horizontal and 26x1 vertical corridors', () => {
    const horiz = parseHeightMap('SbcdefghijklmnopqrstuvwxyE');
    expect(horiz.rows).toBe(1);
    expect(horiz.cols).toBe(26);
    expect(horiz.heightAtIndex(0)).toBe(0);
    expect(horiz.heightAtIndex(25)).toBe(25);

    const vert = parseHeightMap('SbcdefghijklmnopqrstuvwxyE'.split('').join('\n'));
    expect(vert.rows).toBe(26);
    expect(vert.cols).toBe(1);
    expect(vert.heightAt(25, 0)).toBe(25);
  });

  it('rejects empty input and blank first lines', () => {
    expect(() => parseHeightMap('')).toThrow(/empty/i);
    expect(() => parseHeightMap('\r\n\n')).toThrow(/empty/i);
    expect(() => parseHeightMap('\nabc')).toThrow(/row 0/i);
  });

  it('rejects ragged grids, invalid characters, and missing or duplicate S/E', () => {
    expect(() => parseHeightMap('Sab\ncd')).toThrow(/length 2, expected 3/);
    expect(() => parseHeightMap('Sa1\ncdE')).toThrow(/invalid character/i);
    expect(() => parseHeightMap('aab\ncdE')).toThrow(/missing.*S/i);
    expect(() => parseHeightMap('Sab\ncdz')).toThrow(/missing.*E/i);
    expect(() => parseHeightMap('SSb\ncdE')).toThrow(/duplicate.*S/i);
    expect(() => parseHeightMap('Sab\ncEE')).toThrow(/duplicate.*E/i);
  });
});

describe('HeightMap invariants and lookups', () => {
  it('defensively copies heights without freezing the underlying typed array', () => {
    const raw = new Uint8Array([0, 1, 2, 25]);
    const map = new HeightMap(2, 2, raw, 0, 3);
    raw[1] = 20;
    expect(map.heightAtIndex(1)).toBe(1);
    expect(Object.isFrozen(map)).toBe(true);
  });

  it('validates dimensions, heights length, height range, and start/goal indices', () => {
    const valid = new Uint8Array([0, 1, 2, 25]);
    expect(() => new HeightMap(0, 2, valid, 0, 3)).toThrow(RangeError);
    expect(() => new HeightMap(2, -1, valid, 0, 3)).toThrow(RangeError);
    expect(() => new HeightMap(1.5, 2, valid, 0, 1)).toThrow(RangeError);
    expect(() => new HeightMap(2, 3, valid, 0, 3)).toThrow(RangeError);
    expect(() => new HeightMap(2, 2, new Uint8Array([0, 26, 2, 25]), 0, 3)).toThrow(RangeError);
    expect(() => new HeightMap(2, 2, valid, -1, 3)).toThrow(RangeError);
    expect(() => new HeightMap(2, 2, valid, 4, 3)).toThrow(RangeError);
    expect(() => new HeightMap(2, 2, valid, 0.5, 3)).toThrow(RangeError);
    expect(() => new HeightMap(2, 2, valid, 0, -1)).toThrow(RangeError);
    expect(() => new HeightMap(2, 2, valid, 0, 4)).toThrow(RangeError);
    expect(() => new HeightMap(2, 2, valid, 0, 1.5)).toThrow(RangeError);
    expect(() => new HeightMap(2, 2, valid, 2, 2)).toThrow(/distinct/i);
  });

  it('checks bounds on inBounds, indexOf, coordsOf, heightAtIndex, and heightAt', () => {
    const map = parseHeightMap('Sa\nbE');
    expect(map.inBounds(0, 0)).toBe(true);
    expect(map.inBounds(-1, 0)).toBe(false);
    expect(map.inBounds(2, 0)).toBe(false);
    expect(map.inBounds(0, -1)).toBe(false);
    expect(map.inBounds(0, 2)).toBe(false);
    expect(map.inBounds(0.5, 0)).toBe(false);
    expect(() => map.indexOf(2, 0)).toThrow(RangeError);
    expect(() => map.heightAt(-1, 0)).toThrow(RangeError);
    expect(() => map.heightAtIndex(-1)).toThrow(RangeError);
    expect(() => map.heightAtIndex(4)).toThrow(RangeError);
    expect(() => map.coordsOf(1.5)).toThrow(RangeError);
  });
});
