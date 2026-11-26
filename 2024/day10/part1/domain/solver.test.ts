import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import {
  SCORE_METRIC,
  solveHoofItPart1,
  solver,
  traceHoofItPart1,
} from './index';

const EXAMPLE_1 = ['0123', '1234', '8765', '9876'].join('\n');

const EXAMPLE_2 = [
  '...0...',
  '...1...',
  '...2...',
  '6543456',
  '7.....7',
  '8.....8',
  '9.....9',
].join('\n');

const EXAMPLE_3 = [
  '..90..9',
  '...1.98',
  '...2..7',
  '6543456',
  '765.987',
  '876....',
  '987....',
].join('\n');

const EXAMPLE_4 = [
  '10..9..',
  '2...8..',
  '3...7..',
  '4567654',
  '...8..3',
  '...9..2',
  '.....01',
].join('\n');

const EXAMPLE_5 = [
  '89010123',
  '78121874',
  '87430965',
  '96549874',
  '45678903',
  '32019012',
  '01329801',
  '10456732',
].join('\n');

describe('2024 Day 10 Part 1 (Hoof It)', () => {
  it('defines a frozen SCORE_METRIC returning 1 for valid positive integer path counts', () => {
    expect(Object.isFrozen(SCORE_METRIC)).toBe(true);
    expect(SCORE_METRIC.mode).toBe('score');
    expect(SCORE_METRIC.peakValue(1)).toBe(1);
    expect(SCORE_METRIC.peakValue(12)).toBe(1);
  });

  it('throws RangeError from SCORE_METRIC for invalid path counts', () => {
    expect(() => SCORE_METRIC.peakValue(0)).toThrow(RangeError);
    expect(() => SCORE_METRIC.peakValue(-3)).toThrow(RangeError);
    expect(() => SCORE_METRIC.peakValue(1.5)).toThrow(RangeError);
    expect(() => SCORE_METRIC.peakValue(Number.NaN)).toThrow(RangeError);
  });

  it('solves all five official AoC examples accurately', () => {
    expect(solveHoofItPart1(solver.parse(EXAMPLE_1))).toBe(1);
    expect(solveHoofItPart1(solver.parse(EXAMPLE_2))).toBe(2);
    expect(solveHoofItPart1(solver.parse(EXAMPLE_3))).toBe(4);
    expect(solveHoofItPart1(solver.parse(EXAMPLE_4))).toBe(3);
    expect(solveHoofItPart1(solver.parse(EXAMPLE_5))).toBe(36);
  });

  it('exposes a frozen PuzzleSolver compatible with executeSolver and traceHoofItPart1', () => {
    expect(Object.isFrozen(solver)).toBe(true);

    let tick = 10;
    const fakeClock = { nowMs: () => (tick += 5) };
    const exec = executeSolver(solver, EXAMPLE_5, fakeClock);
    expect(exec.answer).toBe(36);
    expect(exec.elapsedMs).toBe(5);
    expect(exec.runtime).toBe('main-thread');

    const map = solver.parse(EXAMPLE_5);
    const frames = traceHoofItPart1(map, { maxSteps: 5 });
    expect(frames).toHaveLength(5);
    expect(frames[frames.length - 1]!.cumulativeTotal).toBe(36);
    expect(solver.trace?.(map)).toHaveLength(9);
  });
});
