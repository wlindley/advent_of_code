import type { Cuboid } from './cuboid';

export interface SceneBounds {
  readonly minX: bigint;
  readonly maxX: bigint;
  readonly minY: bigint;
  readonly maxY: bigint;
  readonly minZ: bigint;
  readonly maxZ: bigint;
  readonly maxSpan: bigint;
}

export interface Point2D { readonly x: number; readonly y: number; }
export interface Viewport { readonly width: number; readonly height: number; readonly padding: number; }
export type FaceQuad = readonly [Point2D, Point2D, Point2D, Point2D];

export interface ProjectedCuboid {
  readonly cuboid: Cuboid;
  readonly topFace: FaceQuad;
  readonly leftFace: FaceQuad;
  readonly rightFace: FaceQuad;
  readonly depth: number;
}

export interface ProjectionResult {
  readonly cuboids: readonly ProjectedCuboid[];
  readonly truncatedCount: number;
}

const COS30 = Math.sqrt(3) / 2;
const NORM_PRECISION = 1_000_000n;
const NORM_DIVISOR = 1_000_000;

function bigMin(a: bigint, b: bigint): bigint {
  return a < b ? a : b;
}

function bigMax(a: bigint, b: bigint): bigint {
  return a > b ? a : b;
}

/** Computes global continuous half-open `[start, end + 1]` scene bounds (`maxSpan >= 1n`). */
export function computeSceneBounds(cuboids: readonly Cuboid[]): SceneBounds {
  if (cuboids.length === 0) {
    throw new RangeError('Cannot compute scene bounds for empty cuboid set');
  }
  const first = cuboids[0]!;
  let minX = first.x.start;
  let maxX = first.x.end + 1n;
  let minY = first.y.start;
  let maxY = first.y.end + 1n;
  let minZ = first.z.start;
  let maxZ = first.z.end + 1n;

  for (let i = 1; i < cuboids.length; i += 1) {
    const c = cuboids[i]!;
    minX = bigMin(minX, c.x.start);
    maxX = bigMax(maxX, c.x.end + 1n);
    minY = bigMin(minY, c.y.start);
    maxY = bigMax(maxY, c.y.end + 1n);
    minZ = bigMin(minZ, c.z.start);
    maxZ = bigMax(maxZ, c.z.end + 1n);
  }
  const maxSpan = bigMax(maxX - minX, bigMax(maxY - minY, maxZ - minZ));
  return Object.freeze({ minX, maxX, minY, maxY, minZ, maxZ, maxSpan });
}

function normalizeCoord(v: bigint, min: bigint, max: bigint, maxSpan: bigint): number {
  return Number(((2n * v - (min + max)) * NORM_PRECISION) / maxSpan) / NORM_DIVISOR;
}

function projectIso(nx: number, ny: number, nz: number, viewport: Viewport): Point2D {
  const halfW = viewport.width / 2 - viewport.padding;
  const halfH = viewport.height / 2 - viewport.padding;
  const scale = Math.min(halfW / Math.sqrt(3), halfH / 2);
  const isoX = (nx - nz) * COS30;
  const isoY = (nx + nz) * 0.5 - ny;
  return Object.freeze({
    x: viewport.width / 2 + isoX * scale,
    y: viewport.height / 2 + isoY * scale,
  });
}

/** Projects a single cuboid's 3 visible isometric faces into SVG viewport coordinates. */
export function projectCuboid(
  cuboid: Cuboid,
  bounds: SceneBounds,
  viewport: Viewport,
): ProjectedCuboid {
  const nx0 = normalizeCoord(cuboid.x.start, bounds.minX, bounds.maxX, bounds.maxSpan);
  const nx1 = normalizeCoord(cuboid.x.end + 1n, bounds.minX, bounds.maxX, bounds.maxSpan);
  const ny0 = normalizeCoord(cuboid.y.start, bounds.minY, bounds.maxY, bounds.maxSpan);
  const ny1 = normalizeCoord(cuboid.y.end + 1n, bounds.minY, bounds.maxY, bounds.maxSpan);
  const nz0 = normalizeCoord(cuboid.z.start, bounds.minZ, bounds.maxZ, bounds.maxSpan);
  const nz1 = normalizeCoord(cuboid.z.end + 1n, bounds.minZ, bounds.maxZ, bounds.maxSpan);

  const topBack = projectIso(nx0, ny1, nz0, viewport);
  const topRight = projectIso(nx1, ny1, nz0, viewport);
  const topFront = projectIso(nx1, ny1, nz1, viewport);
  const topLeft = projectIso(nx0, ny1, nz1, viewport);
  const botRight = projectIso(nx1, ny0, nz0, viewport);
  const botFront = projectIso(nx1, ny0, nz1, viewport);
  const botLeft = projectIso(nx0, ny0, nz1, viewport);

  return Object.freeze({
    cuboid,
    topFace: Object.freeze([topBack, topRight, topFront, topLeft] as const),
    leftFace: Object.freeze([topLeft, topFront, botFront, botLeft] as const),
    rightFace: Object.freeze([topFront, topRight, botRight, botFront] as const),
    depth: (nx0 + nx1 + ny0 + ny1 + nz0 + nz1) / 2,
  });
}

function compareByVolumeDesc(a: Cuboid, b: Cuboid): number {
  return a.volume > b.volume ? -1 : a.volume < b.volume ? 1 : 0;
}

function compareByDepthAsc(a: ProjectedCuboid, b: ProjectedCuboid): number {
  return a.depth - b.depth;
}

/** Projects and depth-sorts up to `maxCuboids` largest cuboids back-to-front. */
export function projectCuboids(
  cuboids: readonly Cuboid[],
  bounds: SceneBounds,
  viewport: Viewport,
  maxCuboids: number,
): ProjectionResult {
  if (!Number.isInteger(maxCuboids) || maxCuboids < 1) {
    throw new RangeError(`maxCuboids must be a positive integer, got ${maxCuboids}`);
  }
  const selected =
    cuboids.length > maxCuboids ? [...cuboids].sort(compareByVolumeDesc).slice(0, maxCuboids) : cuboids;
  const projected = selected.map((c) => projectCuboid(c, bounds, viewport)).sort(compareByDepthAsc);
  return Object.freeze({
    cuboids: Object.freeze(projected),
    truncatedCount: cuboids.length - selected.length,
  });
}
