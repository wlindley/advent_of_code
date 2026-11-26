import { describe, expect, it } from 'vitest';
import { bitCount, DIRS_4 } from '../../../../shared/core';
import { MAX_HEIGHT, MIN_HEIGHT, type TopographicMap } from '../../shared';
import { solver } from './index';

function bitsetReachabilityOracle(map: TopographicMap): number {
  const dp = new Array<bigint>(map.size).fill(0n);
  const peaks = map.peakIndices();
  for (let i = 0; i < peaks.length; i += 1) {
    dp[peaks[i]!] = 1n << BigInt(i);
  }

  for (let height = MAX_HEIGHT - 1; height >= MIN_HEIGHT; height -= 1) {
    for (let r = 0; r < map.rows; r += 1) {
      for (let c = 0; c < map.cols; c += 1) {
        if (map.heightAt(r, c) !== height) continue;
        let mask = 0n;
        for (const [dr, dc] of DIRS_4) {
          const nr = r + dr;
          const nc = c + dc;
          if (map.inBounds(nr, nc) && map.heightAt(nr, nc) === height + 1) {
            mask |= dp[map.indexOf(nr, nc)]!;
          }
        }
        dp[map.indexOf(r, c)] = mask;
      }
    }
  }

  let total = 0;
  for (const trailhead of map.trailheadIndices()) {
    total += bitCount(dp[trailhead]!);
  }
  return total;
}

function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function generateRandomMap(seed: number, withBarriers: boolean, gradientBias: boolean): string {
  const rng = createRng(seed);
  const rows = 1 + Math.floor(rng() * 25);
  const cols = 1 + Math.floor(rng() * 25);
  const lines: string[] = [];

  for (let r = 0; r < rows; r += 1) {
    let row = '';
    for (let c = 0; c < cols; c += 1) {
      if (withBarriers && rng() < 0.14) {
        row += '.';
      } else if (gradientBias) {
        const span = Math.max(1, rows + cols - 2);
        const base = Math.round(((r + c) / span) * 9);
        const jitter = Math.floor(rng() * 3) - 1;
        row += String(Math.max(0, Math.min(9, base + jitter)));
      } else {
        row += String(Math.floor(rng() * 10));
      }
    }
    lines.push(row);
  }
  return lines.join('\n');
}

const OFFICIAL_EXAMPLES = [
  ['0123', '1234', '8765', '9876'].join('\n'),
  ['...0...', '...1...', '...2...', '6543456', '7.....7', '8.....8', '9.....9'].join('\n'),
  ['..90..9', '...1.98', '...2..7', '6543456', '765.987', '876....', '987....'].join('\n'),
  ['10..9..', '2...8..', '3...7..', '4567654', '...8..3', '...9..2', '.....01'].join('\n'),
  [
    '89010123',
    '78121874',
    '87430965',
    '96549874',
    '45678903',
    '32019012',
    '01329801',
    '10456732',
  ].join('\n'),
];

describe('Day 10 Part 1 independent BigInt bitset DP oracle', () => {
  it('matches across all 5 official examples and 40 seeded random maps', () => {
    for (const raw of OFFICIAL_EXAMPLES) {
      const map = solver.parse(raw);
      expect(solver.solve(map)).toBe(bitsetReachabilityOracle(map));
    }

    for (let i = 0; i < 40; i += 1) {
      const raw = generateRandomMap(20241001 + i, i % 2 === 1, i % 3 !== 0);
      const map = solver.parse(raw);
      expect(solver.solve(map)).toBe(bitsetReachabilityOracle(map));
    }
  });
});
