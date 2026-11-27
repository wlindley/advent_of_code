import { describe, expect, it } from 'vitest';
import { DIRS_8 } from '../../../shared/core';
import { type CellState, parseSeatingLayout } from './layout';
import {
  ADJACENT_SEATING_RULE,
  LINE_OF_SIGHT_SEATING_RULE,
  type SeatingRuleId,
} from './rules';
import { simulateSeating } from './simulation';

type OracleOutcome =
  | { readonly cycle: true }
  | { readonly cycle: false; readonly rounds: number; readonly grid: CellState[][] };

function createPrng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function generateGridRaw(nextRand: () => number, rows: number, cols: number, floorProb: number): string {
  const lines: string[] = [];
  for (let r = 0; r < rows; r += 1) {
    let row = '';
    for (let c = 0; c < cols; c += 1) {
      if (nextRand() < floorProb) {
        row += '.';
      } else {
        row += nextRand() < 0.35 ? '#' : 'L';
      }
    }
    lines.push(row);
  }
  return lines.join('\n');
}

function countVisibleNeighbors(grid: CellState[][], r: number, c: number, ruleId: SeatingRuleId): number {
  let occupied = 0;
  for (const [dr, dc] of DIRS_8) {
    let nr = r + dr;
    let nc = c + dc;
    while (nr >= 0 && nr < grid.length && nc >= 0 && nc < grid[0]!.length) {
      const cell = grid[nr]![nc]!;
      if (cell !== '.') {
        if (cell === '#') occupied += 1;
        break;
      }
      if (ruleId === 'adjacent') break;
      nr += dr;
      nc += dc;
    }
  }
  return occupied;
}

function runBruteForceOracle(raw: string, ruleId: SeatingRuleId): OracleOutcome {
  let grid = raw.split('\n').map((line) => line.split('') as CellState[]);
  const threshold = ruleId === 'adjacent' ? 4 : 5;
  const seen = new Set<string>([grid.map((row) => row.join('')).join('\n')]);
  let rounds = 0;

  while (true) {
    let changed = false;
    const next = grid.map((row) => row.slice());
    for (let r = 0; r < grid.length; r += 1) {
      for (let c = 0; c < grid[0]!.length; c += 1) {
        const cell = grid[r]![c]!;
        if (cell === '.') continue;
        const adj = countVisibleNeighbors(grid, r, c, ruleId);
        if (cell === 'L' && adj === 0) {
          next[r]![c] = '#';
          changed = true;
        } else if (cell === '#' && adj >= threshold) {
          next[r]![c] = 'L';
          changed = true;
        }
      }
    }
    if (!changed) return { cycle: false, rounds, grid };
    rounds += 1;
    const key = next.map((row) => row.join('')).join('\n');
    if (seen.has(key)) return { cycle: true };
    seen.add(key);
    grid = next;
  }
}

describe('simulateSeating differential oracle', () => {
  it('matches an independent 2D grid-scan oracle across 30 seeded grids and both rules', () => {
    const nextRand = createPrng(202011);
    const rules = [ADJACENT_SEATING_RULE, LINE_OF_SIGHT_SEATING_RULE] as const;

    for (let i = 0; i < 30; i += 1) {
      const rows = 4 + (i % 4);
      const cols = 4 + ((i * 3) % 4);
      const floorProb = 0.05 + (i % 5) * 0.15;
      const raw = generateGridRaw(nextRand, rows, cols, floorProb);
      const layout = parseSeatingLayout(raw);

      for (const rule of rules) {
        const oracle = runBruteForceOracle(raw, rule.id);
        if (oracle.cycle) {
          expect(() => simulateSeating(layout, rule)).toThrow('cycle');
        } else {
          const result = simulateSeating(layout, rule);
          expect(result.rounds).toBe(oracle.rounds);
          for (let r = 0; r < rows; r += 1) {
            for (let c = 0; c < cols; c += 1) {
              const seatIndex = layout.seatIndexAt(r, c);
              if (seatIndex === null) {
                expect(oracle.grid[r]![c]).toBe('.');
              } else {
                expect(result.occupancyAt(seatIndex)).toBe(oracle.grid[r]![c] === '#' ? 1 : 0);
              }
            }
          }
        }
      }
    }
  });
});
