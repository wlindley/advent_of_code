import { describe, expect, it } from 'vitest';
import { CavePoint, CaveScan, parseCaveScan, RockPath, SOURCE_X, SOURCE_Y } from './caveScan';

describe('CavePoint', () => {
  it('stores integer coordinates including negative x and y=0', () => {
    const p = new CavePoint(-5, 0);
    expect(p.x).toBe(-5);
    expect(p.y).toBe(0);
    expect(Object.isFrozen(p)).toBe(true);
    expect(SOURCE_X).toBe(500);
    expect(SOURCE_Y).toBe(0);
  });

  it('rejects non-integer x or negative/non-integer y', () => {
    expect(() => new CavePoint(1.5, 0)).toThrow(RangeError);
    expect(() => new CavePoint(0, -1)).toThrow(RangeError);
    expect(() => new CavePoint(0, 2.2)).toThrow(RangeError);
  });
});

describe('RockPath', () => {
  it('supports single-point and multi-segment axis-aligned paths', () => {
    const single = new RockPath([new CavePoint(500, 3)]);
    expect(single.segmentCount).toBe(0);
    expect(Object.isFrozen(single.points)).toBe(true);
    const multi = new RockPath([new CavePoint(498, 4), new CavePoint(498, 6), new CavePoint(496, 6)]);
    expect(multi.segmentCount).toBe(2);
  });

  it('rejects empty paths and diagonal segments', () => {
    expect(() => new RockPath([])).toThrow(RangeError);
    expect(() => new RockPath([new CavePoint(498, 4), new CavePoint(499, 5)])).toThrow(Error);
  });
});

describe('CaveScan and parseCaveScan', () => {
  it('rejects empty CaveScan and blank input', () => {
    expect(() => new CaveScan([])).toThrow(RangeError);
    expect(() => parseCaveScan('   \n  \r\n ')).toThrow(Error);
  });

  it('rejects malformed point tokens', () => {
    expect(() => parseCaveScan('498,4 -> bad')).toThrow(Error);
    expect(() => parseCaveScan('498,4 -> ')).toThrow(Error);
  });

  it('parses example scan and computes dynamic bounds', () => {
    const scan = parseCaveScan('498,4 -> 498,6 -> 496,6\r\n\r\n  503,4 -> 502,4 -> 502,9 -> 494,9  \n');
    expect(scan.paths).toHaveLength(2);
    expect(scan.minX).toBe(494);
    expect(scan.maxX).toBe(503);
    expect(scan.maxY).toBe(9);
    expect(scan.segmentCount).toBe(5);
    expect(Object.isFrozen(scan)).toBe(true);
    expect(Object.isFrozen(scan.paths)).toBe(true);
  });
});
