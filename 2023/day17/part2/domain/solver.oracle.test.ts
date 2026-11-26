import { describe, expect, it } from 'vitest';
import { solver } from './index';

const DR = [0, 1, 0, -1] as const;
const DC = [1, 0, -1, 0] as const;

class MinHeap {
  readonly items: [number, number][] = [];

  push(cost: number, state: number): void {
    this.items.push([cost, state]);
    let i = this.items.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.items[p]![0] <= this.items[i]![0]) break;
      [this.items[i], this.items[p]] = [this.items[p]!, this.items[i]!];
      i = p;
    }
  }

  pop(): [number, number] {
    const top = this.items[0]!;
    const last = this.items.pop()!;
    if (this.items.length > 0) {
      this.items[0] = last;
      let i = 0;
      const n = this.items.length;
      while (true) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < n && this.items[l]![0] < this.items[m]![0]) m = l;
        if (r < n && this.items[r]![0] < this.items[m]![0]) m = r;
        if (m === i) break;
        [this.items[i], this.items[m]] = [this.items[m]!, this.items[i]!];
        i = m;
      }
    }
    return top;
  }
}

function parseGrid(raw: string): number[][] {
  const grid: number[][] = [];
  for (const line of raw.trim().split('\n')) {
    const row: number[] = [];
    for (let c = 0; c < line.length; c += 1) row.push(line.charCodeAt(c) - 48);
    grid.push(row);
  }
  return grid;
}

function tryPush(
  grid: readonly (readonly number[])[], dist: Int32Array, heap: MinHeap,
  r: number, c: number, dir: number, run: number, prevCost: number,
): void {
  const w = grid[0]!.length;
  if (r < 0 || r >= grid.length || c < 0 || c >= w) return;
  const nextCost = prevCost + grid[r]![c]!;
  const id = ((r * w + c) * 4 + dir) * 10 + (run - 1);
  if (nextCost < dist[id]!) { dist[id] = nextCost; heap.push(nextCost, id); }
}

function expandState(
  grid: readonly (readonly number[])[], dist: Int32Array, heap: MinHeap, id: number, cost: number,
): void {
  const w = grid[0]!.length;
  const run = (id % 10) + 1;
  const rem = Math.floor(id / 10);
  const dir = rem % 4;
  const cell = Math.floor(rem / 4);
  const r = Math.floor(cell / w);
  const c = cell % w;
  if (run < 10) tryPush(grid, dist, heap, r + DR[dir]!, c + DC[dir]!, dir, run + 1, cost);
  if (run >= 4) {
    for (const d of [(dir + 3) & 3, (dir + 1) & 3]) {
      tryPush(grid, dist, heap, r + DR[d]!, c + DC[d]!, d, 1, cost);
    }
  }
}

function oracleSolve(grid: readonly (readonly number[])[]): number | null {
  const h = grid.length;
  const w = grid[0]!.length;
  if (h === 1 && w === 1) return 0;
  const dist = new Int32Array(h * w * 40).fill(0x7fffffff);
  const heap = new MinHeap();
  tryPush(grid, dist, heap, 0, 1, 0, 1, 0);
  tryPush(grid, dist, heap, 1, 0, 1, 1, 0);
  while (heap.items.length > 0) {
    const [cost, id] = heap.pop();
    if (cost !== dist[id]!) continue;
    if (Math.floor(id / 40) === h * w - 1 && (id % 10) + 1 >= 4) return cost;
    expandState(grid, dist, heap, id, cost);
  }
  return null;
}

function solveWithCatch(raw: string): number | null {
  try { return solver.solve(solver.parse(raw)); } catch (err) {
    if (err instanceof Error && /unreachable/i.test(err.message)) return null;
    throw err;
  }
}

function makeRandomGrid(rng: { seed: number }, h: number, w: number): string {
  const rows: string[] = [];
  for (let r = 0; r < h; r += 1) {
    let row = '';
    for (let c = 0; c < w; c += 1) {
      rng.seed = (rng.seed * 1664525 + 1013904223) >>> 0;
      row += String((rng.seed % 9) + 1);
    }
    rows.push(row);
  }
  return rows.join('\n');
}

describe('Day 17 Part 2 differential oracle', () => {
  it('matches 4D Dijkstra oracle on official, boundary, and unreachable grids', () => {
    const cases: readonly [string, number | null][] = [
      ['2413432311323\n3215453535623\n3255245654254\n3446585845452\n4546657867536\n1438598798454\n4457876987766\n3637877979653\n4654967986887\n4564679986453\n1224686865563\n2546548887735\n4322674655533', 94],
      ['111111111111\n999999999991\n999999999991\n999999999991\n999999999991', 71],
      ['5', 0], ['91234', 10], ['91234567891', 46],
      ['12345\n23456\n34567\n45678\n56789', 44],
      ['12\n34', null], ['1234', null], ['123456\n123456', null], ['123456789123', null],
    ];
    for (const [raw, expected] of cases) {
      const actual = solveWithCatch(raw);
      expect(actual).toBe(expected);
      expect(actual).toBe(oracleSolve(parseGrid(raw)));
    }
  });

  it('matches 4D Dijkstra oracle across 20 deterministic seeded random grids (5x5..18x18)', () => {
    const rng = { seed: 2023172 };
    for (let i = 0; i < 20; i += 1) {
      const raw = makeRandomGrid(rng, 5 + (i % 14), 5 + ((i * 5 + 3) % 14));
      expect(solveWithCatch(raw)).toBe(oracleSolve(parseGrid(raw)));
    }
  });
});
