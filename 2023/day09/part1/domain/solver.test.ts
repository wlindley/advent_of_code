import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import {
  FORWARD_EXTRAPOLATION_STRATEGY,
  solveMirageMaintenancePart1,
  solver,
  traceMirageMaintenancePart1,
} from './index';

const EXAMPLE_INPUT = [
  '0 3 6 9 12 15',
  '1 3 6 10 15 21',
  '10 13 16 21 30 45',
].join('\n');

describe('Mirage Maintenance Part 1 solver', () => {
  it('solves each official example history individually', () => {
    expect(FORWARD_EXTRAPOLATION_STRATEGY.direction).toBe('forward');
    expect(FORWARD_EXTRAPOLATION_STRATEGY.operatorSymbol).toBe('+');
    expect(solver.solve(solver.parse('0 3 6 9 12 15'))).toBe(18n);
    expect(solver.solve(solver.parse('1 3 6 10 15 21'))).toBe(28n);
    expect(solver.solve(solver.parse('10 13 16 21 30 45'))).toBe(68n);
  });

  it('solves the official 3-history example report to 114n', () => {
    const report = solver.parse(EXAMPLE_INPUT);
    expect(Object.isFrozen(solver)).toBe(true);
    expect(solveMirageMaintenancePart1(report)).toBe(114n);
    const execution = executeSolver(solver, EXAMPLE_INPUT, { nowMs: () => 10 });
    expect(execution.answer).toBe(114n);
    expect(execution.elapsedMs).toBe(0);
  });

  it('handles negative values, cancelling sums, and all-zero histories', () => {
    expect(solver.solve(solver.parse('0 0 0 0'))).toBe(0n);
    expect(solver.solve(solver.parse('10 7 4 1 -2'))).toBe(-5n);
    expect(solver.solve(solver.parse('0 3 6 9\n0 -3 -6 -9'))).toBe(0n);
  });

  it('preserves exact precision beyond Number.MAX_SAFE_INTEGER (> 10^18)', () => {
    const big = 1_000_000_000_000_000_000n;
    const raw = `${big} ${big + 7n} ${big + 14n} ${big + 21n}`;
    expect(solver.solve(solver.parse(raw))).toBe(big + 28n);
  });

  it('produces bounded trace frames ending with the solved sum', () => {
    const report = solver.parse(EXAMPLE_INPUT);
    const frames = traceMirageMaintenancePart1(report);
    const viaSolver = solver.trace!(report, { maxSteps: 10 });
    expect(frames.length).toBeGreaterThan(0);
    expect(frames[frames.length - 1]!.runningTotal).toBe(114n);
    expect(viaSolver).toHaveLength(10);
    expect(viaSolver[viaSolver.length - 1]!.runningTotal).toBe(114n);
  });
});
