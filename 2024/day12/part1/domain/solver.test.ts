import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver } from '../../../../shared/core';
import { PERIMETER_METRIC, solver } from './index';

const EXAMPLE_SMALL = ['AAAA', 'BBCD', 'BBCC', 'EEEC'].join('\n');

const EXAMPLE_HOLES = ['OOOOO', 'OXOXO', 'OOOOO', 'OXOXO', 'OOOOO'].join('\n');

const EXAMPLE_LARGE = [
  'RRRRIICCFF',
  'RRRRIICCCF',
  'VVRRRCCFFF',
  'VVRCCCJFFF',
  'VVVVCJJCFE',
  'VVIVCCJJEE',
  'VVIIICJJEE',
  'MIIIIIJJEE',
  'MIIISIJEEE',
  'MMMISSJEEE',
].join('\n');

describe('Day 12 Part 1 solver', () => {
  it('exposes frozen metric and solver objects', () => {
    expect(Object.isFrozen(PERIMETER_METRIC)).toBe(true);
    expect(Object.isFrozen(solver)).toBe(true);
    expect(PERIMETER_METRIC.id).toBe('perimeter');
    expect(PERIMETER_METRIC.label).toBe('Perimeter');
    expect(PERIMETER_METRIC.unit).toBe('edges');
  });

  it('solves all three official examples', () => {
    expect(solver.solve(solver.parse(EXAMPLE_SMALL))).toBe(140);
    expect(solver.solve(solver.parse(EXAMPLE_HOLES))).toBe(772);
    expect(solver.solve(solver.parse(EXAMPLE_LARGE))).toBe(1930);
  });

  it('solves boundary shapes and multi-level nested holes', () => {
    expect(solver.solve(solver.parse('A'))).toBe(4);
    expect(solver.solve(solver.parse('AAAAA'))).toBe(60);
    expect(solver.solve(solver.parse('A\nA\nA\nA\nA'))).toBe(60);
    expect(solver.solve(solver.parse('AB\nBA'))).toBe(16);
    const nested = ['AAAAA', 'ABBBA', 'ABABA', 'ABBBA', 'AAAAA'].join('\n');
    expect(solver.solve(solver.parse(nested))).toBe(644);
  });

  it('executes through executeSolver and supports sampled trace frames', () => {
    let ticks = 0;
    const fakeClock: Clock = { nowMs: () => ++ticks * 5 };
    const result = executeSolver(solver, EXAMPLE_SMALL, fakeClock);
    expect(result).toEqual({ answer: 140, elapsedMs: 5, runtime: 'main-thread' });

    const frames = solver.trace?.(solver.parse(EXAMPLE_LARGE), { maxSteps: 4 }) ?? [];
    expect(frames).toHaveLength(4);
    expect(frames[0]!.regionOrder).toBe(0);
    expect(frames[3]!.regionOrder).toBe(frames[3]!.totalRegions - 1);
    expect(frames[3]!.runningTotal).toBe(1930);
  });
});
