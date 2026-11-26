import { describe, expect, it } from 'vitest';
import {
  FINALE_SUBMISSION_VALUE,
  REQUIRED_PRIOR_STARS,
  TOTAL_2025_STARS,
  buildStarTree,
  solver,
  traceFinale,
  verifyFinaleStar,
} from './index';

describe('2025 day12 part2 finale star', () => {
  it('builds a frozen 24-star tree and verifies finale eligibility', () => {
    const tree = buildStarTree();
    expect(tree).toHaveLength(TOTAL_2025_STARS);
    expect(Object.isFrozen(tree)).toBe(true);
    expect(tree[0]).toEqual({ starNumber: 1, day: 1, part: 1, isTopper: false });
    expect(tree[23]).toEqual({ starNumber: 24, day: 12, part: 2, isTopper: true });
    expect(verifyFinaleStar(REQUIRED_PRIOR_STARS)).toBe(FINALE_SUBMISSION_VALUE);
    expect(solver.solve(solver.parse('23'))).toBe(0);
    expect(solver.solve(solver.parse('4x4: 0 0 0 0 2 0'))).toBe(0);
  });

  it('rejects invalid star counts and maxSteps', () => {
    expect(() => buildStarTree(0)).toThrow(RangeError);
    expect(() => buildStarTree(3)).toThrow(RangeError);
    expect(() => buildStarTree(2.5)).toThrow(RangeError);
    expect(() => verifyFinaleStar(-1)).toThrow(RangeError);
    expect(() => verifyFinaleStar(1.5)).toThrow(RangeError);
    expect(() => verifyFinaleStar(22)).toThrow(/Need 23 stars/);
    expect(() => traceFinale(23, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceFinale(23, { maxSteps: 1.5 })).toThrow(RangeError);
  });

  it('emits bounded finale star-lighting trace frames', () => {
    const full = solver.trace!(23);
    expect(full).toHaveLength(24);
    expect(full[0]!.litStars).toBe(1);
    expect(full[0]!.isComplete).toBe(false);
    expect(full[23]!.litStars).toBe(24);
    expect(full[23]!.isComplete).toBe(true);

    const single = traceFinale(23, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]!.litStars).toBe(24);
    expect(single[0]!.isComplete).toBe(true);

    const sampled = traceFinale(23, { maxSteps: 6 });
    expect(sampled).toHaveLength(6);
    expect(sampled[0]!.litStars).toBe(1);
    expect(sampled[5]!.litStars).toBe(24);
  });
});
