import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { DEFAULT_MAX_TRACE_STEPS } from '../../shared';
import {
  BACKWARD_EXTRAPOLATION_STRATEGY,
  solveMirageMaintenancePart2,
  solver,
  traceMirageMaintenancePart2,
} from './index';

const EXAMPLE_INPUT = [
  '0 3 6 9 12 15',
  '1 3 6 10 15 21',
  '10 13 16 21 30 45',
].join('\n');

describe('Mirage Maintenance Part 2 solver', () => {
  it('exposes frozen backward strategy and solver contracts', () => {
    expect(Object.isFrozen(BACKWARD_EXTRAPOLATION_STRATEGY)).toBe(true);
    expect(Object.isFrozen(solver)).toBe(true);
    expect(BACKWARD_EXTRAPOLATION_STRATEGY.direction).toBe('backward');
    expect(BACKWARD_EXTRAPOLATION_STRATEGY.label).toBe('Previous Value (Backward)');
    expect(BACKWARD_EXTRAPOLATION_STRATEGY.operatorSymbol).toBe('-');
    expect(BACKWARD_EXTRAPOLATION_STRATEGY.anchorOf([10n, 13n, 16n])).toBe(10n);
    expect(BACKWARD_EXTRAPOLATION_STRATEGY.combine(10n, 5n)).toBe(5n);
  });

  it('solves each official example history individually', () => {
    expect(solver.solve(solver.parse('0 3 6 9 12 15'))).toBe(-3n);
    expect(solver.solve(solver.parse('1 3 6 10 15 21'))).toBe(0n);
    expect(solver.solve(solver.parse('10 13 16 21 30 45'))).toBe(5n);
  });

  it('solves the official 3-history example report to 2n', () => {
    const report = solver.parse(EXAMPLE_INPUT);
    expect(solveMirageMaintenancePart2(report)).toBe(2n);
    const execution = executeSolver(solver, EXAMPLE_INPUT, { nowMs: () => 10 });
    expect(execution.answer).toBe(2n);
    expect(execution.elapsedMs).toBe(0);
  });

  it('handles all-zero, constant, decreasing, negative, and cancelling histories', () => {
    expect(solver.solve(solver.parse('0 0 0 0'))).toBe(0n);
    expect(solver.solve(solver.parse('0'))).toBe(0n);
    expect(solver.solve(solver.parse('7 7 7'))).toBe(7n);
    expect(solver.solve(solver.parse('-4 -4'))).toBe(-4n);
    expect(solver.solve(solver.parse('10 7 4 1 -2'))).toBe(13n);
    expect(solver.solve(solver.parse('-10 -7 -4 -1'))).toBe(-13n);
    expect(
      solver.solve(solver.parse('10 13 16 21 30 45\n-10 -13 -16 -21 -30 -45')),
    ).toBe(0n);
  });

  it('preserves exact BigInt precision beyond 10^18 and bounds 200-history traces', () => {
    const big = 1_000_000_000_000_000_000n;
    const raw = `${big + 7n} ${big + 14n} ${big + 21n} ${big + 28n}`;
    expect(solver.solve(solver.parse(raw))).toBe(big);

    const row = Array.from({ length: 21 }, (_, idx) => String(idx * idx - 5 * idx));
    const largeInput = Array.from({ length: 200 }, () => row.join(' ')).join('\n');
    const largeReport = solver.parse(largeInput);
    expect(solveMirageMaintenancePart2(largeReport)).toBe(1200n);
    const boundedFrames = traceMirageMaintenancePart2(largeReport);
    expect(boundedFrames).toHaveLength(DEFAULT_MAX_TRACE_STEPS);
    expect(boundedFrames[boundedFrames.length - 1]!.runningTotal).toBe(1200n);
  });

  it('traces subtraction equations, per-history running totals, and maxSteps sampling', () => {
    const report = solver.parse(EXAMPLE_INPUT);
    const frames = traceMirageMaintenancePart2(report);
    const ascendFrames = frames.filter((frame) => frame.phase === 'ascend');
    expect(ascendFrames.length).toBeGreaterThan(0);
    for (const frame of ascendFrames) {
      expect(frame.activeEquation?.operator).toBe('-');
    }

    const completedTotals = frames
      .filter((frame) => frame.isHistoryComplete)
      .map((frame) => frame.runningTotal);
    expect(completedTotals).toEqual([-3n, -3n, 2n]);

    const sampled = solver.trace!(report, { maxSteps: 10 });
    expect(sampled).toHaveLength(10);
    expect(sampled[sampled.length - 1]!.runningTotal).toBe(2n);
  });

  it('rejects empty inputs, malformed tokens, non-convergent histories, and invalid maxSteps', () => {
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('1 2 abc')).toThrow();
    expect(() => solver.solve(solver.parse('5'))).toThrow();
    expect(() => solver.solve(solver.parse('1 2'))).toThrow();
    expect(() =>
      traceMirageMaintenancePart2(solver.parse(EXAMPLE_INPUT), { maxSteps: 0 }),
    ).toThrow(RangeError);
  });
});
