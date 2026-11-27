import type { AlignedScanner } from './scanner';
import type { Vec3 } from './vec3';

const YAW_RAD = (35 * Math.PI) / 180;
const PITCH_RAD = (22 * Math.PI) / 180;
const COS_YAW = Math.cos(YAW_RAD);
const SIN_YAW = Math.sin(YAW_RAD);
const COS_PITCH = Math.cos(PITCH_RAD);
const SIN_PITCH = Math.sin(PITCH_RAD);

/** Fixed 2D projected bounding box for consistent multi-frame camera framing. */
export interface ProjectionBounds {
  readonly minU: number;
  readonly maxU: number;
  readonly minV: number;
  readonly maxV: number;
  readonly minDepth: number;
  readonly maxDepth: number;
}

/** Normalized 2D projection of a world-frame beacon. */
export interface ProjectedBeacon {
  readonly key: string;
  readonly world: Vec3;
  readonly nx: number;
  readonly ny: number;
  readonly depth: number;
  readonly isNew: boolean;
}

/** Normalized 2D projection of an aligned scanner origin. */
export interface ProjectedScanner {
  readonly id: number;
  readonly position: Vec3;
  readonly nx: number;
  readonly ny: number;
  readonly depth: number;
  readonly isAnchor: boolean;
  readonly isActive: boolean;
  readonly rotationLabel: string;
}

/** Parent-to-child alignment link in normalized 2D coordinates. */
export interface ProjectedLink {
  readonly parentId: number;
  readonly childId: number;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly overlapCount: number;
  readonly isActive: boolean;
}

/** Complete projected snapshot of aligned scanners, links, and beacons. */
export interface TrenchProjection {
  readonly beacons: readonly ProjectedBeacon[];
  readonly scanners: readonly ProjectedScanner[];
  readonly links: readonly ProjectedLink[];
}

function projectRaw(point: Vec3): { readonly u: number; readonly v: number; readonly depth: number } {
  const rx = point.x * COS_YAW - point.z * SIN_YAW;
  const rz = point.x * SIN_YAW + point.z * COS_YAW;
  const ry = point.y * COS_PITCH - rz * SIN_PITCH;
  const depth = point.y * SIN_PITCH + rz * COS_PITCH;
  return { u: rx, v: -ry, depth };
}

function normalizeAxis(value: number, min: number, max: number): number {
  const span = max - min;
  return span === 0 ? 0.5 : (value - min) / span;
}

function projectNormalized(
  point: Vec3,
  bounds: ProjectionBounds,
): { readonly nx: number; readonly ny: number; readonly depth: number } {
  const raw = projectRaw(point);
  return {
    nx: normalizeAxis(raw.u, bounds.minU, bounds.maxU),
    ny: normalizeAxis(raw.v, bounds.minV, bounds.maxV),
    depth: normalizeAxis(raw.depth, bounds.minDepth, bounds.maxDepth),
  };
}

/** Computes global projection bounds across all points at fixed 35° yaw and 22° pitch. */
export function computeProjectionBounds(points: readonly Vec3[]): ProjectionBounds {
  if (points.length === 0) {
    throw new RangeError('Cannot compute projection bounds for empty point set');
  }
  const first = projectRaw(points[0]!);
  let minU = first.u;
  let maxU = first.u;
  let minV = first.v;
  let maxV = first.v;
  let minDepth = first.depth;
  let maxDepth = first.depth;

  for (let i = 1; i < points.length; i += 1) {
    const raw = projectRaw(points[i]!);
    if (raw.u < minU) minU = raw.u;
    if (raw.u > maxU) maxU = raw.u;
    if (raw.v < minV) minV = raw.v;
    if (raw.v > maxV) maxV = raw.v;
    if (raw.depth < minDepth) minDepth = raw.depth;
    if (raw.depth > maxDepth) maxDepth = raw.depth;
  }
  return Object.freeze({ minU, maxU, minV, maxV, minDepth, maxDepth });
}

function buildProjectedLinks(
  scanners: readonly AlignedScanner[],
  projectedScanners: readonly ProjectedScanner[],
  activeScannerId: number,
): readonly ProjectedLink[] {
  const byId = new Map(projectedScanners.map((s) => [s.id, s]));
  const links: ProjectedLink[] = [];
  for (const s of scanners) {
    if (s.matchedParentId === null) continue;
    const parent = byId.get(s.matchedParentId)!;
    const child = byId.get(s.id)!;
    links.push({
      parentId: s.matchedParentId,
      childId: s.id,
      x1: parent.nx,
      y1: parent.ny,
      x2: child.nx,
      y2: child.ny,
      overlapCount: s.overlapCount,
      isActive: s.id === activeScannerId,
    });
  }
  return Object.freeze(links);
}

/** Projects a progressive scanner alignment snapshot using fixed global bounds. */
export function projectTrenchSnapshot(
  scanners: readonly AlignedScanner[],
  beacons: readonly Vec3[],
  bounds: ProjectionBounds,
  activeScannerId: number,
  newlyAddedBeaconKeys: ReadonlySet<string>,
): TrenchProjection {
  const projectedBeacons = beacons.map((world) => ({
    key: world.key,
    world,
    ...projectNormalized(world, bounds),
    isNew: newlyAddedBeaconKeys.has(world.key),
  }));
  const projectedScanners = scanners.map((s) => ({
    id: s.id,
    position: s.position,
    ...projectNormalized(s.position, bounds),
    isAnchor: s.isAnchor,
    isActive: s.id === activeScannerId,
    rotationLabel: s.rotation.label,
  }));
  return Object.freeze({
    beacons: Object.freeze(projectedBeacons),
    scanners: Object.freeze(projectedScanners),
    links: buildProjectedLinks(scanners, projectedScanners, activeScannerId),
  });
}
