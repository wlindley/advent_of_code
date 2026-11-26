import { sampleTraceIndices } from '../../../shared/core';
import { validateWindowSize, type SonarReport } from './sonarReport';
import type { SweepDeltaKind, SweepTraceFrame } from './windowSweep';

export const PROFILE_VIEWBOX = Object.freeze({
  width: 640,
  height: 220,
  padX: 36,
  padY: 22,
});

export const MAX_PROFILE_POINTS = 240;

export interface ProfilePoint {
  readonly index: number;
  readonly depth: number;
  readonly x: number;
  readonly y: number;
}

export interface ProfileGeometry {
  readonly points: readonly ProfilePoint[];
  readonly polylinePoints: string;
  readonly areaPath: string;
  readonly minDepth: number;
  readonly maxDepth: number;
  readonly totalPoints: number;
}

export interface WindowHighlightBand {
  readonly x: number;
  readonly width: number;
  readonly startIndex: number;
  readonly endIndex: number;
}

export interface ComparisonOverlay {
  readonly exitingPoint: ProfilePoint;
  readonly enteringPoint: ProfilePoint;
  readonly sharedBand: WindowHighlightBand | null;
  readonly deltaKind: SweepDeltaKind;
}

/** Projects a single reading from a SonarReport into SVG viewBox coordinates. */
export function projectDepthPoint(report: SonarReport, index: number): ProfilePoint {
  const depth = report.depthAt(index);
  const plotWidth = PROFILE_VIEWBOX.width - PROFILE_VIEWBOX.padX * 2;
  const plotHeight = PROFILE_VIEWBOX.height - PROFILE_VIEWBOX.padY * 2;
  const minDepth = report.minDepth;
  const span = report.maxDepth - minDepth;
  const x = report.count <= 1
    ? PROFILE_VIEWBOX.width / 2
    : PROFILE_VIEWBOX.padX + (index / (report.count - 1)) * plotWidth;
  const y = span === 0
    ? PROFILE_VIEWBOX.height / 2
    : PROFILE_VIEWBOX.padY + ((depth - minDepth) / span) * plotHeight;
  return Object.freeze({ index, depth, x, y });
}

/** Builds a bounded bathymetry polyline and shaded area path for a SonarReport. */
export function buildProfileGeometry(report: SonarReport): ProfileGeometry {
  const indices = sampleTraceIndices(report.count, MAX_PROFILE_POINTS);
  const points: ProfilePoint[] = [];
  const polylineCoords: string[] = [];
  const lineSegments: string[] = [];

  for (const index of indices) {
    const point = projectDepthPoint(report, index);
    points.push(point);
    const coord = `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    polylineCoords.push(coord);
    lineSegments.push(`L ${point.x.toFixed(1)} ${point.y.toFixed(1)}`);
  }

  const first = points[0]!;
  const last = points[points.length - 1]!;
  const bottomY = (PROFILE_VIEWBOX.height - PROFILE_VIEWBOX.padY).toFixed(1);
  const areaPath = `M ${first.x.toFixed(1)} ${bottomY} ${lineSegments.join(' ')} L ${last.x.toFixed(1)} ${bottomY} Z`;

  return Object.freeze({
    points: Object.freeze(points),
    polylinePoints: polylineCoords.join(' '),
    areaPath,
    minDepth: report.minDepth,
    maxDepth: report.maxDepth,
    totalPoints: report.count,
  });
}

/** Computes SVG overlay coordinates for the active exiting/entering comparison pair. */
export function buildComparisonOverlay(
  report: SonarReport,
  frame: SweepTraceFrame,
  windowSize: number,
): ComparisonOverlay {
  validateWindowSize(windowSize);
  const exitingPoint = projectDepthPoint(report, frame.comparisonIndex);
  const enteringPoint = projectDepthPoint(report, frame.comparisonIndex + windowSize);
  let sharedBand: WindowHighlightBand | null = null;
  if (windowSize > 1) {
    const startIndex = frame.comparisonIndex + 1;
    const endIndex = frame.comparisonIndex + windowSize - 1;
    const first = projectDepthPoint(report, startIndex);
    const last = projectDepthPoint(report, endIndex);
    sharedBand = Object.freeze({
      x: first.x - 4,
      width: last.x - first.x + 8,
      startIndex,
      endIndex,
    });
  }
  return Object.freeze({
    exitingPoint,
    enteringPoint,
    sharedBand,
    deltaKind: frame.deltaKind,
  });
}
