import { ClosedInterval } from '../../../shared/core';
import type { CrossingMetric } from './metric';
import {
  WireCrossing,
  minBigInt,
  type GridPoint,
  type Orientation,
  type WirePair,
  type WireSegment,
} from './types';

const ORIGIN_INTERVAL = new ClosedInterval(0n, 0n);

interface SegmentMeta {
  readonly segment: WireSegment;
  readonly orientation: Orientation;
  readonly fixedCoord: bigint;
  readonly span: ClosedInterval;
}

function buildSegmentMeta(segments: readonly WireSegment[]): readonly SegmentMeta[] {
  const result: SegmentMeta[] = [];
  for (const segment of segments) {
    result.push({
      segment,
      orientation: segment.orientation,
      fixedCoord: segment.fixedCoord,
      span: segment.span,
    });
  }
  return result;
}

function intersectOrthogonal(a: SegmentMeta, b: SegmentMeta): readonly GridPoint[] {
  const horiz = a.orientation === 'H' ? a : b;
  const vert = a.orientation === 'H' ? b : a;
  if (!horiz.span.contains(vert.fixedCoord) || !vert.span.contains(horiz.fixedCoord)) {
    return [];
  }
  if (vert.fixedCoord === 0n && horiz.fixedCoord === 0n) {
    return [];
  }
  return [{ x: vert.fixedCoord, y: horiz.fixedCoord }];
}

function emitRangePoints(
  orientation: Orientation,
  fixedCoord: bigint,
  range: ClosedInterval,
  out: GridPoint[],
): void {
  const coords: bigint[] = [range.start];
  if (range.end !== range.start) {
    coords.push(range.end);
  }
  if (range.start < 0n && range.end > 0n) {
    coords.push(0n);
  }
  for (const coord of coords) {
    out.push(orientation === 'H' ? { x: coord, y: fixedCoord } : { x: fixedCoord, y: coord });
  }
}

function intersectCollinear(a: SegmentMeta, b: SegmentMeta): readonly GridPoint[] {
  if (a.fixedCoord !== b.fixedCoord) {
    return [];
  }
  const overlap = a.span.intersection(b.span);
  if (overlap === null) {
    return [];
  }
  const ranges = a.fixedCoord === 0n ? overlap.subtract(ORIGIN_INTERVAL) : [overlap];
  const points: GridPoint[] = [];
  for (const range of ranges) {
    emitRangePoints(a.orientation, a.fixedCoord, range, points);
  }
  return points;
}

function recordCrossing(
  byKey: Map<string, WireCrossing>,
  point: GridPoint,
  a: WireSegment,
  b: WireSegment,
): void {
  const key = `${point.x},${point.y}`;
  const firstSteps = a.stepsTo(point);
  const secondSteps = b.stepsTo(point);
  const discoveryStep = Math.max(a.index, b.index);
  const prev = byKey.get(key);
  if (prev === undefined) {
    byKey.set(key, new WireCrossing(point, firstSteps, secondSteps, discoveryStep));
    return;
  }
  byKey.set(
    key,
    new WireCrossing(
      prev.point,
      minBigInt(prev.firstSteps, firstSteps),
      minBigInt(prev.secondSteps, secondSteps),
      Math.min(prev.discoveryStep, discoveryStep),
    ),
  );
}

/** Finds all non-origin crossings between two wires with minimum per-wire step counts. */
export function findCrossings(pair: WirePair): readonly WireCrossing[] {
  const firstMeta = buildSegmentMeta(pair.first);
  const secondMeta = buildSegmentMeta(pair.second);
  const byKey = new Map<string, WireCrossing>();
  for (const a of firstMeta) {
    for (const b of secondMeta) {
      const points =
        a.orientation !== b.orientation ? intersectOrthogonal(a, b) : intersectCollinear(a, b);
      for (const point of points) {
        recordCrossing(byKey, point, a.segment, b.segment);
      }
    }
  }
  return Object.freeze(Array.from(byKey.values()));
}

/** Selects the minimum-score crossing under the provided metric, or null if none exist. */
export function pickBestCrossing(
  crossings: readonly WireCrossing[],
  metric: CrossingMetric,
): WireCrossing | null {
  if (crossings.length === 0) {
    return null;
  }
  let best = crossings[0]!;
  let bestScore = metric.score(best);
  for (let i = 1; i < crossings.length; i += 1) {
    const candidate = crossings[i]!;
    const score = metric.score(candidate);
    if (score < bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
}
