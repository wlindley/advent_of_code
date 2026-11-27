import { describe, expect, it } from 'vitest';
import { ADJACENT_SEATING_RULE } from '../../shared';
import { solver } from './index';

const EXAMPLE_10X10 = [
  'L.LL.LL.LL',
  'LLLLLLL.LL',
  'L.L.L..L..',
  'LLLL.LL.LL',
  'L.LL.LL.LL',
  'L.LLLLL.LL',
  '..L.L.....',
  'LLLLLLLLLL',
  'L.LLLLLL.L',
  'L.LLLLL.LL',
].join('\n');

describe('2020 Day 11 Part 1 solver', () => {
  it('uses ADJACENT_SEATING_RULE and solves the 10x10 example to 37', () => {
    expect(solver.rule).toBe(ADJACENT_SEATING_RULE);
    const layout = solver.parse(EXAMPLE_10X10);
    expect(solver.solve(layout)).toBe(37);
  });

  it('produces traces with default and explicit maxSteps and rejects invalid maxSteps', () => {
    const layout = solver.parse(EXAMPLE_10X10);
    const full = solver.trace(layout);
    expect(full).toHaveLength(6);
    expect(full[5]!.occupiedCount).toBe(37);

    const capped = solver.trace(layout, { maxSteps: 3 });
    expect(capped.map((frame) => frame.round)).toEqual([0, 3, 5]);

    expect(() => solver.trace(layout, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => solver.trace(layout, { maxSteps: -1 })).toThrow(RangeError);
    expect(() => solver.trace(layout, { maxSteps: 1.5 })).toThrow(RangeError);
  });
});
