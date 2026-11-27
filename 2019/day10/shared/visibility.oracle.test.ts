import { describe, expect, it } from 'vitest';
import { AsteroidMap } from './asteroidMap';
import { analyzeVisibility, computeVaporizationSchedule, computeVisibilityCounts } from './visibility';

function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function randomMap(rng: () => number, width: number, height: number, density: number): AsteroidMap {
  const rows: string[] = [];
  let hasAsteroid = false;
  for (let y = 0; y < height; y += 1) {
    let row = '';
    for (let x = 0; x < width; x += 1) {
      const put = rng() < density;
      if (put) hasAsteroid = true;
      row += put ? '#' : '.';
    }
    rows.push(row);
  }
  if (!hasAsteroid) rows[0] = `#${rows[0]!.slice(1)}`;
  return AsteroidMap.parse(rows.join('\n'));
}

function oracleVisibilityCounts(map: AsteroidMap): number[] {
  const pts = map.asteroids;
  return pts.map((a, i) => {
    let visible = 0;
    for (let j = 0; j < pts.length; j += 1) {
      if (i === j) continue;
      const b = pts[j]!;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      let blocked = false;
      for (let k = 0; k < pts.length; k += 1) {
        if (k === i || k === j) continue;
        const c = pts[k]!;
        const cx = c.x - a.x;
        const cy = c.y - a.y;
        const cross = dx * cy - dy * cx;
        const dot = dx * cx + dy * cy;
        const lenSq = dx * dx + dy * dy;
        if (cross === 0 && dot > 0 && dot < lenSq) {
          blocked = true;
          break;
        }
      }
      if (!blocked) visible += 1;
    }
    return visible;
  });
}

function oracleVaporization(map: AsteroidMap, stationIndex: number): number[] {
  const station = map.asteroidAt(stationIndex);
  const remaining = map.asteroids.filter((_, idx) => idx !== stationIndex);
  const items = remaining.map((pt) => {
    const dx = pt.x - station.x;
    const dy = pt.y - station.y;
    let angle = Math.atan2(dx, -dy);
    if (angle < 0) angle += 2 * Math.PI;
    return { code: pt.coordinateCode, angle, distSq: dx * dx + dy * dy };
  });
  const ordered: number[] = [];
  let pool = items;
  while (pool.length > 0) {
    pool.sort((a, b) => a.angle - b.angle || a.distSq - b.distSq);
    const nextPool: typeof pool = [];
    let lastAngle = -1;
    for (const item of pool) {
      if (lastAngle < 0 || Math.abs(item.angle - lastAngle) > 1e-12) {
        ordered.push(item.code);
        lastAngle = item.angle;
      } else {
        nextPool.push(item);
      }
    }
    pool = nextPool;
  }
  return ordered;
}

describe('visibility differential oracles', () => {
  it('matches O(A^3) segment-collinearity oracle across 30 random non-square grids', () => {
    const rng = makeRng(20191001);
    for (let trial = 0; trial < 30; trial += 1) {
      const width = 2 + Math.floor(rng() * 11);
      const height = 2 + Math.floor(rng() * 11);
      const map = randomMap(rng, width, height, 0.25 + rng() * 0.5);
      expect(computeVisibilityCounts(map)).toEqual(oracleVisibilityCounts(map));
    }
  });

  it('matches atan2(dx, -dy) polar sweep oracle across 25 random grids', () => {
    const rng = makeRng(20191002);
    for (let trial = 0; trial < 25; trial += 1) {
      const width = 3 + Math.floor(rng() * 12);
      const height = 3 + Math.floor(rng() * 12);
      const map = randomMap(rng, width, height, 0.35 + rng() * 0.45);
      const bestIdx = analyzeVisibility(map).bestIndex;
      const actual = computeVaporizationSchedule(map, bestIdx).map((e) => e.coordinateCode);
      expect(actual).toEqual(oracleVaporization(map, bestIdx));
    }
  });
});
