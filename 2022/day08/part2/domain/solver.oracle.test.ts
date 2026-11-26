import { describe, expect, it } from 'vitest';
import { DIRS_4 } from '../../../../shared/core';
import { ForestGrid } from '../../shared';
import { solver } from './solver';

interface OracleBest {
  readonly bestRow: number;
  readonly bestCol: number;
  readonly bestScore: number;
  readonly bestDistances: readonly number[];
}

function rayDistance(forest: ForestGrid, row: number, col: number, dr: number, dc: number): number {
  const originHeight = forest.heightAt(row, col);
  let r = row + dr;
  let c = col + dc;
  let dist = 0;
  while (forest.inBounds(r, c)) {
    dist += 1;
    if (forest.heightAt(r, c) >= originHeight) break;
    r += dr;
    c += dc;
  }
  return dist;
}

function directRayBestScenic(forest: ForestGrid): OracleBest {
  let bestRow = 0;
  let bestCol = 0;
  let bestScore = 0;
  for (let r = 1; r < forest.rows - 1; r += 1) {
    for (let c = 1; c < forest.cols - 1; c += 1) {
      const score = DIRS_4.reduce((acc, [dr, dc]) => acc * rayDistance(forest, r, c, dr, dc), 1);
      if (score > bestScore) {
        bestScore = score;
        bestRow = r;
        bestCol = c;
      }
    }
  }
  const bestDistances = DIRS_4.map(([dr, dc]) => rayDistance(forest, bestRow, bestCol, dr, dc));
  return { bestRow, bestCol, bestScore, bestDistances };
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomForest(rows: number, cols: number, rng: () => number): ForestGrid {
  const lines: string[] = [];
  for (let r = 0; r < rows; r += 1) {
    let line = '';
    for (let c = 0; c < cols; c += 1) {
      line += String(Math.floor(rng() * 10));
    }
    lines.push(line);
  }
  return ForestGrid.parse(lines.join('\n'));
}

function expectMatchesOracle(forest: ForestGrid): void {
  const oracle = directRayBestScenic(forest);
  const solved = solver.solve(forest);
  const finalFrame = solver.trace(forest, { maxSteps: 1 })[0]!;

  expect(solved).toBe(oracle.bestScore);
  expect(finalFrame.bestScore).toBe(oracle.bestScore);
  expect(finalFrame.bestRow).toBe(oracle.bestRow);
  expect(finalFrame.bestCol).toBe(oracle.bestCol);
  expect(finalFrame.bestDistances).toEqual(oracle.bestDistances);
}

describe('2022 Day 8 Part 2 — Direct-Ray Differential Oracle', () => {
  it('matches brute-force ray casting on the official 5x5 and edge shapes', () => {
    expectMatchesOracle(solver.parse(['30373', '25512', '65332', '33549', '35390'].join('\n')));
    expectMatchesOracle(solver.parse('9'));
    expectMatchesOracle(solver.parse('1928374'));
    expectMatchesOracle(solver.parse('1\n9\n2\n8\n3'));
    expectMatchesOracle(solver.parse('12\n34'));
    expectMatchesOracle(solver.parse('12345\n67890'));
    expectMatchesOracle(solver.parse('12\n34\n56\n78\n90'));
    expectMatchesOracle(solver.parse('999\n909\n999'));
  });

  it('matches brute-force ray casting across 60 seeded random grids (1..25 x 1..25)', () => {
    const rng = mulberry32(202212082);
    for (let i = 0; i < 60; i += 1) {
      const rows = 1 + Math.floor(rng() * 25);
      const cols = 1 + Math.floor(rng() * 25);
      expectMatchesOracle(randomForest(rows, cols, rng));
    }
  });

  it('matches brute-force ray casting on seeded 50x50 and 99x99 grids', () => {
    const rng = mulberry32(99502022);
    expectMatchesOracle(randomForest(50, 50, rng));
    expectMatchesOracle(randomForest(99, 99, rng));
  });
});
