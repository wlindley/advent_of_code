import { describe, expect, it } from 'vitest';
import { ClosedInterval, IntervalUnion } from '../../../../shared/core';
import { TilePoint } from '../../shared';
import { findLargestInscribedRectangle } from './index';

const pt = (x: number, y: number) => new TilePoint(BigInt(x), BigInt(y));

function oracle2xFloodBrute(points: readonly TilePoint[]): bigint {
  const xs = points.map((p) => Number(p.x)), ys = points.map((p) => Number(p.y));
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const w2 = 2 * (maxX - minX + 1) + 3, h2 = 2 * (maxY - minY + 1) + 3;
  const cell = new Uint8Array(w2 * h2);
  const to2X = (x: number) => 2 * (x - minX) + 2, to2Y = (y: number) => 2 * (y - minY) + 2;
  for (let i = 0; i < points.length; i++) {
    const a = points[i]!, b = points[(i + 1) % points.length]!;
    let x = to2X(Number(a.x)), y = to2Y(Number(a.y));
    const tx = to2X(Number(b.x)), ty = to2Y(Number(b.y)), dx = Math.sign(tx - x), dy = Math.sign(ty - y);
    cell[y * w2 + x] = 1;
    while (x !== tx || y !== ty) { x += dx; y += dy; cell[y * w2 + x] = 1; }
  }
  const qx = [0], qy = [0];
  cell[0] = 2;
  for (let head = 0; head < qx.length; head++) {
    const x = qx[head]!, y = qy[head]!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < w2 && ny >= 0 && ny < h2 && cell[ny * w2 + nx] === 0) { cell[ny * w2 + nx] = 2; qx.push(nx); qy.push(ny); }
    }
  }
  let best = 0n;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const x1 = Math.min(xs[i]!, xs[j]!), x2 = Math.max(xs[i]!, xs[j]!), y1 = Math.min(ys[i]!, ys[j]!), y2 = Math.max(ys[i]!, ys[j]!);
      let ok = true;
      for (let y = y1; y <= y2 && ok; y++) for (let x = x1; x <= x2; x++) if (cell[to2Y(y) * w2 + to2X(x)] === 2) { ok = false; break; }
      if (ok) { const area = BigInt(x2 - x1 + 1) * BigInt(y2 - y1 + 1); if (area > best) best = area; }
    }
  }
  return best;
}

function oracleIntervalBands(points: readonly TilePoint[]): bigint {
  const ys = Array.from(new Set(points.map((p) => p.y))).sort((a, b) => (a < b ? -1 : 1));
  const edges = points.map((a, i) => ({ a, b: points[(i + 1) % points.length]! }));
  const parityIntervals = (ySample: bigint): ClosedInterval[] => {
    const xs = edges
      .filter((e) => e.a.x === e.b.x && (e.a.y < e.b.y ? e.a.y <= ySample && ySample < e.b.y : e.b.y <= ySample && ySample < e.a.y))
      .map((e) => e.a.x).sort((a, b) => (a < b ? -1 : 1));
    return Array.from({ length: xs.length / 2 }, (_, k) => new ClosedInterval(xs[2 * k]!, xs[2 * k + 1]!));
  };
  const bands: { yMin: bigint; yMax: bigint; union: IntervalUnion }[] = [];
  for (let k = 0; k < ys.length; k++) {
    const y = ys[k]!, ivs = parityIntervals(y);
    for (const { a, b } of edges) {
      if (a.y === b.y && a.y === y) ivs.push(new ClosedInterval(a.x < b.x ? a.x : b.x, a.x > b.x ? a.x : b.x));
      else if (a.x === b.x && (a.y < b.y ? a.y <= y && y <= b.y : b.y <= y && y <= a.y)) ivs.push(new ClosedInterval(a.x, a.x));
    }
    bands.push({ yMin: y, yMax: y, union: new IntervalUnion(ivs) });
    if (k + 1 < ys.length && ys[k + 1]! - y > 1n) bands.push({ yMin: y + 1n, yMax: ys[k + 1]! - 1n, union: new IntervalUnion(parityIntervals(y)) });
  }
  let best = 0n;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const p = points[i]!, q = points[j]!;
      const x1 = p.x < q.x ? p.x : q.x, x2 = p.x > q.x ? p.x : q.x, y1 = p.y < q.y ? p.y : q.y, y2 = p.y > q.y ? p.y : q.y;
      if (bands.every((b) => b.yMax < y1 || b.yMin > y2 || (b.union.findContaining(x1)?.end ?? x1 - 1n) >= x2)) {
        const area = (x2 - x1 + 1n) * (y2 - y1 + 1n);
        if (area > best) best = area;
      }
    }
  }
  return best;
}

describe('Differential Oracles for Day 09 Part 2', () => {
  it('matches 2x-upscaled exterior BFS brute-force oracle across 30 diverse orthogonal polygons', () => {
    const polygons: TilePoint[][] = [
      [pt(7, 1), pt(11, 1), pt(11, 7), pt(9, 7), pt(9, 5), pt(2, 5), pt(2, 3), pt(7, 3)],
      [pt(0, 0), pt(6, 0), pt(6, 4), pt(4, 4), pt(4, 2), pt(2, 2), pt(2, 4), pt(0, 4)],
      [pt(0, 0), pt(5, 0), pt(5, 5), pt(3, 5), pt(3, 3), pt(4, 3), pt(4, 1), pt(1, 1), pt(1, 3), pt(2, 3), pt(2, 5), pt(0, 5)],
      [pt(0, 0), pt(3, 0), pt(3, 2), pt(6, 2), pt(6, 4), pt(9, 4), pt(9, 7), pt(0, 7)],
      [pt(0, 0), pt(4, 0), pt(8, 0), pt(8, 2), pt(8, 5), pt(5, 5), pt(5, 2), pt(3, 2), pt(3, 5), pt(0, 5)],
    ];
    let seed = 1337;
    const nextInt = (max: number) => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) % max);
    for (let k = 0; k < 25; k++) {
      const teeth = 2 + (k % 4), pts: TilePoint[] = [pt(0, 0), pt(teeth * 4, 0)];
      for (let t = 0, x = teeth * 4; t < teeth; t++, x -= 4) {
        const yDeep = 2 + nextInt(4), yTip = 7 + nextInt(4), notchW = k % 2 === 0 ? 2 : 3;
        pts.push(pt(x, yTip), pt(x - notchW, yTip), pt(x - notchW, yDeep), pt(x - 4, yDeep));
      }
      polygons.push(pts);
    }
    for (const poly of polygons) expect(findLargestInscribedRectangle(poly).match.rect.area).toBe(oracle2xFloodBrute(poly));
  });

  it('matches sparse IntervalUnion horizontal-band oracle on 10^9n coordinate polygons', () => {
    const S = 10n ** 9n;
    const pacman = [[0, 0], [10, 0], [10, 3], [2, 3], [2, 5], [10, 5], [10, 8], [0, 8]]
      .map(([x, y]) => new TilePoint(BigInt(x!) * S, BigInt(y!) * S));
    const staircase = [[0, 0], [3, 0], [3, 2], [7, 2], [7, 5], [11, 5], [11, 9], [0, 9]]
      .map(([x, y]) => new TilePoint(BigInt(x!) * S - S, BigInt(y!) * S));
    expect(findLargestInscribedRectangle(pacman).match.rect.area).toBe(oracleIntervalBands(pacman));
    expect(findLargestInscribedRectangle(staircase).match.rect.area).toBe(oracleIntervalBands(staircase));
  });
});
