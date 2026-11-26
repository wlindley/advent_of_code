import { describe, expect, it } from 'vitest';
import {
  buildStarCanopy,
  FINALE_SUBMISSION_VALUE,
  REQUIRED_PRIOR_STARS,
  solver,
  TOTAL_2022_STARS,
  traceFinale,
  verifyFinaleStar,
} from './index';

describe('2022 Day 25 Part 2 — Star Smoothie Finale', () => {
  it('builds a frozen 50-star canopy and rejects invalid star counts', () => {
    const nodes = buildStarCanopy(TOTAL_2022_STARS);
    expect(nodes).toHaveLength(50);
    expect(Object.isFrozen(nodes)).toBe(true);
    expect(nodes[0]).toEqual({ starNumber: 1, day: 1, part: 1, isTopper: false });
    expect(nodes[49]).toEqual({ starNumber: 50, day: 25, part: 2, isTopper: true });
    expect(() => buildStarCanopy(1)).toThrow(RangeError);
    expect(() => buildStarCanopy(5)).toThrow(RangeError);
    expect(() => buildStarCanopy(4.5)).toThrow(RangeError);
  });

  it('verifies 49 prerequisite stars and rejects insufficient or invalid counts', () => {
    expect(verifyFinaleStar(REQUIRED_PRIOR_STARS)).toBe(FINALE_SUBMISSION_VALUE);
    expect(verifyFinaleStar(50)).toBe(0);
    expect(() => verifyFinaleStar(-1)).toThrow(RangeError);
    expect(() => verifyFinaleStar(12.5)).toThrow(RangeError);
    expect(() => verifyFinaleStar(48)).toThrow(/Need 49 stars/);
  });

  it('parses numeric or raw puzzle inputs and emits bounded illumination traces', () => {
    expect(solver.parse('49')).toBe(49);
    expect(solver.parse('1=-0-2\n12111')).toBe(REQUIRED_PRIOR_STARS);
    expect(solver.solve(49)).toBe(0);

    const full = solver.trace(49);
    expect(full).toHaveLength(50);
    expect(full[0]?.litStars).toBe(1);
    expect(full[0]?.isComplete).toBe(false);
    expect(full[49]?.litStars).toBe(50);
    expect(full[49]?.isComplete).toBe(true);

    const sampled = traceFinale(49, { maxSteps: 10 });
    expect(sampled).toHaveLength(10);
    expect(sampled[0]?.litStars).toBe(1);
    expect(sampled[9]?.litStars).toBe(50);

    const single = traceFinale(49, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]?.isComplete).toBe(true);

    expect(() => traceFinale(49, { maxSteps: 0 })).toThrow(RangeError);
  });
});
