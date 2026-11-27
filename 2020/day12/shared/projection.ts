import { absBigInt, Vec2 } from './model';
import type { NavigationTraceFrame } from './trace';

/** Fixed-point BigInt scale factor preventing precision loss on huge coordinates. */
export const PROJECTION_SCALE = 1_000_000n;

/** Projected 2D point in SVG canvas coordinates. */
export interface ProjectedPoint {
  readonly x: number;
  readonly y: number;
}

/** Projected normalized direction vector in SVG canvas coordinates (+y downward). */
export interface ProjectedDirection {
  readonly dx: number;
  readonly dy: number;
}

/** Validated immutable axis-aligned bounding box in (east, north) coordinates. */
export class ChartBounds {
  readonly minEast: bigint;
  readonly maxEast: bigint;
  readonly minNorth: bigint;
  readonly maxNorth: bigint;

  constructor(minEast: bigint, maxEast: bigint, minNorth: bigint, maxNorth: bigint) {
    if (minEast > maxEast) {
      throw new RangeError(`minEast (${minEast}) must be <= maxEast (${maxEast})`);
    }
    if (minNorth > maxNorth) {
      throw new RangeError(`minNorth (${minNorth}) must be <= maxNorth (${maxNorth})`);
    }
    this.minEast = minEast;
    this.maxEast = maxEast;
    this.minNorth = minNorth;
    this.maxNorth = maxNorth;
    Object.freeze(this);
  }

  /** Horizontal span across the east-west axis. */
  get eastSpan(): bigint {
    return this.maxEast - this.minEast;
  }

  /** Vertical span across the north-south axis. */
  get northSpan(): bigint {
    return this.maxNorth - this.minNorth;
  }

  /** Dominant square span max(eastSpan, northSpan). */
  get span(): bigint {
    const east = this.eastSpan;
    const north = this.northSpan;
    return east > north ? east : north;
  }
}

/** Computes bounding box across all trace frame positions, always including the origin. */
export function computeChartBounds(frames: readonly NavigationTraceFrame[]): ChartBounds {
  let minEast = 0n;
  let maxEast = 0n;
  let minNorth = 0n;
  let maxNorth = 0n;
  for (const frame of frames) {
    const p = frame.state.position;
    if (p.east < minEast) minEast = p.east;
    if (p.east > maxEast) maxEast = p.east;
    if (p.north < minNorth) minNorth = p.north;
    if (p.north > maxNorth) maxNorth = p.north;
  }
  return new ChartBounds(minEast, maxEast, minNorth, maxNorth);
}

/** Projects a BigInt world vector into an aspect-preserving padded square SVG viewport. */
export function projectPoint(
  vec: Vec2,
  bounds: ChartBounds,
  size: number,
  padding: number,
): ProjectedPoint {
  if (!Number.isFinite(size) || !Number.isFinite(padding) || padding < 0 || size <= padding * 2) {
    throw new RangeError(`Invalid viewport geometry: size=${size}, padding=${padding}`);
  }
  const span = bounds.span;
  if (span === 0n) {
    return { x: size / 2, y: size / 2 };
  }
  const denominator = 2n * span;
  const eastNumerator = (2n * (vec.east - bounds.minEast) + (span - bounds.eastSpan)) * PROJECTION_SCALE;
  const northNumerator = (2n * (vec.north - bounds.minNorth) + (span - bounds.northSpan)) * PROJECTION_SCALE;
  const tEast = Number(eastNumerator / denominator) / Number(PROJECTION_SCALE);
  const tNorth = Number(northNumerator / denominator) / Number(PROJECTION_SCALE);
  const drawable = size - padding * 2;
  return {
    x: padding + tEast * drawable,
    y: size - padding - tNorth * drawable,
  };
}

/** Projects any BigInt heading/waypoint vector into a unit direction in SVG space. */
export function projectVectorDirection(vec: Vec2): ProjectedDirection {
  const absEast = absBigInt(vec.east);
  const absNorth = absBigInt(vec.north);
  const maxAbs = absEast > absNorth ? absEast : absNorth;
  if (maxAbs === 0n) {
    return { dx: 0, dy: 0 };
  }
  const nx = Number((vec.east * PROJECTION_SCALE) / maxAbs);
  const ny = Number((vec.north * PROJECTION_SCALE) / maxAbs);
  const mag = Math.hypot(nx, ny);
  return { dx: nx / mag, dy: (-ny / mag) + 0 };
}

/** Formats (east, north) BigInt coordinates with compass quadrant prefixes. */
export function formatCompassCoords(vec: Vec2): string {
  const horizontal = vec.east < 0n ? `W${-vec.east}` : `E${vec.east}`;
  const vertical = vec.north < 0n ? `S${-vec.north}` : `N${vec.north}`;
  return `${horizontal}, ${vertical}`;
}
