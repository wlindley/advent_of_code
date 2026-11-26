import { describe, expect, it } from 'vitest';
import { solver } from './index';

const OFFICIAL_EXAMPLE = [
  '#.######',
  '#>>.<^<#',
  '#.<..<<#',
  '#>v.><>#',
  '#<^v^^>#',
  '######.#',
].join('\n');

describe('Day 24 Part 1 solver', () => {
  it('solves the official 6x8 example in 18 minutes and a 3x3 empty valley in 2', () => {
    expect(solver.solve(solver.parse(OFFICIAL_EXAMPLE))).toBe(18);
    expect(solver.solve(solver.parse('#.#\n#.#\n#.#'))).toBe(2);
  });

  it('produces default and bounded traces ending at the bottom exit', () => {
    const basin = solver.parse(OFFICIAL_EXAMPLE);
    const full = solver.trace(basin);
    expect(full).toHaveLength(19);
    expect(full[0]!.minute).toBe(0);
    expect(full[0]!.action).toBe('start');
    expect(full[0]!.position).toEqual({ row: 0, col: 1 });
    expect(full[18]!.minute).toBe(18);
    expect(full[18]!.position).toEqual({ row: 5, col: 6 });

    const capped = solver.trace(basin, { maxSteps: 6 });
    expect(capped).toHaveLength(6);
    expect(capped[0]!.minute).toBe(0);
    expect(capped[5]!.minute).toBe(18);
  });

  it('rejects invalid inputs', () => {
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('#.#\n#.#')).toThrow(RangeError);
    expect(() => solver.solve(solver.parse('#.#\n#<#\n#.#'))).toThrow();
  });
});
