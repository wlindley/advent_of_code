import { describe, expect, it } from 'vitest';
import { parseSubmarineCourse, type SubmarineCommand } from './course';
import { traceCourse } from './navigation';
import {
  AIM_NAVIGATION_POLICY,
  DIRECT_NAVIGATION_POLICY,
  type NavigationPolicy,
} from './navigationPolicy';
import { SubmarinePose } from './pose';
import {
  MAX_TRAJECTORY_POINTS,
  TRAJECTORY_VIEWBOX,
  buildActiveSegmentOverlay,
  buildTrajectoryGeometry,
  projectPose,
  scaleBigIntCoord,
  type TrajectoryBounds,
} from './trajectoryGeometry';

const BACKWARD_POLICY: NavigationPolicy = Object.freeze({
  name: 'backward',
  usesAim: false,
  step(pose: SubmarinePose, command: SubmarineCommand): SubmarinePose {
    if (command.direction === 'forward') return pose.withDelta(-command.units, 0n, 0n);
    if (command.direction === 'down') return pose.withDelta(0n, command.units, 0n);
    return pose.withDelta(0n, -command.units, 0n);
  },
});

function buildLongCourseRaw(count: number): string {
  const lines: string[] = [];
  for (let i = 0; i < count; i += 1) {
    lines.push(i % 2 === 0 ? 'down 1' : 'forward 2');
  }
  return lines.join('\n');
}

describe('scaleBigIntCoord and projectPose', () => {
  it('validates bounds, centers equal bounds, and scales huge BigInts safely', () => {
    expect(() => scaleBigIntCoord(5n, 10n, 2n, 0, 100)).toThrow(RangeError);
    expect(scaleBigIntCoord(7n, 7n, 7n, 40, 600)).toBe(320);
    expect(scaleBigIntCoord(50n, 0n, 100n, 40, 600)).toBe(320);

    const base = 10n ** 400n;
    const mid = scaleBigIntCoord(base + 500n, base, base + 1000n, 0, 100);
    expect(mid).toBeCloseTo(50, 4);

    const bounds: TrajectoryBounds = {
      minHorizontal: 0n,
      maxHorizontal: 10n,
      minDepth: 0n,
      maxDepth: 20n,
    };
    const projected = projectPose(new SubmarinePose(5n, 10n, 0n), bounds);
    expect(Object.isFrozen(projected)).toBe(true);
    expect(projected.x).toBe(TRAJECTORY_VIEWBOX.width / 2);
    expect(projected.y).toBe(TRAJECTORY_VIEWBOX.height / 2);
  });
});

describe('buildTrajectoryGeometry', () => {
  it('builds bounded geometry for 2D example, negative/backward bounds, flat axes, and >240 poses', () => {
    const example = parseSubmarineCourse('forward 5\ndown 5\nforward 8\nup 3\ndown 8\nforward 2');
    const geom = buildTrajectoryGeometry(example, DIRECT_NAVIGATION_POLICY);
    expect(Object.isFrozen(geom)).toBe(true);
    expect(geom.totalPoses).toBe(7);
    expect(geom.points.length).toBe(7);
    expect(geom.bounds).toEqual({
      minHorizontal: 0n,
      maxHorizontal: 15n,
      minDepth: 0n,
      maxDepth: 10n,
    });
    expect(geom.waterlineY).toBe(TRAJECTORY_VIEWBOX.padY);

    const backward = parseSubmarineCourse('forward 6\nup 4');
    const backGeom = buildTrajectoryGeometry(backward, BACKWARD_POLICY);
    expect(backGeom.bounds).toEqual({
      minHorizontal: -6n,
      maxHorizontal: 0n,
      minDepth: -4n,
      maxDepth: 0n,
    });
    expect(backGeom.waterlineY).toBe(TRAJECTORY_VIEWBOX.height - TRAJECTORY_VIEWBOX.padY);

    const flatDepth = buildTrajectoryGeometry(parseSubmarineCourse('forward 10'), DIRECT_NAVIGATION_POLICY);
    expect(flatDepth.waterlineY).toBe(TRAJECTORY_VIEWBOX.height / 2);

    const flatHoriz = buildTrajectoryGeometry(parseSubmarineCourse('down 10'), DIRECT_NAVIGATION_POLICY);
    expect(flatHoriz.points[0]?.x).toBe(TRAJECTORY_VIEWBOX.width / 2);

    const longCourse = parseSubmarineCourse(buildLongCourseRaw(400));
    const capped = buildTrajectoryGeometry(longCourse, AIM_NAVIGATION_POLICY);
    expect(capped.totalPoses).toBe(401);
    expect(capped.points.length).toBe(MAX_TRAJECTORY_POINTS);
  });
});

describe('buildActiveSegmentOverlay', () => {
  it('handles showAim=false and showAim=true across zero, in-range, clamped, and zero-span bounds', () => {
    const course = parseSubmarineCourse('forward 5\ndown 2\nforward 5');
    const frames = traceCourse(course, DIRECT_NAVIGATION_POLICY);
    const bounds: TrajectoryBounds = { minHorizontal: 0n, maxHorizontal: 100n, minDepth: 0n, maxDepth: 100n };

    const hidden = buildActiveSegmentOverlay(bounds, frames[0]!, false);
    expect(Object.isFrozen(hidden)).toBe(true);
    expect(hidden.aimRay).toBeNull();

    const zeroAim = buildActiveSegmentOverlay(bounds, frames[0]!, true);
    expect(zeroAim.aimRay).not.toBeNull();
    expect(zeroAim.aimRay!.y2).toBeCloseTo(zeroAim.aimRay!.y1, 6);

    const posAimFrame = {
      stepIndex: 0,
      command: { direction: 'down', units: 2n } as const,
      before: SubmarinePose.ORIGIN,
      after: new SubmarinePose(50n, 50n, 2n),
    };
    const posInRange = buildActiveSegmentOverlay(bounds, posAimFrame, true);
    expect(posInRange.aimRay!.y2).toBeGreaterThan(posInRange.aimRay!.y1);

    const negInRange = buildActiveSegmentOverlay(
      bounds,
      { ...posAimFrame, after: new SubmarinePose(50n, 50n, -2n) },
      true,
    );
    expect(negInRange.aimRay!.y2).toBeLessThan(negInRange.aimRay!.y1);

    const huge = 10n ** 100n;
    const clampedPos = buildActiveSegmentOverlay(
      bounds,
      { ...posAimFrame, after: new SubmarinePose(50n, 50n, huge) },
      true,
    );
    expect(clampedPos.aimRay!.y2).toBeGreaterThan(clampedPos.aimRay!.y1);

    const clampedNeg = buildActiveSegmentOverlay(
      bounds,
      { ...posAimFrame, after: new SubmarinePose(50n, 50n, -huge) },
      true,
    );
    expect(clampedNeg.aimRay!.y2).toBeLessThan(clampedNeg.aimRay!.y1);

    const zeroDepthSpan: TrajectoryBounds = { minHorizontal: 0n, maxHorizontal: 10n, minDepth: 0n, maxDepth: 0n };
    expect(buildActiveSegmentOverlay(zeroDepthSpan, { ...posAimFrame, after: new SubmarinePose(5n, 0n, 1n) }, true).aimRay!.y2).toBeGreaterThan(
      TRAJECTORY_VIEWBOX.height / 2,
    );
    expect(buildActiveSegmentOverlay(zeroDepthSpan, { ...posAimFrame, after: new SubmarinePose(5n, 0n, -1n) }, true).aimRay!.y2).toBeLessThan(
      TRAJECTORY_VIEWBOX.height / 2,
    );

    const zeroHorizSpan: TrajectoryBounds = { minHorizontal: 0n, maxHorizontal: 0n, minDepth: 0n, maxDepth: 10n };
    expect(buildActiveSegmentOverlay(zeroHorizSpan, { ...posAimFrame, after: new SubmarinePose(0n, 5n, 3n) }, true).aimRay!.x2).toBeGreaterThan(
      TRAJECTORY_VIEWBOX.width / 2,
    );
  });
});
