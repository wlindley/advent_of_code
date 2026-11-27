import type { Vec3 } from './models';
import type { NBodyTraceFrame } from './trace';

/** Axis-aligned 3D bounding box enclosing all sampled moon positions and trails. */
export interface OrbitBounds {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
  readonly minZ: number;
  readonly maxZ: number;
}

/** 2D SVG coordinate pair. */
export interface Point2D {
  readonly x: number;
  readonly y: number;
}

/** Supported projection view modes in the shared orbit visualizer. */
export type OrbitViewMode = 'iso' | 'dual';

const MOON_NAMES: readonly string[] = Object.freeze(['Io', 'Europa', 'Ganymede', 'Callisto']);
const ISO_COS = 0.8660254037844387;

function assertPositiveDimension(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive finite number, got ${value}`);
  }
}

function normalizeAxis(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return ((value - (min + max) / 2) * 2) / (max - min);
}

interface MutableBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

function expandBounds(acc: MutableBounds, p: Vec3): void {
  if (p.x < acc.minX) acc.minX = p.x;
  if (p.x > acc.maxX) acc.maxX = p.x;
  if (p.y < acc.minY) acc.minY = p.y;
  if (p.y > acc.maxY) acc.maxY = p.y;
  if (p.z < acc.minZ) acc.minZ = p.z;
  if (p.z > acc.maxZ) acc.maxZ = p.z;
}

/** Computes axis-aligned 3D bounds across all moon positions and trails in `frames`. */
export function computeOrbitBounds(frames: readonly NBodyTraceFrame[]): OrbitBounds {
  const acc: MutableBounds = {
    minX: Infinity, maxX: -Infinity,
    minY: Infinity, maxY: -Infinity,
    minZ: Infinity, maxZ: -Infinity,
  };
  for (let f = 0; f < frames.length; f += 1) {
    const frame = frames[f]!;
    for (let m = 0; m < frame.moons.length; m += 1) {
      expandBounds(acc, frame.moons[m]!.position);
    }
    for (let t = 0; t < frame.trails.length; t += 1) {
      const trail = frame.trails[t]!;
      for (let k = 0; k < trail.length; k += 1) {
        expandBounds(acc, trail[k]!);
      }
    }
  }
  if (!Number.isFinite(acc.minX)) {
    throw new RangeError('Cannot compute orbit bounds from empty frames');
  }
  return Object.freeze({ ...acc });
}

/** Projects a 3D coordinate into a padded 2D isometric SVG viewport. */
export function projectIsometric(pos: Vec3, bounds: OrbitBounds, width: number, height: number): Point2D {
  assertPositiveDimension(width, 'width');
  assertPositiveDimension(height, 'height');
  const nx = normalizeAxis(pos.x, bounds.minX, bounds.maxX);
  const ny = normalizeAxis(pos.y, bounds.minY, bounds.maxY);
  const nz = normalizeAxis(pos.z, bounds.minZ, bounds.maxZ);
  const isoX = (nx - nz) * ISO_COS;
  const isoY = (nx + nz) * 0.5 - ny;
  return Object.freeze({ x: width / 2 + isoX * width * 0.24, y: height / 2 + isoY * height * 0.21 });
}

/** Projects a 3D coordinate onto an orthographic XY or XZ plane inside a padded SVG viewport. */
export function projectPlane(
  pos: Vec3, bounds: OrbitBounds, plane: 'xy' | 'xz', width: number, height: number,
): Point2D {
  assertPositiveDimension(width, 'width');
  assertPositiveDimension(height, 'height');
  const nx = normalizeAxis(pos.x, bounds.minX, bounds.maxX);
  const ny = plane === 'xy'
    ? normalizeAxis(pos.y, bounds.minY, bounds.maxY)
    : normalizeAxis(pos.z, bounds.minZ, bounds.maxZ);
  return Object.freeze({ x: width / 2 + nx * width * 0.38, y: height / 2 - ny * height * 0.38 });
}

/** Computes a clamped [0, 1] ratio for moon energy bars. */
export function computeEnergyBarRatio(energy: number, maxEnergy: number): number {
  if (!Number.isFinite(energy) || energy < 0 || !Number.isFinite(maxEnergy) || maxEnergy < 0) {
    throw new RangeError('energy and maxEnergy must be finite non-negative numbers');
  }
  if (maxEnergy === 0) return 0;
  return Math.min(1, energy / maxEnergy);
}

/** Computes [0, 1] BigInt-safe cyclic phase progress for an axis period. */
export function computeAxisPhaseProgress(step: bigint, period: bigint): number {
  if (period <= 0n) {
    throw new RangeError(`period must be positive, got ${period}`);
  }
  if (step <= 0n) return 0;
  if (step >= period) return 1;
  return Number((step * 1000n) / period) / 1000;
}

/** Maps a 0-based moon index to its Galilean name or generic label. */
export function formatMoonLabel(index: number): string {
  if (!Number.isInteger(index) || index < 0) {
    throw new RangeError(`Moon index must be a non-negative integer, got ${index}`);
  }
  return index < MOON_NAMES.length ? MOON_NAMES[index]! : `Moon ${index + 1}`;
}
