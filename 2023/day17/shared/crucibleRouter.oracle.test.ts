import { describe, expect, it } from 'vitest';
import { CLUMSY_CRUCIBLE_RULE, CrucibleRule, ULTRA_CRUCIBLE_RULE } from './crucibleRule';
import { CrucibleRouter } from './crucibleRouter';
import { HeatMap, parseHeatMap } from './heatMap';

const DR = [-1, 0, 1, 0] as const;
const DC = [0, 1, 0, -1] as const;

interface HeapNode { readonly state: number; readonly dist: number; }

function pushHeap(heap: HeapNode[], node: HeapNode): void {
  heap.push(node);
  let i = heap.length - 1;
  while (i > 0) {
    const p = (i - 1) >> 1;
    if (heap[p]!.dist <= heap[i]!.dist) break;
    [heap[p], heap[i]] = [heap[i]!, heap[p]!];
    i = p;
  }
}

function popHeap(heap: HeapNode[]): HeapNode {
  const top = heap[0]!;
  const last = heap.pop()!;
  if (heap.length === 0) return top;
  heap[0] = last;
  let i = 0;
  while (true) {
    let best = i;
    const l = 2 * i + 1;
    const r = l + 1;
    if (l < heap.length && heap[l]!.dist < heap[best]!.dist) best = l;
    if (r < heap.length && heap[r]!.dist < heap[best]!.dist) best = r;
    if (best === i) break;
    [heap[i], heap[best]] = [heap[best]!, heap[i]!];
    i = best;
  }
  return top;
}

/** Independent 4D (r, c, dir, run) 1-step-at-a-time binary-heap Dijkstra reference oracle. */
function oracleDijkstra4D(map: HeatMap, rule: CrucibleRule): number {
  if (map.size === 1) return 0;
  const { height: h, width: w } = map;
  const maxRun = rule.maxRun;
  const strideRun = maxRun + 1;
  const dist = new Int32Array(h * w * 4 * strideRun).fill(0x7fffffff);
  const heap: HeapNode[] = [];
    for (const dir of [1, 2] as const) {
      const nr = DR[dir]!;
      const nc = DC[dir]!;
      if (!map.inBounds(nr, nc)) continue;
      const s = ((nr * w + nc) * 4 + dir) * strideRun + 1;
      dist[s] = map.heatAt(nr, nc);
      pushHeap(heap, { state: s, dist: dist[s]! });
    }
  while (heap.length > 0) {
    const { state, dist: d } = popHeap(heap);
    if (d > dist[state]!) continue;
    const run = state % strideRun;
    const tmp = Math.floor(state / strideRun);
    const dir = tmp % 4;
    const cell = Math.floor(tmp / 4);
    const r = Math.floor(cell / w);
    const c = cell % w;
    if (r === h - 1 && c === w - 1 && run >= rule.minRun) return d;
    const candidates = run >= rule.minRun ? [dir, (dir + 1) & 3, (dir + 3) & 3] : [dir];
    for (const nextDir of candidates) {
      const nextRun = nextDir === dir ? run + 1 : 1;
      if (nextRun > maxRun) continue;
      const nr = r + DR[nextDir]!;
      const nc = c + DC[nextDir]!;
      if (!map.inBounds(nr, nc)) continue;
      const nextState = ((nr * w + nc) * 4 + nextDir) * strideRun + nextRun;
      const nd = d + map.heatAt(nr, nc);
      if (nd < dist[nextState]!) {
        dist[nextState] = nd;
        pushHeap(heap, { state: nextState, dist: nd });
      }
    }
  }
  return -1;
}

function assertLegalPath(map: HeatMap, rule: CrucibleRule): void {
  const res = new CrucibleRouter(rule).search(map);
  const turns = res.turnCells;
  expect(turns[0]).toBe(0);
  expect(turns[turns.length - 1]).toBe(map.goalCell);
  let prevAxis = -1;
  let totalHeat = 0;
  for (let i = 1; i < turns.length; i += 1) {
    const r0 = Math.floor(turns[i - 1]! / map.width);
    const c0 = turns[i - 1]! % map.width;
    const r1 = Math.floor(turns[i]! / map.width);
    const c1 = turns[i]! % map.width;
    const dr = Math.abs(r1 - r0);
    const dc = Math.abs(c1 - c0);
    expect(dr === 0 || dc === 0).toBe(true);
    const axis = dr === 0 ? 0 : 1;
    expect(axis).not.toBe(prevAxis);
    prevAxis = axis;
    const len = dr + dc;
    expect(len).toBeGreaterThanOrEqual(rule.minRun);
    expect(len).toBeLessThanOrEqual(rule.maxRun);
    const sr = Math.sign(r1 - r0);
    const sc = Math.sign(c1 - c0);
    for (let k = 1; k <= len; k += 1) totalHeat += map.heatAt(r0 + k * sr, c0 + k * sc);
  }
  expect(totalHeat).toBe(res.goalHeat);
}

function seededGrid(seed: number, h: number, w: number): HeatMap {
  let state = seed >>> 0;
  const lines: string[] = [];
  for (let r = 0; r < h; r += 1) {
    let row = '';
    for (let c = 0; c < w; c += 1) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      row += String(1 + (state % 9));
    }
    lines.push(row);
  }
  return HeatMap.fromLines(lines);
}

describe('CrucibleRouter differential oracle (4D Dijkstra)', () => {
  it('matches oracle on official examples and edge grids', () => {
    const grid13 = parseHeatMap(
      '2413432311323\n3215453535623\n3255245654254\n3446585845452\n4546657867536\n1438598798454\n4457876987766\n3637877979653\n4654967986887\n4564679986453\n1224686865563\n2546548887735\n4322674655533',
    );
    const grid5x12 = parseHeatMap('111111111111\n999999999991\n999999999991\n999999999991\n999999999991');
    expect(oracleDijkstra4D(grid13, CLUMSY_CRUCIBLE_RULE)).toBe(102);
    expect(oracleDijkstra4D(grid13, ULTRA_CRUCIBLE_RULE)).toBe(94);
    expect(oracleDijkstra4D(grid5x12, ULTRA_CRUCIBLE_RULE)).toBe(71);

    for (const [lines, rule] of [
      [['5'], ULTRA_CRUCIBLE_RULE], [['1234'], ULTRA_CRUCIBLE_RULE], [['12345'], ULTRA_CRUCIBLE_RULE],
      [['12', '34'], ULTRA_CRUCIBLE_RULE], [['111111', '111111'], ULTRA_CRUCIBLE_RULE],
    ] as const) {
      const m = HeatMap.fromLines(lines);
      const expected = oracleDijkstra4D(m, rule);
      if (expected === -1) expect(() => new CrucibleRouter(rule).search(m)).toThrow('unreachable');
      else expect(new CrucibleRouter(rule).search(m).goalHeat).toBe(expected);
    }
  });

  it('matches oracle and satisfies path legality across 25 seeded rectangular grids', () => {
    const rules = [CLUMSY_CRUCIBLE_RULE, ULTRA_CRUCIBLE_RULE, new CrucibleRule(2, 5), new CrucibleRule(1, 1)];
    for (let i = 0; i < 25; i += 1) {
      const h = 4 + (i % 7);
      const w = 5 + ((i * 3) % 9);
      const map = seededGrid(202317 + i * 97, h, w);
      for (const rule of rules) {
        const expected = oracleDijkstra4D(map, rule);
        if (expected === -1) expect(() => new CrucibleRouter(rule).search(map)).toThrow('unreachable');
        else {
          expect(new CrucibleRouter(rule).search(map).goalHeat).toBe(expected);
          assertLegalPath(map, rule);
        }
      }
    }
  });
});
