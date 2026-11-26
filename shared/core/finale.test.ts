import { describe, expect, it } from 'vitest';
import {
  buildStarCanopy,
  createFinaleSolver,
  FINALE_SUBMISSION_VALUE,
  parsePriorStars,
  traceFinale,
  verifyFinaleStar,
} from './index';

describe('buildStarCanopy', () => {
  it('builds a frozen canopy for 50-star and 24-star AoC years', () => {
    const nodes50 = buildStarCanopy(50);
    expect(nodes50).toHaveLength(50);
    expect(Object.isFrozen(nodes50)).toBe(true);
    expect(Object.isFrozen(nodes50[0])).toBe(true);
    expect(nodes50[0]).toEqual({ starNumber: 1, day: 1, part: 1, isTopper: false });
    expect(nodes50[1]).toEqual({ starNumber: 2, day: 1, part: 2, isTopper: false });
    expect(nodes50[49]).toEqual({ starNumber: 50, day: 25, part: 2, isTopper: true });

    const nodes24 = buildStarCanopy(24);
    expect(nodes24).toHaveLength(24);
    expect(nodes24[23]).toEqual({ starNumber: 24, day: 12, part: 2, isTopper: true });
  });

  it('rejects odd, too-small, or non-integer star counts', () => {
    expect(() => buildStarCanopy(0)).toThrow(RangeError);
    expect(() => buildStarCanopy(1)).toThrow(RangeError);
    expect(() => buildStarCanopy(49)).toThrow(RangeError);
    expect(() => buildStarCanopy(4.5)).toThrow(RangeError);
  });
});

describe('parsePriorStars & verifyFinaleStar', () => {
  it('parses integer strings and falls back to totalStars - 1 for raw puzzle inputs', () => {
    expect(parsePriorStars(' 49 ', 50)).toBe(49);
    expect(parsePriorStars('1=-0-2\n12111', 50)).toBe(49);
    expect(parsePriorStars('raw', 24)).toBe(23);
    expect(() => parsePriorStars('49', 49)).toThrow(RangeError);
  });

  it('verifies prerequisite stars and rejects invalid or insufficient counts', () => {
    expect(verifyFinaleStar(49, 50)).toBe(FINALE_SUBMISSION_VALUE);
    expect(verifyFinaleStar(50, 50)).toBe(0);
    expect(verifyFinaleStar(23, 24)).toBe(0);
    expect(() => verifyFinaleStar(-1, 50)).toThrow(RangeError);
    expect(() => verifyFinaleStar(12.5, 50)).toThrow(RangeError);
    expect(() => verifyFinaleStar(48, 50)).toThrow(/Need 49 stars before claiming star #50/);
    expect(() => verifyFinaleStar(49, 49)).toThrow(RangeError);
  });
});

describe('traceFinale & createFinaleSolver', () => {
  it('emits frozen full and sampled illumination traces', () => {
    const full = traceFinale(49, 50);
    expect(Object.isFrozen(full)).toBe(true);
    expect(Object.isFrozen(full[0])).toBe(true);
    expect(full).toHaveLength(50);
    expect(full[0]?.litStars).toBe(1);
    expect(full[0]?.totalStars).toBe(50);
    expect(full[0]?.isComplete).toBe(false);
    expect(full[49]?.litStars).toBe(50);
    expect(full[49]?.isComplete).toBe(true);

    const sampled = traceFinale(49, 50, { maxSteps: 10 });
    expect(sampled).toHaveLength(10);
    expect(sampled[0]?.litStars).toBe(1);
    expect(sampled[9]?.litStars).toBe(50);

    const single = traceFinale(49, 50, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]?.isComplete).toBe(true);

    expect(() => traceFinale(49, 50, { maxSteps: 0 })).toThrow(RangeError);
  });

  it('creates a frozen reusable PuzzleSolver and validates totalStars upfront', () => {
    const solver = createFinaleSolver(50);
    expect(Object.isFrozen(solver)).toBe(true);
    expect(solver.parse('49')).toBe(49);
    expect(solver.parse('puzzle input')).toBe(49);
    expect(solver.solve(49)).toBe(0);
    expect(solver.trace(49, { maxSteps: 5 })).toHaveLength(5);
    expect(() => createFinaleSolver(3)).toThrow(RangeError);
  });
});
