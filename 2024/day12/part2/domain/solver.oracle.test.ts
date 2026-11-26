import { describe, expect, it } from 'vitest';
import { DisjointSet, Grid2D } from '../../../../shared/core';
import { solver } from './index';

class LcgRng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  nextInt(bound: number): number {
    this.state = (Math.imul(1664525, this.state) + 1013904223) >>> 0;
    return this.state % bound;
  }
}

function identityChar(ch: string): string {
  return ch;
}

function unionComponents(grid: Grid2D<string>, dsu: DisjointSet): void {
  for (let r = 0; r < grid.rows; r += 1) {
    for (let c = 0; c < grid.cols; c += 1) {
      const idx = r * grid.cols + c;
      const plant = grid.at(r, c);
      if (c + 1 < grid.cols && grid.at(r, c + 1) === plant) dsu.union(idx, idx + 1);
      if (r + 1 < grid.rows && grid.at(r + 1, c) === plant) dsu.union(idx, idx + grid.cols);
    }
  }
}

function pushEdge(buckets: Map<string, number[]>, key: string, span: number): void {
  const list = buckets.get(key);
  if (list) list.push(span);
  else buckets.set(key, [span]);
}

function collectCellEdges(grid: Grid2D<string>, r: number, c: number, buckets: Map<string, number[]>): void {
  const plant = grid.at(r, c);
  if (r === 0 || grid.at(r - 1, c) !== plant) pushEdge(buckets, `N:${r}`, c);
  if (r + 1 === grid.rows || grid.at(r + 1, c) !== plant) pushEdge(buckets, `S:${r + 1}`, c);
  if (c === 0 || grid.at(r, c - 1) !== plant) pushEdge(buckets, `W:${c}`, r);
  if (c + 1 === grid.cols || grid.at(r, c + 1) !== plant) pushEdge(buckets, `E:${c + 1}`, r);
}

function countContiguousRuns(buckets: Map<string, number[]>): number {
  let sides = 0;
  for (const spans of buckets.values()) {
    spans.sort((a, b) => a - b);
    for (let i = 0; i < spans.length; i += 1) {
      if (i === 0 || spans[i]! !== spans[i - 1]! + 1) sides += 1;
    }
  }
  return sides;
}

function oracleSidesPrice(raw: string): number {
  const grid = Grid2D.fromLines(raw, identityChar);
  const dsu = new DisjointSet(grid.size);
  unionComponents(grid, dsu);
  const areaByRoot = new Int32Array(grid.size);
  const edgesByRoot = new Map<number, Map<string, number[]>>();

  for (let r = 0; r < grid.rows; r += 1) {
    for (let c = 0; c < grid.cols; c += 1) {
      const root = dsu.find(r * grid.cols + c);
      areaByRoot[root]! += 1;
      let buckets = edgesByRoot.get(root);
      if (!buckets) {
        buckets = new Map<string, number[]>();
        edgesByRoot.set(root, buckets);
      }
      collectCellEdges(grid, r, c, buckets);
    }
  }

  let total = 0;
  for (const [root, buckets] of edgesByRoot) {
    total += areaByRoot[root]! * countContiguousRuns(buckets);
  }
  return total;
}

function generateRandomGrid(rng: LcgRng, rows: number, cols: number, alphabetSize: number): string {
  const lines: string[] = [];
  for (let r = 0; r < rows; r += 1) {
    let row = '';
    for (let c = 0; c < cols; c += 1) {
      row += String.fromCharCode(65 + rng.nextInt(alphabetSize));
    }
    lines.push(row);
  }
  return lines.join('\n');
}

describe('Day 12 Part 2 edge-run merging oracle cross-check', () => {
  it('matches oracle across all 5 official examples, pinch diagonals, and enclaves', () => {
    const cases: readonly [string, number][] = [
      [['AAAA', 'BBCD', 'BBCC', 'EEEC'].join('\n'), 80],
      [['OOOOO', 'OXOXO', 'OOOOO', 'OXOXO', 'OOOOO'].join('\n'), 436],
      [['EEEEE', 'EXXXX', 'EEEEE', 'EXXXX', 'EEEEE'].join('\n'), 236],
      [['AAAAAA', 'AAABBA', 'AAABBA', 'ABBAAA', 'ABBAAA', 'AAAAAA'].join('\n'), 368],
      [
        [
          'RRRRIICCFF', 'RRRRIICCCF', 'VVRRRCCFFF', 'VVRCCCJFFF', 'VVVVCJJCFE',
          'VVIVCCJJEE', 'VVIIICJJEE', 'MIIIIIJJEE', 'MIIISIJEEE', 'MMMISSJEEE',
        ].join('\n'),
        1206,
      ],
      [['AAAA', 'ABAA', 'AABA', 'AAAA'].join('\n'), 176],
      [['ABA', 'BAB', 'ABA'].join('\n'), 36],
      [['AAAAA', 'ABBBA', 'ABABA', 'ABBBA', 'AAAAA'].join('\n'), 196],
    ];

    for (const [raw, expected] of cases) {
      const actual = solver.solve(solver.parse(raw));
      expect(actual).toBe(expected);
      expect(actual).toBe(oracleSidesPrice(raw));
    }
  });

  it('matches edge-run merging oracle across 50 seeded random grids', () => {
    const rng = new LcgRng(20241202);
    for (let trial = 0; trial < 50; trial += 1) {
      const rows = 1 + rng.nextInt(18);
      const cols = 1 + rng.nextInt(18);
      const alphabetSize = 2 + rng.nextInt(4);
      const raw = generateRandomGrid(rng, rows, cols, alphabetSize);
      expect(solver.solve(solver.parse(raw))).toBe(oracleSidesPrice(raw));
    }
  });
});
