import { describe, expect, it } from 'vitest';
import { computeProjectionBounds, projectTrenchSnapshot } from './projection';
import { IDENTITY_ROTATION } from './rotation';
import { AlignedScanner } from './scanner';
import { Vec3 } from './vec3';

describe('projection', () => {
  it('rejects empty point list when computing bounds', () => {
    expect(() => computeProjectionBounds([])).toThrow(RangeError);
  });

  it('centers degenerate single-point bounds to 0.5 and freezes bounds', () => {
    const pt = new Vec3(10, -20, 30);
    const bounds = computeProjectionBounds([pt]);
    expect(Object.isFrozen(bounds)).toBe(true);

    const anchor = new AlignedScanner(0, pt, IDENTITY_ROTATION, null, 1, [pt]);
    const proj = projectTrenchSnapshot([anchor], [pt], bounds, 0, new Set([pt.key]));
    expect(proj.beacons).toHaveLength(1);
    expect(proj.beacons[0]!.nx).toBe(0.5);
    expect(proj.beacons[0]!.ny).toBe(0.5);
    expect(proj.beacons[0]!.depth).toBe(0.5);
    expect(proj.beacons[0]!.isNew).toBe(true);
    expect(proj.scanners[0]!.isAnchor).toBe(true);
    expect(proj.scanners[0]!.isActive).toBe(true);
    expect(proj.links).toHaveLength(0);
  });

  it('projects multiple scanners, parent-child links, and active/new flags into [0, 1]', () => {
    const p0 = new Vec3(0, 0, 0);
    const p1 = new Vec3(100, 50, -40);
    const b0 = new Vec3(10, 20, 30);
    const b1 = new Vec3(-50, -30, 80);
    const s0 = new AlignedScanner(0, p0, IDENTITY_ROTATION, null, 2, [b0]);
    const s1 = new AlignedScanner(1, p1, IDENTITY_ROTATION, 0, 12, [b0, b1]);

    const bounds = computeProjectionBounds([p0, p1, b0, b1]);
    const proj = projectTrenchSnapshot([s0, s1], [b0, b1], bounds, 1, new Set([b1.key]));

    expect(Object.isFrozen(proj)).toBe(true);
    expect(proj.beacons.map((b) => b.isNew)).toEqual([false, true]);
    expect(proj.scanners.map((s) => s.isActive)).toEqual([false, true]);
    expect(proj.links).toHaveLength(1);
    expect(proj.links[0]!.parentId).toBe(0);
    expect(proj.links[0]!.childId).toBe(1);
    expect(proj.links[0]!.overlapCount).toBe(12);
    expect(proj.links[0]!.isActive).toBe(true);

    for (const pt of [...proj.beacons, ...proj.scanners]) {
      expect(pt.nx).toBeGreaterThanOrEqual(0);
      expect(pt.nx).toBeLessThanOrEqual(1);
      expect(pt.ny).toBeGreaterThanOrEqual(0);
      expect(pt.ny).toBeLessThanOrEqual(1);
      expect(pt.depth).toBeGreaterThanOrEqual(0);
      expect(pt.depth).toBeLessThanOrEqual(1);
    }

    const inactiveProj = projectTrenchSnapshot([s0, s1], [b0, b1], bounds, 0, new Set());
    expect(inactiveProj.links[0]!.isActive).toBe(false);
  });
});
