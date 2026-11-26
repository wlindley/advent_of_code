import { describe, expect, it } from 'vitest';
import { PART2_STEPS, solver } from './index';

const EMPTY_5X5 = [
  '.....',
  '.....',
  '..S..',
  '.....',
  '.....',
].join('\n');

const RECT_NON_PERIODIC = [
  '.......',
  '.......',
  '...S...',
  '.......',
  '.......',
].join('\n');

describe('Day 21 Part 2 solver', () => {
  it('uses PART2_STEPS = 26_501_365n and solves periodic-ready maps', () => {
    expect(PART2_STEPS).toBe(26_501_365n);
    const map = solver.parse(EMPTY_5X5);
    expect(solver.solve(map)).toBe(702_322_399_865_956n);
  });

  it('rejects non-periodic maps at PART2_STEPS', () => {
    const map = solver.parse(RECT_NON_PERIODIC);
    expect(() => solver.solve(map)).toThrow(/not quadratic-periodic-ready/);
  });

  it('produces default and maxSteps-bounded trace frames up to max(width, height)', () => {
    const map = solver.parse(RECT_NON_PERIODIC);
    const full = solver.trace?.(map) ?? [];
    expect(full).toHaveLength(8);
    expect(full[0]!.step).toBe(0);
    expect(full[full.length - 1]!.step).toBe(7);
    expect(full[full.length - 1]!.totalSteps).toBe(7);

    const bounded = solver.trace?.(map, { maxSteps: 4 }) ?? [];
    expect(bounded).toHaveLength(4);
    expect(bounded[0]!.step).toBe(0);
    expect(bounded[bounded.length - 1]!.step).toBe(7);
  });
});
