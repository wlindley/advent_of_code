import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver } from '../../../../shared/core';
import { SIDES_METRIC, solver } from './index';

const EXAMPLE_SMALL = ['AAAA', 'BBCD', 'BBCC', 'EEEC'].join('\n');
const EXAMPLE_HOLES = ['OOOOO', 'OXOXO', 'OOOOO', 'OXOXO', 'OOOOO'].join('\n');
const EXAMPLE_E = ['EEEEE', 'EXXXX', 'EEEEE', 'EXXXX', 'EEEEE'].join('\n');
const EXAMPLE_AB = [
  'AAAAAA',
  'AAABBA',
  'AAABBA',
  'ABBAAA',
  'ABBAAA',
  'AAAAAA',
].join('\n');
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

describe('Day 12 Part 2 solver', () => {
  it('exposes frozen metric and solver metadata', () => {
    expect(Object.isFrozen(SIDES_METRIC)).toBe(true);
    expect(Object.isFrozen(solver)).toBe(true);
    expect(SIDES_METRIC.id).toBe('sides');
    expect(SIDES_METRIC.label).toBe('Sides');
    expect(SIDES_METRIC.unit).toBe('sides');
  });

  it('solves all five official Part 2 examples', () => {
    expect(solver.solve(solver.parse(EXAMPLE_SMALL))).toBe(80);
    expect(solver.solve(solver.parse(EXAMPLE_HOLES))).toBe(436);
    expect(solver.solve(solver.parse(EXAMPLE_E))).toBe(236);
    expect(solver.solve(solver.parse(EXAMPLE_AB))).toBe(368);
    expect(solver.solve(solver.parse(EXAMPLE_LARGE))).toBe(1206);
  });

  it('solves boundary, cross, checkerboard, enclave, and diagonal-hole shapes', () => {
    expect(solver.solve(solver.parse('A'))).toBe(4);
    expect(solver.solve(solver.parse('AAAAA'))).toBe(20);
    expect(solver.solve(solver.parse('A\nA\nA\nA\nA'))).toBe(20);
    expect(solver.solve(solver.parse('AA\nAA'))).toBe(16);
    expect(solver.solve(solver.parse('AA\nAB'))).toBe(22);
    expect(solver.solve(solver.parse('BAB\nAAA\nBAB'))).toBe(76);
    expect(solver.solve(solver.parse('AB\nBA'))).toBe(16);
    const enclave = ['AAAAA', 'ABBBA', 'ABABA', 'ABBBA', 'AAAAA'].join('\n');
    expect(solver.solve(solver.parse(enclave))).toBe(196);
    const kissingHoles = ['AAAA', 'ABAA', 'AABA', 'AAAA'].join('\n');
    expect(solver.solve(solver.parse(kissingHoles))).toBe(176);
  });

  it('executes via executeSolver with fake Clock and respects trace maxSteps', () => {
    let ticks = 0;
    const fakeClock: Clock = { nowMs: () => ++ticks * 7 };
    const result = executeSolver(solver, EXAMPLE_SMALL, fakeClock);
    expect(result).toEqual({ answer: 80, elapsedMs: 7, runtime: 'main-thread' });

    const frames = solver.trace?.(solver.parse(EXAMPLE_LARGE), { maxSteps: 4 }) ?? [];
    expect(frames).toHaveLength(4);
    expect(frames[0]!.regionOrder).toBe(0);
    expect(frames[3]!.regionOrder).toBe(frames[3]!.totalRegions - 1);
    expect(frames[3]!.runningTotal).toBe(1206);
  });

  it('rejects empty input', () => {
    expect(() => solver.parse('')).toThrow();
  });

  it('rejects ragged grid rows', () => {
    expect(() => solver.parse('AA\nA')).toThrow();
  });

  it('rejects non-uppercase-letter plant characters', () => {
    expect(() => solver.parse('aA\nAA')).toThrow();
    expect(() => solver.parse('A1\nAA')).toThrow();
  });

  it('rejects invalid trace maxSteps values', () => {
    const map = solver.parse(EXAMPLE_SMALL);
    expect(() => solver.trace?.(map, { maxSteps: 0 })).toThrow();
    expect(() => solver.trace?.(map, { maxSteps: 1.5 })).toThrow();
  });
});
