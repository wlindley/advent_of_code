import { describe, expect, it } from 'vitest';
import { IDENTITY_ROTATION, ROTATIONS_24, Rotation3D } from './rotation';
import { Vec3 } from './vec3';

function cross(a: Vec3, b: Vec3): Vec3 {
  return new Vec3(
    a.y * b.z - a.z * b.y,
    a.z * b.x - a.x * b.z,
    a.x * b.y - a.y * b.x,
  );
}

describe('Rotation3D and ROTATIONS_24', () => {
  it('exposes 24 frozen right-handed rotations starting with identity', () => {
    expect(ROTATIONS_24).toHaveLength(24);
    expect(Object.isFrozen(ROTATIONS_24)).toBe(true);
    expect(IDENTITY_ROTATION).toBe(ROTATIONS_24[0]);
    expect(IDENTITY_ROTATION.index).toBe(0);
    expect(IDENTITY_ROTATION.label).toBe('(+x, +y, +z)');

    const probe = new Vec3(1, 2, 3);
    expect(IDENTITY_ROTATION.apply(probe).equals(probe)).toBe(true);
  });

  it('produces 24 distinct right-handed orientations with det === +1', () => {
    const probe = new Vec3(1, 2, 3);
    const e1 = new Vec3(1, 0, 0);
    const e2 = new Vec3(0, 1, 0);
    const e3 = new Vec3(0, 0, 1);
    const images = new Set<string>();
    const labels = new Set<string>();

    for (const [idx, rot] of ROTATIONS_24.entries()) {
      expect(rot).toBeInstanceOf(Rotation3D);
      expect(Object.isFrozen(rot)).toBe(true);
      expect(rot.index).toBe(idx);
      images.add(rot.apply(probe).key);
      labels.add(rot.label);
      expect(cross(rot.apply(e1), rot.apply(e2)).equals(rot.apply(e3))).toBe(true);
    }

    expect(images.size).toBe(24);
    expect(labels.size).toBe(24);
  });
});
