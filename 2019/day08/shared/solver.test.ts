import { describe, expect, it } from 'vitest';
import { PART1_EXAMPLE_DIMENSIONS, STANDARD_IMAGE_DIMENSIONS } from './imageModels';
import { MIN_ZERO_CHECKSUM_POLICY } from './policies';
import { SpaceImageSolver } from './solver';

describe('SpaceImageSolver', () => {
  it('parses via injected dimension resolver, solves via policy, and traces frames', () => {
    const solver = new SpaceImageSolver(
      MIN_ZERO_CHECKSUM_POLICY,
      (raw) => (raw.trim().length === 12 ? PART1_EXAMPLE_DIMENSIONS : STANDARD_IMAGE_DIMENSIONS),
    );
    expect(Object.isFrozen(solver)).toBe(true);
    expect(solver.policy).toBe(MIN_ZERO_CHECKSUM_POLICY);

    const parsed = solver.parse('123456789012');
    expect(parsed.dimensions.equals(PART1_EXAMPLE_DIMENSIONS)).toBe(true);
    expect(solver.solve(parsed)).toBe(1);
    expect(solver.trace(parsed)).toHaveLength(2);
    expect(solver.trace(parsed, { maxSteps: 1 })).toHaveLength(1);
  });
});
