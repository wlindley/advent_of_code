import { describe, expect, it } from 'vitest';
import { AsteroidMap } from './asteroidMap';
import { AsteroidPoint } from './geometry';

describe('AsteroidMap', () => {
  it('parses valid rectangular maps in row-major order and freezes fields', () => {
    const map = AsteroidMap.parse('.#..\n..#.\n');
    expect(map.width).toBe(4);
    expect(map.height).toBe(2);
    expect(map.asteroidCount).toBe(2);
    expect(Object.isFrozen(map)).toBe(true);
    expect(Object.isFrozen(map.asteroids)).toBe(true);
    expect(map.asteroidAt(0)).toEqual(new AsteroidPoint(1, 0));
    expect(map.asteroidAt(1)).toEqual(new AsteroidPoint(2, 1));
  });

  it('handles CRLF line endings and single-cell asteroid maps', () => {
    const single = AsteroidMap.parse('#');
    expect(single.width).toBe(1);
    expect(single.height).toBe(1);
    expect(single.asteroidCount).toBe(1);
    expect(single.asteroidAt(0)).toEqual(new AsteroidPoint(0, 0));

    const crlf = AsteroidMap.parse('.#\r\n#.\r\n');
    expect(crlf.width).toBe(2);
    expect(crlf.height).toBe(2);
    expect(crlf.asteroidCount).toBe(2);
  });

  it('rejects empty, ragged, invalid-character, and zero-asteroid inputs', () => {
    expect(() => AsteroidMap.parse('')).toThrow(RangeError);
    expect(() => AsteroidMap.parse('   \n\t ')).toThrow(RangeError);
    expect(() => AsteroidMap.parse('#.\n#')).toThrow(RangeError);
    expect(() => AsteroidMap.parse('#.\n\n.#')).toThrow(RangeError);
    expect(() => AsteroidMap.parse('#x\n..')).toThrow(RangeError);
    expect(() => AsteroidMap.parse('..\n..')).toThrow(RangeError);
  });

  it('enforces constructor invariants and asteroidAt bounds', () => {
    const p0 = new AsteroidPoint(0, 0);
    const p1 = new AsteroidPoint(1, 0);
    const p2 = new AsteroidPoint(0, 1);

    expect(() => new AsteroidMap(0, 1, [p0])).toThrow(RangeError);
    expect(() => new AsteroidMap(1, 0, [p0])).toThrow(RangeError);
    expect(() => new AsteroidMap(1.5, 1, [p0])).toThrow(RangeError);
    expect(() => new AsteroidMap(2, 2, [])).toThrow(RangeError);
    expect(() => new AsteroidMap(1, 2, [p1])).toThrow(RangeError);
    expect(() => new AsteroidMap(2, 1, [p2])).toThrow(RangeError);
    expect(() => new AsteroidMap(2, 2, [p1, p0])).toThrow(RangeError);
    expect(() => new AsteroidMap(2, 2, [p0, p0])).toThrow(RangeError);
    expect(() => new AsteroidMap(2, 2, [p2, p1])).toThrow(RangeError);

    const valid = new AsteroidMap(2, 2, [p0, p2]);
    expect(() => valid.asteroidAt(-1)).toThrow(RangeError);
    expect(() => valid.asteroidAt(2)).toThrow(RangeError);
    expect(() => valid.asteroidAt(0.5)).toThrow(RangeError);
  });
});
