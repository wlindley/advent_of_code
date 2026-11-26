import { describe, expect, it } from 'vitest';
import { DIRS_4 } from '../../../shared/core';
import { CARDINAL_DIRS, ForestGrid, type CardinalDir } from './forest';
import { ForestSightlines } from './sightlines';

function directRayCast(
  forest: ForestGrid,
  row: number,
  col: number,
  dir: CardinalDir,
): { readonly distance: number; readonly visible: boolean } {
  const [dr, dc] = DIRS_4[dir]!;
  const originHeight = forest.heightAt(row, col);
  let r = row + dr;
  let c = col + dc;
  let distance = 0;
  while (forest.inBounds(r, c)) {
    distance += 1;
    if (forest.heightAt(r, c) >= originHeight) {
      return { distance, visible: false };
    }
    r += dr;
    c += dc;
  }
  return { distance, visible: true };
}

function makeSeededPrng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function assertMatchesOracle(raw: string): void {
  const forest = ForestGrid.parse(raw);
  const s = ForestSightlines.analyze(forest);
  let expectedVisible = 0;

  for (let r = 0; r < forest.rows; r += 1) {
    for (let c = 0; c < forest.cols; c += 1) {
      let cellVisible = false;
      let expectedScenic = 1;
      for (const dir of CARDINAL_DIRS) {
        const oracle = directRayCast(forest, r, c, dir);
        expect(s.distanceAt(r, c, dir)).toBe(oracle.distance);
        expect(s.isVisibleFrom(r, c, dir)).toBe(oracle.visible);
        const ray = s.rayFor(r, c, dir);
        expect(ray.blocked).toBe(!oracle.visible);
        expect(ray.distance).toBe(oracle.distance);
        cellVisible = cellVisible || oracle.visible;
        expectedScenic *= oracle.distance;
      }
      expect(s.isVisible(r, c)).toBe(cellVisible);
      expect(s.scenicScore(r, c)).toBe(expectedScenic);
      if (cellVisible) expectedVisible += 1;
    }
  }
  expect(s.visibleCount).toBe(expectedVisible);
}

describe('ForestSightlines brute-force raycast oracle', () => {
  it('matches brute-force raycast cell-by-cell on official, degenerate, and edge-blocker grids', () => {
    const cases = [
      ['30373', '25512', '65332', '33549', '35390'].join('\n'),
      '5',
      '0123456789',
      '9\n8\n7\n6',
      '959\n555\n959',
      '949\n454\n949',
      '0000\n0000\n0000',
    ];
    for (const raw of cases) {
      assertMatchesOracle(raw);
    }
  });

  it('matches brute-force raycast cell-by-cell on 30 seeded random rectangular grids up to 25x30', () => {
    const next = makeSeededPrng(20221208);
    for (let trial = 0; trial < 30; trial += 1) {
      const rows = 1 + Math.floor(next() * 25);
      const cols = 1 + Math.floor(next() * 30);
      const lines: string[] = [];
      for (let r = 0; r < rows; r += 1) {
        let line = '';
        for (let c = 0; c < cols; c += 1) {
          line += String(Math.floor(next() * 10));
        }
        lines.push(line);
      }
      assertMatchesOracle(lines.join('\n'));
    }
  });
});
