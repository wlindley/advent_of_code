import { describe, expect, it } from 'vitest';
import { FLAT_DONUT_POLICY, RECURSIVE_DONUT_POLICY } from './policy';

describe('DonutPolicy', () => {
  it('defines FLAT_DONUT_POLICY with constant depth 0', () => {
    expect(FLAT_DONUT_POLICY.id).toBe('flat');
    expect(FLAT_DONUT_POLICY.label).toBe('Flat Torus');
    expect(FLAT_DONUT_POLICY.tracksDepth).toBe(false);
    expect(FLAT_DONUT_POLICY.maxDepthFor(12)).toBe(0);
    expect(FLAT_DONUT_POLICY.isGoalDepth(0)).toBe(true);
    expect(FLAT_DONUT_POLICY.isGoalDepth(3)).toBe(true);
    expect(FLAT_DONUT_POLICY.nextDepth(0, 'inner', 0)).toBe(0);
    expect(FLAT_DONUT_POLICY.nextDepth(0, 'outer', 0)).toBe(0);
    expect(Object.isFrozen(FLAT_DONUT_POLICY)).toBe(true);
  });

  it('defines RECURSIVE_DONUT_POLICY with bounded depth transitions', () => {
    expect(RECURSIVE_DONUT_POLICY.id).toBe('recursive');
    expect(RECURSIVE_DONUT_POLICY.label).toBe('Recursive Levels');
    expect(RECURSIVE_DONUT_POLICY.tracksDepth).toBe(true);
    expect(RECURSIVE_DONUT_POLICY.maxDepthFor(8)).toBe(16);
    expect(RECURSIVE_DONUT_POLICY.isGoalDepth(0)).toBe(true);
    expect(RECURSIVE_DONUT_POLICY.isGoalDepth(1)).toBe(false);
    expect(RECURSIVE_DONUT_POLICY.nextDepth(0, 'outer', 10)).toBeNull();
    expect(RECURSIVE_DONUT_POLICY.nextDepth(0, 'inner', 10)).toBe(1);
    expect(RECURSIVE_DONUT_POLICY.nextDepth(2, 'outer', 10)).toBe(1);
    expect(RECURSIVE_DONUT_POLICY.nextDepth(10, 'inner', 10)).toBeNull();
    expect(Object.isFrozen(RECURSIVE_DONUT_POLICY)).toBe(true);
  });
});
