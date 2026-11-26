import { sampleTraceIndices, type TraceOptions, validateMaxSteps } from '../../../shared/core';
import type { LagoonBounds, LagoonEdge, LagoonPoint, LagoonPolygon } from './lagoonPolygon';

export const DEFAULT_MAX_TRACE_STEPS = 120;

export interface SvgPoint {
  readonly x: number;
  readonly y: number;
}

export interface SvgViewport {
  readonly width: number;
  readonly height: number;
  readonly padding: number;
}

export interface ProjectedPolygon {
  readonly origin: SvgPoint;
  readonly vertices: readonly SvgPoint[];
}

/** Immutable playback frame representing progress after `completedEdges` trench legs. */
export class LagoonTraceFrame {
  readonly polygon: LagoonPolygon;
  readonly completedEdges: number;
  readonly frameIndex: number;
  readonly totalFrames: number;

  constructor(polygon: LagoonPolygon, completedEdges: number, frameIndex: number, totalFrames: number) {
    if (!Number.isInteger(totalFrames) || totalFrames < 1) {
      throw new RangeError(`totalFrames must be >= 1, got ${totalFrames}`);
    }
    if (!Number.isInteger(frameIndex) || frameIndex < 0 || frameIndex >= totalFrames) {
      throw new RangeError(`frameIndex ${frameIndex} out of bounds for ${totalFrames} frames`);
    }
    if (!Number.isInteger(completedEdges) || completedEdges < 1 || completedEdges > polygon.stepCount) {
      throw new RangeError(`completedEdges ${completedEdges} out of bounds [1, ${polygon.stepCount}]`);
    }
    this.polygon = polygon;
    this.completedEdges = completedEdges;
    this.frameIndex = frameIndex;
    this.totalFrames = totalFrames;
    Object.freeze(this);
  }

  get activeEdge(): LagoonEdge {
    return this.polygon.edges[this.completedEdges - 1]!;
  }

  get cumulativeBoundary(): bigint {
    let total = 0n;
    for (let i = 0; i < this.completedEdges; i += 1) total += this.polygon.edges[i]!.distance;
    return total;
  }

  get cumulativeSignedDoubleArea(): bigint {
    let sum = 0n;
    for (let i = 0; i < this.completedEdges; i += 1) sum += this.polygon.edges[i]!.shoelaceTerm;
    return sum;
  }

  get isComplete(): boolean {
    return this.completedEdges === this.polygon.stepCount;
  }
}

/** Uniformly samples up to `maxSteps` polygon construction frames, preserving endpoints. */
export function buildLagoonTrace(
  polygon: LagoonPolygon,
  options?: TraceOptions,
): readonly LagoonTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sampled = sampleTraceIndices(polygon.stepCount, limit);
  return Object.freeze(
    sampled.map((edgeIdx, frameIdx) => new LagoonTraceFrame(polygon, edgeIdx + 1, frameIdx, sampled.length)),
  );
}

function validateViewport(viewport: SvgViewport): void {
  const { width, height, padding } = viewport;
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    throw new RangeError(`Viewport dimensions must be finite and positive, got ${width}x${height}`);
  }
  if (!Number.isFinite(padding) || padding < 0 || 2 * padding >= width || 2 * padding >= height) {
    throw new RangeError(`Invalid viewport padding ${padding} for ${width}x${height}`);
  }
}

function scaleCoord(coord: bigint, min: bigint, denom: bigint, scalePx: number): number {
  return (Number(((coord - min) * 10_000n) / denom) / 10_000) * scalePx;
}

function projectVertex(
  pt: LagoonPoint,
  bounds: LagoonBounds,
  denom: bigint,
  scalePx: number,
  offsetX: number,
  offsetY: number,
): SvgPoint {
  return Object.freeze({
    x: offsetX + scaleCoord(pt.x, bounds.minX, denom, scalePx),
    y: offsetY + scaleCoord(pt.y, bounds.minY, denom, scalePx),
  });
}

/** Projects exact BigInt polygon vertices into a centered, aspect-preserving SVG viewport. */
export function projectPolygonToSvg(polygon: LagoonPolygon, viewport: SvgViewport): ProjectedPolygon {
  validateViewport(viewport);
  const bounds = polygon.bounds;
  const innerW = viewport.width - 2 * viewport.padding;
  const innerH = viewport.height - 2 * viewport.padding;
  const widthLimited = BigInt(Math.round(innerW * 100)) * bounds.spanY <= BigInt(Math.round(innerH * 100)) * bounds.spanX;
  const denom = widthLimited ? bounds.spanX : bounds.spanY;
  const scalePx = widthLimited ? innerW : innerH;
  const offsetX = viewport.padding + (innerW - scaleCoord(bounds.maxX, bounds.minX, denom, scalePx)) / 2;
  const offsetY = viewport.padding + (innerH - scaleCoord(bounds.maxY, bounds.minY, denom, scalePx)) / 2;
  const vertices = Object.freeze(
    polygon.edges.map((edge) => projectVertex(edge.start, bounds, denom, scalePx, offsetX, offsetY)),
  );
  return Object.freeze({ origin: vertices[0]!, vertices });
}
