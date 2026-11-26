import { describe, expect, it } from 'vitest';
import { solver, TOTAL_2023_STARS } from './index';

describe('2023 Day 25 Part 2 — Global Snow Production Finale', () => {
  it('verifies 49 prerequisite stars and emits a 50-star illumination trace', () => {
    expect(TOTAL_2023_STARS).toBe(50);
    expect(solver.parse('49')).toBe(49);
    expect(solver.parse('jqt: rhn xhk nvd')).toBe(49);
    expect(solver.solve(49)).toBe(0);
    expect(() => solver.solve(48)).toThrow(/Need 49 stars/);

    const frames = solver.trace(49, { maxSteps: 10 });
    expect(frames).toHaveLength(10);
    expect(frames[0]?.litStars).toBe(1);
    expect(frames[9]?.litStars).toBe(50);
    expect(frames[9]?.isComplete).toBe(true);
  });
});
