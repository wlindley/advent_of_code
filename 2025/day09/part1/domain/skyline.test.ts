import { describe, expect, it } from 'vitest';
import {
  extractSwNeFrontiers,
  searchMonotoneMax,
  type IndexedTile,
  type MonotoneProbe,
} from './skyline';

function tile(index: number, x: bigint, y: bigint): IndexedTile {
  return { index, x, y };
}

describe('extractSwNeFrontiers', () => {
  it('throws on an empty tile list', () => {
    expect(() => extractSwNeFrontiers([])).toThrow();
  });

  it('handles a single tile in both frontiers', () => {
    const res = extractSwNeFrontiers([tile(0, 5n, 9n)]);
    expect(Object.isFrozen(res)).toBe(true);
    expect(Object.isFrozen(res.sw)).toBe(true);
    expect(Object.isFrozen(res.ne)).toBe(true);
    expect(res.sw).toEqual([tile(0, 5n, 9n)]);
    expect(res.ne).toEqual([tile(0, 5n, 9n)]);
  });

  it('sorts by (x ASC, y ASC, index ASC) and keeps min index on sw and max index on ne for duplicates', () => {
    const tiles = [
      tile(3, 4n, 2n),
      tile(2, 2n, 5n),
      tile(1, 2n, 5n),
      tile(0, 2n, 8n),
      tile(5, 4n, 7n),
      tile(4, 4n, 7n),
    ];
    const { sw, ne } = extractSwNeFrontiers(tiles);
    expect(sw).toEqual([tile(1, 2n, 5n), tile(3, 4n, 2n)]);
    expect(ne).toEqual([tile(0, 2n, 8n), tile(5, 4n, 7n)]);
  });
});

describe('searchMonotoneMax', () => {
  it('returns immediately when either frontier is empty', () => {
    const probes: MonotoneProbe[] = [];
    searchMonotoneMax({ sw: [], ne: [] }, (p) => probes.push(p));
    searchMonotoneMax({ sw: [tile(0, 1n, 1n)], ne: [] }, (p) => probes.push(p));
    expect(probes).toEqual([]);
  });

  it('emits self-match when only a single shared point exists', () => {
    const frontiers = extractSwNeFrontiers([tile(4, 3n, 3n)]);
    const probes: MonotoneProbe[] = [];
    searchMonotoneMax(frontiers, (p) => probes.push(p));
    expect(probes).toEqual([
      { probeIndex: 4, matchedIndex: 4, windowStart: 0, windowEnd: 0, score: 1n },
    ]);
  });

  it('updates bestScore selectively across multi-element frontiers and narrows D&C windows', () => {
    const frontiers = extractSwNeFrontiers([
      tile(0, 1n, 6n),
      tile(1, 2n, 3n),
      tile(2, 5n, 1n),
      tile(3, 4n, 8n),
      tile(4, 7n, 7n),
      tile(5, 9n, 2n),
    ]);
    const probes: MonotoneProbe[] = [];
    searchMonotoneMax(frontiers, (p) => probes.push(p));

    expect(probes.length).toBe(frontiers.sw.length);
    const maxScore = probes.reduce((m, p) => (p.score > m ? p.score : m), 0n);
    // (1,6)->(7,7) is 7*2=14; (2,3)->(7,7) is 6*5=30; (5,1)->(7,7) is 3*7=21
    expect(maxScore).toBe(30n);
    expect(probes.some((p) => p.probeIndex === 1 && p.matchedIndex === 4 && p.score === 30n)).toBe(true);
  });
});
