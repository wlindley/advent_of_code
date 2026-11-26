import { describe, expect, it } from 'vitest';
import { DIRS_4 } from '../../../../shared/core';
import { MAX_HEIGHT, MIN_HEIGHT, type TopographicMap } from '../../shared';
import { solver, traceHoofItPart2 } from './index';

class SeededRng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  nextFloat(): number {
    this.state = (this.state * 1664525 + 1013904223) >>> 0;
    return this.state / 0x1_0000_0000;
  }

  nextInt(bound: number): number {
    return Math.floor(this.nextFloat() * bound);
  }
}

function bottomUpPathCountOracle(map: TopographicMap): number {
  const dp = new Array<number>(map.size).fill(0);
  for (const peak of map.peakIndices()) {
    dp[peak] = 1;
  }

  for (let height = MAX_HEIGHT - 1; height >= MIN_HEIGHT; height -= 1) {
    for (let r = 0; r < map.rows; r += 1) {
      for (let c = 0; c < map.cols; c += 1) {
        if (map.heightAt(r, c) !== height) continue;
        let sum = 0;
        for (const [dr, dc] of DIRS_4) {
          const nr = r + dr;
          const nc = c + dc;
          if (map.inBounds(nr, nc) && map.heightAt(nr, nc) === height + 1) {
            sum += dp[map.indexOf(nr, nc)]!;
          }
        }
        dp[map.indexOf(r, c)] = sum;
      }
    }
  }

  let total = 0;
  for (const trailhead of map.trailheadIndices()) {
    total += dp[trailhead]!;
  }
  return total;
}

function enumerateFromCell(
  map: TopographicMap,
  cellIndex: number,
  trail: number[],
  pathsByPeak: Map<number, Set<string>>,
): void {
  const height = map.heightAtIndex(cellIndex);
  if (height === MAX_HEIGHT) {
    let bucket = pathsByPeak.get(cellIndex);
    if (!bucket) {
      bucket = new Set<string>();
      pathsByPeak.set(cellIndex, bucket);
    }
    bucket.add(trail.join(','));
    return;
  }
  const [row, col] = map.coordsOf(cellIndex);
  for (const [dr, dc] of DIRS_4) {
    const nr = row + dr;
    const nc = col + dc;
    if (!map.inBounds(nr, nc) || map.heightAt(nr, nc) !== height + 1) continue;
    const nextIndex = map.indexOf(nr, nc);
    trail.push(nextIndex);
    enumerateFromCell(map, nextIndex, trail, pathsByPeak);
    trail.pop();
  }
}

function enumerateTrailheadPaths(
  map: TopographicMap,
  trailheadIndex: number,
): Map<number, Set<string>> {
  const pathsByPeak = new Map<number, Set<string>>();
  enumerateFromCell(map, trailheadIndex, [trailheadIndex], pathsByPeak);
  return pathsByPeak;
}

function assertMatchesExplicitEnumeration(map: TopographicMap): void {
  const frames = traceHoofItPart2(map, { maxSteps: Math.max(1, map.size) });
  const trailheads = map.trailheadIndices();
  expect(frames).toHaveLength(trailheads.length);

  let expectedTotal = 0;
  for (let i = 0; i < trailheads.length; i += 1) {
    const pathsByPeak = enumerateTrailheadPaths(map, trailheads[i]!);
    let expectedTrailheadRating = 0;
    const actualByPeak = new Map<number, number>();
    for (const peak of frames[i]!.peaks) {
      actualByPeak.set(peak.index, peak.pathCount);
    }
    for (const [peakIndex, distinctTrails] of pathsByPeak) {
      expect(actualByPeak.get(peakIndex)).toBe(distinctTrails.size);
      expectedTrailheadRating += distinctTrails.size;
    }
    expect(actualByPeak.size).toBe(pathsByPeak.size);
    expect(frames[i]!.trailheadContribution).toBe(expectedTrailheadRating);
    expectedTotal += expectedTrailheadRating;
  }
  expect(solver.solve(map)).toBe(expectedTotal);
}

function generateRandomMap(
  seed: number,
  maxDim: number,
  withBarriers: boolean,
  gradientBias: boolean,
): string {
  const rng = new SeededRng(seed);
  const rows = 1 + rng.nextInt(maxDim);
  const cols = 1 + rng.nextInt(maxDim);
  const lines: string[] = [];

  for (let r = 0; r < rows; r += 1) {
    let row = '';
    for (let c = 0; c < cols; c += 1) {
      if (withBarriers && rng.nextFloat() < 0.14) {
        row += '.';
      } else if (gradientBias) {
        const span = Math.max(1, rows + cols - 2);
        const base = Math.round(((r + c) / span) * 9);
        const jitter = rng.nextInt(3) - 1;
        row += String(Math.max(0, Math.min(9, base + jitter)));
      } else {
        row += String(rng.nextInt(10));
      }
    }
    lines.push(row);
  }
  return lines.join('\n');
}

const OFFICIAL_PART2_EXAMPLES = [
  ['.....0.', '..4321.', '..5..2.', '..6543.', '..7..4.', '..8765.', '..9....'].join('\n'),
  ['..90..9', '...1.98', '...2..7', '6543456', '765.987', '876....', '987....'].join('\n'),
  ['012345', '123456', '234567', '345678', '4.6789', '56789.'].join('\n'),
  ['89010123', '78121874', '87430965', '96549874', '45678903', '32019012', '01329801', '10456732'].join('\n'),
];

describe('Day 10 Part 2 independent differential oracles', () => {
  it('Oracle A: matches bottom-up 9->0 elevation DP across examples and 40 seeded maps up to 57x57', () => {
    for (const raw of OFFICIAL_PART2_EXAMPLES) {
      const map = solver.parse(raw);
      expect(solver.solve(map)).toBe(bottomUpPathCountOracle(map));
    }
    for (let i = 0; i < 40; i += 1) {
      const maxDim = i === 39 ? 57 : 8 + Math.floor((i / 39) * 49);
      const raw = generateRandomMap(20241020 + i, maxDim, i % 2 === 1, i % 3 !== 0);
      const map = solver.parse(raw);
      expect(solver.solve(map)).toBe(bottomUpPathCountOracle(map));
    }
  });

  it('Oracle B: matches unmemoized 10-cell path enumeration across examples and <=8x8 seeded maps', () => {
    for (const raw of OFFICIAL_PART2_EXAMPLES) {
      assertMatchesExplicitEnumeration(solver.parse(raw));
    }
    for (let i = 0; i < 20; i += 1) {
      const raw = generateRandomMap(99001 + i, 8, i % 2 === 0, true);
      assertMatchesExplicitEnumeration(solver.parse(raw));
    }
  });
});
