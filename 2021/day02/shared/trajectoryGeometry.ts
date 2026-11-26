import { sampleTraceIndices } from '../../../shared/core';
import type { SubmarineCourse } from './course';
import type { NavigationTraceFrame } from './navigation';
import type { NavigationPolicy } from './navigationPolicy';
import { SubmarinePose } from './pose';

export const TRAJECTORY_VIEWBOX = Object.freeze({ width: 640, height: 240, padX: 40, padY: 24 });
export const MAX_TRAJECTORY_POINTS = 240;

const SCALE_FIXED_PRECISION = 1_000_000n;
const MAX_AIM_SLOPE = 6;
const AIM_RAY_LENGTH = 44;

export interface TrajectoryPoint {
  readonly x: number;
  readonly y: number;
}

export interface TrajectoryBounds {
  readonly minHorizontal: bigint;
  readonly maxHorizontal: bigint;
  readonly minDepth: bigint;
  readonly maxDepth: bigint;
}

export interface TrajectoryGeometry {
  readonly bounds: TrajectoryBounds;
  readonly points: readonly TrajectoryPoint[];
  readonly polylinePoints: string;
  readonly waterlineY: number;
  readonly totalPoses: number;
}

export interface AimRaySegment {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

export interface ActiveSegmentOverlay {
  readonly beforePoint: TrajectoryPoint;
  readonly afterPoint: TrajectoryPoint;
  readonly aimRay: AimRaySegment | null;
}

/** Projects a BigInt coordinate linearly into `[outMin, outMax]`, centering flat spans. */
export function scaleBigIntCoord(value: bigint, min: bigint, max: bigint, outMin: number, outMax: number): number {
  if (max < min) {
    throw new RangeError(`Invalid scale bounds: max (${max}) < min (${min})`);
  }
  if (max === min) return (outMin + outMax) / 2;
  const ratio = Number(((value - min) * SCALE_FIXED_PRECISION) / (max - min)) / Number(SCALE_FIXED_PRECISION);
  return outMin + ratio * (outMax - outMin);
}

/** Projects a SubmarinePose into SVG viewBox coordinates using precomputed bounds. */
export function projectPose(pose: SubmarinePose, bounds: TrajectoryBounds): TrajectoryPoint {
  const { width, height, padX, padY } = TRAJECTORY_VIEWBOX;
  const x = scaleBigIntCoord(pose.horizontal, bounds.minHorizontal, bounds.maxHorizontal, padX, width - padX);
  const y = scaleBigIntCoord(pose.depth, bounds.minDepth, bounds.maxDepth, padY, height - padY);
  return Object.freeze({ x, y });
}

function collectCoursePoses(
  course: SubmarineCourse,
  policy: NavigationPolicy,
): { readonly poses: readonly SubmarinePose[]; readonly bounds: TrajectoryBounds } {
  const poses: SubmarinePose[] = [SubmarinePose.ORIGIN];
  let pose = SubmarinePose.ORIGIN;
  let minHorizontal = pose.horizontal;
  let maxHorizontal = pose.horizontal;
  let minDepth = pose.depth;
  let maxDepth = pose.depth;

  for (let i = 0; i < course.count; i += 1) {
    pose = policy.step(pose, course.commandAt(i));
    poses.push(pose);
    if (pose.horizontal < minHorizontal) minHorizontal = pose.horizontal;
    if (pose.horizontal > maxHorizontal) maxHorizontal = pose.horizontal;
    if (pose.depth < minDepth) minDepth = pose.depth;
    if (pose.depth > maxDepth) maxDepth = pose.depth;
  }
  return { poses, bounds: Object.freeze({ minHorizontal, maxHorizontal, minDepth, maxDepth }) };
}

/** Builds a bounded 2D trajectory polyline and waterline coordinate from `SubmarinePose.ORIGIN`. */
export function buildTrajectoryGeometry(course: SubmarineCourse, policy: NavigationPolicy): TrajectoryGeometry {
  const { poses, bounds } = collectCoursePoses(course, policy);
  const indices = sampleTraceIndices(poses.length, MAX_TRAJECTORY_POINTS);
  const points: TrajectoryPoint[] = [];
  const polyCoords: string[] = [];

  for (const idx of indices) {
    const pt = projectPose(poses[idx]!, bounds);
    points.push(pt);
    polyCoords.push(`${pt.x.toFixed(1)},${pt.y.toFixed(1)}`);
  }
  const { height, padY } = TRAJECTORY_VIEWBOX;
  const waterlineY = scaleBigIntCoord(0n, bounds.minDepth, bounds.maxDepth, padY, height - padY);
  return Object.freeze({
    bounds,
    points: Object.freeze(points),
    polylinePoints: polyCoords.join(' '),
    waterlineY,
    totalPoses: poses.length,
  });
}

function computeAimSlope(aim: bigint, bounds: TrajectoryBounds): number {
  if (aim === 0n) return 0;
  const horizontalSpan = bounds.maxHorizontal - bounds.minHorizontal;
  const depthSpan = bounds.maxDepth - bounds.minDepth;
  if (horizontalSpan === 0n || depthSpan === 0n) {
    return aim > 0n ? MAX_AIM_SLOPE : -MAX_AIM_SLOPE;
  }
  const plotW = BigInt(TRAJECTORY_VIEWBOX.width - TRAJECTORY_VIEWBOX.padX * 2);
  const plotH = BigInt(TRAJECTORY_VIEWBOX.height - TRAJECTORY_VIEWBOX.padY * 2);
  const scaled = (aim * horizontalSpan * plotH * SCALE_FIXED_PRECISION) / (depthSpan * plotW);
  const maxScaled = BigInt(MAX_AIM_SLOPE) * SCALE_FIXED_PRECISION;
  if (scaled > maxScaled) return MAX_AIM_SLOPE;
  if (scaled < -maxScaled) return -MAX_AIM_SLOPE;
  return Number(scaled) / Number(SCALE_FIXED_PRECISION);
}

function buildAimRay(origin: TrajectoryPoint, aim: bigint, bounds: TrajectoryBounds): AimRaySegment {
  const { width, height, padX, padY } = TRAJECTORY_VIEWBOX;
  const slope = computeAimSlope(aim, bounds);
  const dx = AIM_RAY_LENGTH / Math.hypot(1, slope);
  const dy = slope * dx;
  const x2 = Math.min(width - padX, Math.max(padX, origin.x + dx));
  const y2 = Math.min(height - padY, Math.max(padY, origin.y + dy));
  return Object.freeze({ x1: origin.x, y1: origin.y, x2, y2 });
}

/** Computes O(1) active-step endpoints and optional aspect-adjusted aim ray for scrubbing. */
export function buildActiveSegmentOverlay(
  bounds: TrajectoryBounds,
  frame: NavigationTraceFrame,
  showAim: boolean,
): ActiveSegmentOverlay {
  const beforePoint = projectPose(frame.before, bounds);
  const afterPoint = projectPose(frame.after, bounds);
  const aimRay = showAim ? buildAimRay(afterPoint, frame.after.aim, bounds) : null;
  return Object.freeze({ beforePoint, afterPoint, aimRay });
}
