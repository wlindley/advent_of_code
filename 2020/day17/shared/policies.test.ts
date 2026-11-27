import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MAX_TRACE_STEPS,
  POCKET_3D_POLICY,
  POCKET_4D_POLICY,
} from './policies';

describe('Conway Cubes policies', () => {
  it('defines frozen 3D and 4D 6-cycle policies and trace cap', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(64);

    expect(Object.isFrozen(POCKET_3D_POLICY)).toBe(true);
    expect(POCKET_3D_POLICY.id).toBe('3d');
    expect(POCKET_3D_POLICY.dimensions).toBe(3);
    expect(POCKET_3D_POLICY.cycles).toBe(6);
    expect(POCKET_3D_POLICY.label).toContain('26');

    expect(Object.isFrozen(POCKET_4D_POLICY)).toBe(true);
    expect(POCKET_4D_POLICY.id).toBe('4d');
    expect(POCKET_4D_POLICY.dimensions).toBe(4);
    expect(POCKET_4D_POLICY.cycles).toBe(6);
    expect(POCKET_4D_POLICY.label).toContain('80');
  });
});
