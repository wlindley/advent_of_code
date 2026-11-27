import { describe, expect, it } from 'vitest';
import { createVaporizationTargetPolicy, MonitoringStationSolver } from '../../shared';
import { solver } from './index';

interface Pt { readonly x: number; readonly y: number; }
interface RayGroup { readonly angle: number; readonly items: { distSq: number; code: number }[]; }

const EX5 = [
  '.#..##.###...#######', '##.############..##.', '.#.######.########.#', '.###.#######.####.#.', '#####.##.#.##.###.##',
  '..#####..#.#########', '####################', '#.####....###.#.#.##', '##.#################', '#####.##.###..####..',
  '..######..##.#######', '####.##.####...##..#', '.#####..#.######.###', '##...#.##########...', '#.##########.#######',
  '.####.#.###.###.#.##', '....##.##.###..#####', '.#.#.###########.###', '#.#.#.#####.####.###', '###.##.####.##.#..##',
].join('\n');

const SMALL_LASER = [
  '.#....#####...#..', '##...##.#####..##', '##...#...#.#####.',
  '..#.....#...###..', '..#.#.....#....##',
].join('\n');

function clockwiseAngle(dx: number, dy: number): number {
  const raw = Math.atan2(dx, -dy);
  return (raw < 0 ? raw + 2 * Math.PI : raw) + 0;
}

function compareByDist(a: { distSq: number }, b: { distSq: number }): number { return a.distSq - b.distSq; }
function compareByAngle(a: RayGroup, b: RayGroup): number { return a.angle - b.angle; }

function oracleSelectBestStation(pts: readonly Pt[]): number {
  let bestIdx = 0, bestCount = -1;
  const seen = new Set<number>();
  for (let i = 0; i < pts.length; i += 1) {
    seen.clear();
    const a = pts[i]!;
    for (let j = 0; j < pts.length; j += 1) {
      if (i !== j) seen.add(Math.round(clockwiseAngle(pts[j]!.x - a.x, pts[j]!.y - a.y) * 1e12));
    }
    if (seen.size > bestCount) { bestCount = seen.size; bestIdx = i; }
  }
  return bestIdx;
}

function oracleSolveNth(pts: readonly Pt[], targetOrder: number): number {
  const bestIdx = oracleSelectBestStation(pts);
  const st = pts[bestIdx]!;
  const groups = new Map<number, RayGroup>();
  for (let i = 0; i < pts.length; i += 1) {
    if (i === bestIdx) continue;
    const p = pts[i]!, dx = p.x - st.x, dy = p.y - st.y;
    const angle = clockwiseAngle(dx, dy);
    const key = Math.round(angle * 1e12);
    let g = groups.get(key);
    if (!g) { g = { angle, items: [] }; groups.set(key, g); }
    g.items.push({ distSq: dx * dx + dy * dy, code: p.x * 100 + p.y });
  }
  const sorted = Array.from(groups.values()).sort(compareByAngle);
  for (const g of sorted) g.items.sort(compareByDist);
  let count = 0;
  for (let sweep = 0; count < targetOrder; sweep += 1) {
    for (const g of sorted) {
      if (sweep < g.items.length && ++count === targetOrder) return g.items[sweep]!.code;
    }
  }
  return -1;
}

function generateGrid(rng: { s: number }, w: number, h: number, density: number): { raw: string; pts: Pt[] } {
  const rows: string[] = [];
  const pts: Pt[] = [];
  for (let y = 0; y < h; y += 1) {
    let row = '';
    for (let x = 0; x < w; x += 1) {
      rng.s = (Math.imul(1664525, rng.s) + 1013904223) >>> 0;
      const hit = rng.s / 4294967296 < density;
      row += hit ? '#' : '.';
      if (hit) pts.push({ x, y });
    }
    rows.push(row);
  }
  return { raw: rows.join('\n'), pts };
}

describe('2019 Day 10 Part 2 solver', () => {
  it('solves official 20x20 EX5 (802) and produces bounded VaporizationTraceFrame traces', () => {
    const map = solver.parse(EX5);
    expect(solver.solve(map)).toBe(802);

    const omitted = solver.trace(map);
    expect(omitted).toHaveLength(100);
    expect(omitted[0]!.activeEvent).toBeNull();
    const last = omitted[omitted.length - 1]!;
    expect(last.activeEvent?.order).toBe(299);
    expect(last.activeEvent?.target).toEqual({ x: 11, y: 1 });

    expect(solver.trace(map, { maxSteps: 15 })).toHaveLength(15);
    const single = solver.trace(map, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]!.activeEvent?.order).toBe(299);
  });

  it('solves 17x5 SMALL_LASER targets and traces 3 clockwise sweeps (0, 1, 2)', () => {
    const checkpoints: readonly [number, number][] = [[1, 801], [9, 1501], [31, 800], [36, 1403]];
    for (const [k, expected] of checkpoints) {
      const s = new MonitoringStationSolver(createVaporizationTargetPolicy(k));
      expect(s.solve(s.parse(SMALL_LASER))).toBe(expected);
    }
    const s36 = new MonitoringStationSolver(createVaporizationTargetPolicy(36));
    const trace = s36.trace(s36.parse(SMALL_LASER));
    expect(trace).toHaveLength(37);
    const finalSweeps = trace[36]!.vaporized;
    expect([finalSweeps[0]!.sweepIndex, finalSweeps[30]!.sweepIndex, finalSweeps[35]!.sweepIndex]).toEqual([0, 1, 2]);
  });

  it('enforces target-count, parse, and maxSteps error boundaries', () => {
    const exact200 = `${'#'.repeat(20)}\n`.repeat(10).trimEnd();
    expect(() => solver.solve(solver.parse(exact200))).toThrow(RangeError);
    expect(() => solver.solve(solver.parse(SMALL_LASER))).toThrow(RangeError);
    expect(() => solver.parse('')).toThrow(RangeError);
    expect(() => solver.parse('#.\n#')).toThrow(RangeError);
    expect(() => solver.parse('#@\n..')).toThrow(RangeError);
    expect(() => solver.parse('..\n..')).toThrow(RangeError);
    const map = solver.parse(SMALL_LASER);
    expect(() => solver.trace(map, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => solver.trace(map, { maxSteps: 1.5 })).toThrow(RangeError);
  });

  it('matches independent quantized-polar oracle on 20 dense and 5 full-scale grids', () => {
    const rng = { s: 20191020 };
    for (let i = 0; i < 20; i += 1) {
      const w = 7 + (i % 4), h = 7 + ((i * 3) % 4);
      const { raw, pts } = generateGrid(rng, w, h, 0.72);
      const k = 1 + ((i * 11) % (pts.length - 1));
      const s = new MonitoringStationSolver(createVaporizationTargetPolicy(k));
      expect(s.solve(s.parse(raw))).toBe(oracleSolveNth(pts, k));
    }
    for (let i = 0; i < 5; i += 1) {
      const w = 16 + (i % 4), h = 16 + ((i + 1) % 4);
      const { raw, pts } = generateGrid(rng, w, h, 220 / (w * h));
      expect(pts.length).toBeGreaterThanOrEqual(205);
      expect(pts.length).toBeLessThanOrEqual(234);
      expect(solver.solve(solver.parse(raw))).toBe(oracleSolveNth(pts, 200));
    }
  });
});
