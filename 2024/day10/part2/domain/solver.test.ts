import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import {
  RATING_METRIC,
  solveHoofItPart2,
  solver,
  traceHoofItPart2,
} from './index';

const EXAMPLE_1 = [
  '.....0.',
  '..4321.',
  '..5..2.',
  '..6543.',
  '..7..4.',
  '..8765.',
  '..9....',
].join('\n');

const EXAMPLE_2 = [
  '..90..9',
  '...1.98',
  '...2..7',
  '6543456',
  '765.987',
  '876....',
  '987....',
].join('\n');

const EXAMPLE_3 = [
  '012345',
  '123456',
  '234567',
  '345678',
  '4.6789',
  '56789.',
].join('\n');

const EXAMPLE_4 = [
  '89010123',
  '78121874',
  '87430965',
  '96549874',
  '45678903',
  '32019012',
  '01329801',
  '10456732',
].join('\n');

describe('2024 Day 10 Part 2 (Hoof It — Trailhead Ratings)', () => {
  it('defines a frozen RATING_METRIC returning pathCount for valid positive integers', () => {
    expect(Object.isFrozen(RATING_METRIC)).toBe(true);
    expect(RATING_METRIC.mode).toBe('rating');
    expect(RATING_METRIC.peakValue(1)).toBe(1);
    expect(RATING_METRIC.peakValue(13)).toBe(13);
    expect(RATING_METRIC.peakValue(121)).toBe(121);
  });

  it('throws RangeError from RATING_METRIC for invalid path counts', () => {
    for (const invalid of [0, -1, 1.5, Number.NaN, Infinity, -Infinity]) {
      expect(() => RATING_METRIC.peakValue(invalid)).toThrow(RangeError);
    }
  });

  it('solves all four official AoC Part 2 examples accurately', () => {
    expect(solveHoofItPart2(solver.parse(EXAMPLE_1))).toBe(3);
    expect(solveHoofItPart2(solver.parse(EXAMPLE_2))).toBe(13);

    const map3 = solver.parse(EXAMPLE_3);
    expect(solveHoofItPart2(map3)).toBe(227);
    const frames3 = traceHoofItPart2(map3);
    expect(frames3).toHaveLength(1);
    expect(frames3[0]!.peaks.map((p) => p.pathCount)).toEqual([121, 106]);
    expect(frames3[0]!.peaks.map((p) => p.contribution)).toEqual([121, 106]);

    const map4 = solver.parse(EXAMPLE_4);
    expect(solveHoofItPart2(map4)).toBe(81);
    const frames4 = traceHoofItPart2(map4);
    expect(frames4).toHaveLength(9);
    expect(frames4.map((f) => f.trailheadContribution)).toEqual([20, 24, 10, 4, 1, 4, 5, 8, 5]);
    expect(frames4[frames4.length - 1]!.cumulativeTotal).toBe(81);
  });

  it('handles edge maps and rejects invalid raw inputs', () => {
    const noTrailheads = solver.parse('123\n456\n789');
    expect(solveHoofItPart2(noTrailheads)).toBe(0);
    expect(traceHoofItPart2(noTrailheads)).toEqual([]);

    const deadEnd = solver.parse('012\n...\n987');
    expect(solveHoofItPart2(deadEnd)).toBe(0);
    expect(traceHoofItPart2(deadEnd)[0]!.peaks).toEqual([]);

    expect(solveHoofItPart2(solver.parse('0123456789'))).toBe(1);
    expect(solveHoofItPart2(solver.parse('0123.56789'))).toBe(0);

    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('01\n234')).toThrow();
    expect(() => solver.parse('01x')).toThrow();
  });

  it('exposes a frozen PuzzleSolver with trace sampling and executeSolver support', () => {
    expect(Object.isFrozen(solver)).toBe(true);

    let tick = 10;
    const fakeClock = { nowMs: () => (tick += 7) };
    const exec = executeSolver(solver, EXAMPLE_4, fakeClock);
    expect(exec.answer).toBe(81);
    expect(exec.elapsedMs).toBe(7);
    expect(exec.runtime).toBe('main-thread');

    const map = solver.parse(EXAMPLE_4);
    const sampled = solver.trace?.(map, { maxSteps: 5 });
    expect(sampled).toHaveLength(5);
    expect(sampled![sampled!.length - 1]!.cumulativeTotal).toBe(81);

    for (const badSteps of [0, -2, 2.5, Number.NaN]) {
      expect(() => traceHoofItPart2(map, { maxSteps: badSteps })).toThrow(RangeError);
    }
  });
});
