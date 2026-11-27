import { describe, expect, it } from 'vitest';
import { DIRS_8, Grid2D } from '../../../shared/core';
import { OctopusGrid } from './grid';
import { parseOctopusGrid } from './parser';
import { OctopusStepper } from './stepper';

function formatGrid(grid: OctopusGrid): string {
  const lines: string[] = [];
  for (let r = 0; r < grid.rows; r += 1) {
    let row = '';
    for (let c = 0; c < grid.cols; c += 1) row += String(grid.at(r, c));
    lines.push(row);
  }
  return lines.join('\n');
}

function oracleStep(state: number[][]): number {
  const rows = state.length;
  const cols = state[0]!.length;
  const flashed = Array.from({ length: rows }, () => Array<boolean>(cols).fill(false));
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) state[r]![c]! += 1;
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        if (!flashed[r]![c]! && state[r]![c]! > 9) {
          flashed[r]![c] = true;
          changed = true;
          for (const [dr, dc] of DIRS_8) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) state[nr]![nc]! += 1;
          }
        }
      }
    }
  }
  let flashes = 0;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (flashed[r]![c]!) {
        state[r]![c] = 0;
        flashes += 1;
      }
    }
  }
  return flashes;
}

describe('OctopusStepper', () => {
  it('matches official 5x5 steps 1 and 2 and isolates snapshots', () => {
    const initial = parseOctopusGrid('11111\n19991\n19191\n19991\n11111');
    const stepper = new OctopusStepper(initial);
    expect(stepper.size).toBe(25);
    expect(stepper.stepCount).toBe(0);
    const snap0 = stepper.snapshot();
    expect(stepper.step()).toBe(9);
    expect(stepper.stepCount).toBe(1);
    const snap1 = stepper.snapshot();
    expect(formatGrid(snap1)).toBe('34543\n40004\n50005\n40004\n34543');
    expect(stepper.step()).toBe(0);
    expect(formatGrid(stepper.snapshot())).toBe('45654\n51115\n61116\n51115\n45654');
    expect(formatGrid(snap0)).toBe('11111\n19991\n19191\n19991\n11111');
    expect(formatGrid(snap1)).toBe('34543\n40004\n50005\n40004\n34543');
  });

  it('distinguishes non-cascading center 0 vs cascading center 1 on 3x3 ring', () => {
    const ring0 = new OctopusStepper(parseOctopusGrid('999\n909\n999'));
    expect(ring0.step()).toBe(8);
    expect(formatGrid(ring0.snapshot())).toBe('000\n090\n000');

    const ring1 = new OctopusStepper(parseOctopusGrid('999\n919\n999'));
    expect(ring1.step()).toBe(9);
    expect(formatGrid(ring1.snapshot())).toBe('000\n000\n000');
  });

  it('handles 1x1 grids with 9 and 0', () => {
    const s9 = new OctopusStepper(parseOctopusGrid('9'));
    expect(s9.step()).toBe(1);
    expect(s9.snapshot().at(0, 0)).toBe(0);
    expect(s9.step()).toBe(0);
    expect(s9.snapshot().at(0, 0)).toBe(1);

    const s0 = new OctopusStepper(parseOctopusGrid('0'));
    expect(s0.step()).toBe(0);
    expect(s0.snapshot().at(0, 0)).toBe(1);
  });

  it('matches an independent fixed-point relaxation oracle across 40 seeded grids', () => {
    const dims: readonly (readonly [number, number])[] = [[1, 1], [2, 2], [3, 4], [5, 5], [10, 10]];
    let seed = 0x13579bdf;
    for (let i = 0; i < 40; i += 1) {
      const [rows, cols] = dims[i % dims.length]!;
      const flat: number[] = [];
      const oracle: number[][] = [];
      for (let r = 0; r < rows; r += 1) {
        const rowArr: number[] = [];
        for (let c = 0; c < cols; c += 1) {
          seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
          const v = seed % 10;
          flat.push(v);
          rowArr.push(v);
        }
        oracle.push(rowArr);
      }
      const stepper = new OctopusStepper(new OctopusGrid(new Grid2D(rows, cols, flat)));
      for (let s = 0; s < 12; s += 1) {
        expect(stepper.step()).toBe(oracleStep(oracle));
        expect(formatGrid(stepper.snapshot())).toBe(oracle.map((r) => r.join('')).join('\n'));
      }
    }
  });
});
