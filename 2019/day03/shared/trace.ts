import {
  sampleTraceIndices,
  validateMaxSteps,
  type TraceOptions,
} from '../../../shared/core';
import { findCrossings, pickBestCrossing } from './geometry';
import type { CrossingMetric } from './metric';
import {
  maxBigInt,
  minBigInt,
  type GridPoint,
  type ProjectedPoint,
  type Viewport,
  type WireBounds,
  type WireCrossing,
  type WirePair,
} from './types';

/** Default trace frame cap to keep interactive circuit rendering responsive on large inputs. */
export const DEFAULT_MAX_TRACE_STEPS = 240;

const PROJECTION_SCALE = 1_000_000n;

/** Sampled circuit-growth frame emitted for Day 3 interactive visualization. */
export interface WireTraceFrame {
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly firstVisibleCount: number;
  readonly secondVisibleCount: number;
  readonly pair: WirePair;
  readonly bounds: WireBounds;
  readonly discoveredCrossings: readonly WireCrossing[];
  readonly bestCrossing: WireCrossing | null;
}

/** Computes the inclusive coordinate bounding box covering origin and both wire paths. */
export function computeWireBounds(pair: WirePair): WireBounds {
  let minX = 0n;
  let maxX = 0n;
  let minY = 0n;
  let maxY = 0n;
  for (const wire of [pair.first, pair.second]) {
    for (const segment of wire) {
      const end = segment.end;
      minX = minBigInt(minX, end.x);
      maxX = maxBigInt(maxX, end.x);
      minY = minBigInt(minY, end.y);
      maxY = maxBigInt(maxY, end.y);
    }
  }
  return Object.freeze({ minX, maxX, minY, maxY });
}

function scaleOffset(delta: bigint, factor: bigint, span: bigint): number {
  return Number((delta * factor * PROJECTION_SCALE) / span) / Number(PROJECTION_SCALE);
}

function projectBox(
  dx: bigint,
  dy: bigint,
  spanX: bigint,
  spanY: bigint,
  availW: bigint,
  availH: bigint,
  padding: number,
): ProjectedPoint {
  if (availW * spanY <= availH * spanX) {
    const renderedH = scaleOffset(spanY, availW, spanX);
    const marginY = (Number(availH) - renderedH) / 2;
    return {
      x: padding + scaleOffset(dx, availW, spanX),
      y: padding + Number(availH) - marginY - scaleOffset(dy, availW, spanX),
    };
  }
  const renderedW = scaleOffset(spanX, availH, spanY);
  const marginX = (Number(availW) - renderedW) / 2;
  return {
    x: padding + marginX + scaleOffset(dx, availH, spanY),
    y: padding + Number(availH) - scaleOffset(dy, availH, spanY),
  };
}

/** Projects a BigInt Cartesian point into viewport pixel space (+Y upward, aspect-preserved). */
export function projectPoint(
  point: GridPoint,
  bounds: WireBounds,
  viewport: Viewport,
): ProjectedPoint {
  const availW = BigInt(Math.floor(viewport.width - 2 * viewport.padding));
  const availH = BigInt(Math.floor(viewport.height - 2 * viewport.padding));
  if (availW <= 0n || availH <= 0n) {
    throw new RangeError('Viewport available width and height must be positive');
  }
  const spanX = bounds.maxX - bounds.minX;
  const spanY = bounds.maxY - bounds.minY;
  const dx = point.x - bounds.minX;
  const dy = point.y - bounds.minY;
  if (spanX === 0n && spanY === 0n) {
    return { x: viewport.padding + Number(availW) / 2, y: viewport.padding + Number(availH) / 2 };
  }
  if (spanX === 0n) {
    return {
      x: viewport.padding + Number(availW) / 2,
      y: viewport.padding + Number(availH) - scaleOffset(dy, availH, spanY),
    };
  }
  if (spanY === 0n) {
    return {
      x: viewport.padding + scaleOffset(dx, availW, spanX),
      y: viewport.padding + Number(availH) / 2,
    };
  }
  return projectBox(dx, dy, spanX, spanY, availW, availH, viewport.padding);
}

function collectDiscovered(
  crossings: readonly WireCrossing[],
  stepIndex: number,
): readonly WireCrossing[] {
  const found: WireCrossing[] = [];
  for (const crossing of crossings) {
    if (crossing.discoveryStep <= stepIndex) {
      found.push(crossing);
    }
  }
  return Object.freeze(found);
}

/** Generates bounded trace frames depicting progressive wire growth and crossing discovery. */
export function traceCrossedWires(
  pair: WirePair,
  metric: CrossingMetric,
  options?: TraceOptions,
): readonly WireTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const totalSteps = Math.max(pair.first.length, pair.second.length);
  const sampled = sampleTraceIndices(totalSteps, limit);
  const bounds = computeWireBounds(pair);
  const allCrossings = findCrossings(pair);
  const frames: WireTraceFrame[] = [];
  for (const stepIndex of sampled) {
    const discoveredCrossings = collectDiscovered(allCrossings, stepIndex);
    frames.push(Object.freeze({
      stepIndex,
      totalSteps,
      firstVisibleCount: Math.min(pair.first.length, stepIndex + 1),
      secondVisibleCount: Math.min(pair.second.length, stepIndex + 1),
      pair,
      bounds,
      discoveredCrossings,
      bestCrossing: pickBestCrossing(discoveredCrossings, metric),
    }));
  }
  return Object.freeze(frames);
}
