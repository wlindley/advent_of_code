import { describe, expect, it } from 'vitest';
import { TilePoint, TileRect, parseTilePoints } from './index';

describe('TilePoint', () => {
  it('stores frozen bigint coordinates including negative and >2^53 values', () => {
    const big = 9007199254740993123n;
    const p = new TilePoint(-42n, big);
    expect(p.x).toBe(-42n);
    expect(p.y).toBe(big);
    expect(Object.isFrozen(p)).toBe(true);
  });

  it('checks equality across matching, different x, and different y', () => {
    const a = new TilePoint(3n, 5n);
    expect(a.equals(new TilePoint(3n, 5n))).toBe(true);
    expect(a.equals(new TilePoint(4n, 5n))).toBe(false);
    expect(a.equals(new TilePoint(3n, 6n))).toBe(false);
  });
});

describe('TileRect', () => {
  it('computes identical bounds and inclusive area for all 4 corner orderings', () => {
    const orderings = [
      [new TilePoint(2n, 5n), new TilePoint(11n, 1n)],
      [new TilePoint(11n, 1n), new TilePoint(2n, 5n)],
      [new TilePoint(2n, 1n), new TilePoint(11n, 5n)],
      [new TilePoint(11n, 5n), new TilePoint(2n, 1n)],
    ] as const;
    for (const [a, b] of orderings) {
      const r = new TileRect(a, b);
      expect(Object.isFrozen(r)).toBe(true);
      expect([r.minX, r.maxX, r.minY, r.maxY]).toEqual([2n, 11n, 1n, 5n]);
      expect([r.width, r.height, r.area]).toEqual([10n, 5n, 50n]);
    }
  });

  it('handles degenerate 1x1, horizontal, and vertical rectangles', () => {
    expect(new TileRect(new TilePoint(7n, 7n), new TilePoint(7n, 7n)).area).toBe(1n);
    expect(new TileRect(new TilePoint(2n, 3n), new TilePoint(7n, 3n)).area).toBe(6n);
    expect(new TileRect(new TilePoint(4n, 1n), new TilePoint(4n, 5n)).area).toBe(5n);
  });

  it('computes bounding rectangle for single and multiple points and rejects empty', () => {
    expect(() => TileRect.bounding([])).toThrow();
    expect(TileRect.bounding([new TilePoint(-5n, 9n)]).area).toBe(1n);
    const multi = TileRect.bounding([
      new TilePoint(7n, 1n),
      new TilePoint(-3n, 8n),
      new TilePoint(11n, -2n),
      new TilePoint(2n, 3n),
    ]);
    expect([multi.minX, multi.maxX, multi.minY, multi.maxY]).toEqual([-3n, 11n, -2n, 8n]);
  });
});

describe('parseTilePoints', () => {
  it('preserves vertex order, trims outer CRLF whitespace, and parses huge BigInts', () => {
    const raw = '\r\n7,1\r\n11,1\r\n-1000000000000000000,9007199254740999999\r\n\r\n';
    const pts = parseTilePoints(raw);
    expect(Object.isFrozen(pts)).toBe(true);
    expect(pts.map((p) => [p.x, p.y])).toEqual([
      [7n, 1n],
      [11n, 1n],
      [-1000000000000000000n, 9007199254740999999n],
    ]);
  });

  it('rejects empty input, wrong token counts, and invalid x or y tokens', () => {
    for (const bad of ['   \r\n  ', '1,2,3', '10', '1 ,2', '1a,2', '1, 2', '1,two']) {
      expect(() => parseTilePoints(bad)).toThrow();
    }
  });
});
