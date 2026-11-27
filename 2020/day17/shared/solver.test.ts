import { describe, expect, it } from 'vitest';
import { POCKET_3D_POLICY, POCKET_4D_POLICY } from './policies';
import { ConwayCubesSolver } from './solver';

const EXAMPLE = '.#.\n..#\n###';

describe('ConwayCubesSolver', () => {
  it('parses, solves, formats, and traces 3D and 4D examples', () => {
    const solver3d = new ConwayCubesSolver(POCKET_3D_POLICY);
    expect(Object.isFrozen(solver3d)).toBe(true);
    expect(solver3d.policy).toBe(POCKET_3D_POLICY);

    const seed = solver3d.parse(EXAMPLE);
    expect(solver3d.solve(seed)).toBe(112);
    expect(solver3d.formatAnswer(112)).toBe('112');

    const fullTrace = solver3d.trace(seed);
    expect(fullTrace).toHaveLength(7);
    expect(fullTrace[0]?.cycle).toBe(0);
    expect(fullTrace[6]?.cycle).toBe(6);
    expect(fullTrace[6]?.activeCount).toBe(112);

    const solver4d = new ConwayCubesSolver(POCKET_4D_POLICY);
    expect(solver4d.solve(solver4d.parse(EXAMPLE))).toBe(848);
  });

  it('samples and validates trace maxSteps options', () => {
    const solver3d = new ConwayCubesSolver(POCKET_3D_POLICY);
    const seed = solver3d.parse(EXAMPLE);

    const sampled = solver3d.trace(seed, { maxSteps: 3 });
    expect(sampled.map((f) => f.cycle)).toEqual([0, 3, 6]);
    expect(sampled.at(-1)?.activeCount).toBe(112);

    const single = solver3d.trace(seed, { maxSteps: 1 });
    expect(single.map((f) => f.cycle)).toEqual([6]);
    expect(single[0]?.activeCount).toBe(112);

    expect(() => solver3d.trace(seed, { maxSteps: 0 })).toThrow(RangeError);
  });
});
