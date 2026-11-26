import { describe, expect, it } from 'vitest';
import { PERSONAL_TEST_AREA, solver } from './index';

const SCALED_SAMPLE = [
  '250000000000000, 250000000000000, 0 @ 1, 0, 0',
  '300000000000000, 200000000000000, 0 @ 0, 1, 0',
  '100000000000000, 100000000000000, 0 @ 1, 1, 0',
  '200000000000000, 100000000000000, 0 @ 0, -1, 0',
].join('\n');

describe('Day 24 Part 1 solver', () => {
  it('defines PERSONAL_TEST_AREA as [2e14, 4e14] and solves parsed hailstones', () => {
    expect(PERSONAL_TEST_AREA.min).toBe(200_000_000_000_000n);
    expect(PERSONAL_TEST_AREA.max).toBe(400_000_000_000_000n);

    const stones = solver.parse(SCALED_SAMPLE);
    expect(stones).toHaveLength(4);
    // Pair (0,1) crosses at (3e14, 2.5e14) inside; (0,2) crosses at (2.5e14, 2.5e14) inside;
    // (1,2) crosses at (3e14, 3e14) inside; (0,3) crosses at (2e14, 2.5e14) on min border in past of 0;
    // (1,3) parallel; (2,3) crosses at (2e14, 2e14) on border for both in future/past? Wait:
    // stone 3 at (2e14, 1e14) moving (0, -1): y decreases from 1e14 -> crosses y=2e14 in past!
    // So inside pairs: (0,1), (0,2), (1,2) -> 3!
    expect(solver.solve(stones)).toBe(3);
  });

  it('produces default and maxSteps-bounded 2D intersection traces', () => {
    const stones = solver.parse(SCALED_SAMPLE);
    const full = solver.trace(stones);
    expect(full).toHaveLength(7);
    expect(full[0]!.step).toBe(0);
    expect(full[full.length - 1]!.step).toBe(6);
    expect(full[full.length - 1]!.summary.inside).toBe(3);

    const bounded = solver.trace(stones, { maxSteps: 3 });
    expect(bounded).toHaveLength(3);
    expect(bounded[0]!.step).toBe(0);
    expect(bounded[2]!.step).toBe(6);
    expect(bounded[2]!.summary.inside).toBe(3);
  });
});
