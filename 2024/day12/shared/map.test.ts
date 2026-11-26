import { describe, expect, it } from 'vitest';
import { Grid2D } from '../../../shared/core';
import { GardenMap, isValidPlant, parseGardenMap } from './map';

describe('isValidPlant', () => {
  it('accepts uppercase A-Z single characters and rejects everything else', () => {
    for (let code = 65; code <= 90; code += 1) {
      expect(isValidPlant(String.fromCharCode(code))).toBe(true);
    }
    expect(isValidPlant('')).toBe(false);
    expect(isValidPlant('a')).toBe(false);
    expect(isValidPlant('AB')).toBe(false);
    expect(isValidPlant('1')).toBe(false);
    expect(isValidPlant('.')).toBe(false);
  });
});

describe('GardenMap and parseGardenMap', () => {
  it('parses valid rectangular grids including 1x1 and CRLF endings', () => {
    const single = parseGardenMap('Z');
    expect(single.rows).toBe(1);
    expect(single.cols).toBe(1);
    expect(single.size).toBe(1);
    expect(single.plantAt(0, 0)).toBe('Z');
    expect(Object.isFrozen(single)).toBe(true);

    const map = parseGardenMap('ABC\r\nXYZ\r\n');
    expect(map.rows).toBe(2);
    expect(map.cols).toBe(3);
    expect(map.size).toBe(6);
    expect(map.plantAt(0, 2)).toBe('C');
    expect(map.plantAt(1, 0)).toBe('X');
  });

  it('supports bounds, indexOf, rowOf, and colOf conversions', () => {
    const map = parseGardenMap('AB\nCD\nEF');
    expect(map.inBounds(0, 0)).toBe(true);
    expect(map.inBounds(2, 1)).toBe(true);
    expect(map.inBounds(-1, 0)).toBe(false);
    expect(map.inBounds(3, 0)).toBe(false);
    expect(map.inBounds(0, -1)).toBe(false);
    expect(map.inBounds(0, 2)).toBe(false);

    expect(map.indexOf(2, 1)).toBe(5);
    expect(map.rowOf(5)).toBe(2);
    expect(map.colOf(5)).toBe(1);
    expect(map.rowOf(0)).toBe(0);
    expect(map.colOf(0)).toBe(0);
  });

  it('rejects invalid plant characters in constructor and parseGardenMap', () => {
    expect(() => new GardenMap(new Grid2D(1, 2, ['A', 'a']))).toThrow('Invalid plant "a" at (0, 1)');
    expect(() => parseGardenMap('AB\nC1')).toThrow('Invalid plant "1" at (1, 1)');
    expect(() => parseGardenMap('')).toThrow();
    expect(() => parseGardenMap('AB\nC')).toThrow();
  });

  it('throws RangeError for out-of-bounds coordinates and cell indices', () => {
    const map = parseGardenMap('AB\nCD');
    expect(() => map.plantAt(-1, 0)).toThrow(RangeError);
    expect(() => map.indexOf(0, 2)).toThrow(RangeError);
    expect(() => map.rowOf(-1)).toThrow(RangeError);
    expect(() => map.colOf(4)).toThrow(RangeError);
    expect(() => map.rowOf(1.5)).toThrow(RangeError);
  });
});
