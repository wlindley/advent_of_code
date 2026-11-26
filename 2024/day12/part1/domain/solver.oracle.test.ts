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

function unionSamePlantNeighbors(grid: Grid2D<string>, dsu: DisjointSet): void {
  for (let r = 0; r < grid.rows; r += 1) {
    for (let c = 0; c < grid.cols; c += 1) {
      const idx = r * grid.cols + c;
      const plant = grid.at(r, c);
      if (c + 1 < grid.cols && grid.at(r, c + 1) === plant) {
        dsu.union(idx, idx + 1);
      }
      if (r + 1 < grid.rows && grid.at(r + 1, c) === plant) {
        dsu.union(idx, idx + grid.cols);
      }
    }
  }
}

function oraclePerimeterPrice(raw: string): number {
  const grid = Grid2D.fromLines(raw, identityChar);
  const dsu = new DisjointSet(grid.size);
  unionSamePlantNeighbors(grid, dsu);

  const areaByRoot = new Int32Array(grid.size);
  const internalByRoot = new Int32Array(grid.size);
  for (let r = 0; r < grid.rows; r += 1) {
    for (let c = 0; c < grid.cols; c += 1) {
      const idx = r * grid.cols + c;
      const root = dsu.find(idx);
      const plant = grid.at(r, c);
      areaByRoot[root]! += 1;
      if (c + 1 < grid.cols && grid.at(r, c + 1) === plant) internalByRoot[root]! += 1;
      if (r + 1 < grid.rows && grid.at(r + 1, c) === plant) internalByRoot[root]! += 1;
    }
  }

  let total = 0;
  for (let i = 0; i < grid.size; i += 1) {
    const area = areaByRoot[i]!;
    if (area > 0) {
      total += area * (4 * area - 2 * internalByRoot[i]!);
    }
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

describe('Day 12 Part 1 DisjointSet oracle cross-check', () => {
  it('matches oracle across official examples and edge topologies', () => {
    const cases: readonly [string, number][] = [
      [['AAAA', 'BBCD', 'BBCC', 'EEEC'].join('\n'), 140],
      [['OOOOO', 'OXOXO', 'OOOOO', 'OXOXO', 'OOOOO'].join('\n'), 772],
      [
        [
          'RRRRIICCFF',
          'RRRRIICCCF',
          'VVRRRCCFFF',
          'VVRCCCJFFF',
          'VVVVCJJCFE',
          'VVIVCCJJEE',
          'VVIIICJJEE',
          'MIIIIIJJEE',
          'MIIISIJEEE',
          'MMMISSJEEE',
        ].join('\n'),
        1930,
      ],
      ['A', 4],
      ['AB\nBA', 16],
      [['AAAAA', 'ABBBA', 'ABABA', 'ABBBA', 'AAAAA'].join('\n'), 644],
    ];

    for (const [raw, expected] of cases) {
      const actual = solver.solve(solver.parse(raw));
      expect(actual).toBe(expected);
      expect(actual).toBe(oraclePerimeterPrice(raw));
    }
  });

  it('matches DisjointSet perimeter oracle across 50 seeded random grids', () => {
    const rng = new LcgRng(20241201);
    for (let trial = 0; trial < 50; trial += 1) {
      const rows = 2 + rng.nextInt(19);
      const cols = 2 + rng.nextInt(19);
      const alphabetSize = 2 + rng.nextInt(5);
      const raw = generateRandomGrid(rng, rows, cols, alphabetSize);
      expect(solver.solve(solver.parse(raw))).toBe(oraclePerimeterPrice(raw));
    }
  });
});
