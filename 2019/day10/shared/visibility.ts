import { AsteroidMap } from './asteroidMap';
import { AsteroidPoint, compareRaysClockwise, type RayDirection, reduceRay } from './geometry';

interface RayTargetEntry { readonly step: number; readonly point: AsteroidPoint; }
interface RayBucket { readonly ray: RayDirection; readonly targets: RayTargetEntry[]; }

function minInCounts(counts: readonly number[]): number {
  let minVal = counts[0]!;
  for (let i = 1; i < counts.length; i += 1) if (counts[i]! < minVal) minVal = counts[i]!;
  return minVal;
}

function maxInCounts(counts: readonly number[]): number {
  let maxVal = counts[0]!;
  for (let i = 1; i < counts.length; i += 1) if (counts[i]! > maxVal) maxVal = counts[i]!;
  return maxVal;
}

/** Immutable Part 1 visibility summary for an `AsteroidMap` with derived best/min/max getters. */
export class VisibilityAnalysis {
  readonly map: AsteroidMap;
  readonly counts: readonly number[];
  readonly bestIndex: number;

  constructor(map: AsteroidMap, counts: readonly number[], bestIndex: number) {
    if (counts.length !== map.asteroidCount) {
      throw new RangeError(`Expected ${map.asteroidCount} visibility counts, got ${counts.length}`);
    }
    map.asteroidAt(bestIndex);
    this.map = map;
    this.counts = Object.freeze([...counts]);
    this.bestIndex = bestIndex;
    Object.freeze(this);
  }

  get bestStation(): AsteroidPoint { return this.map.asteroidAt(this.bestIndex); }
  get bestDetectedCount(): number { return this.counts[this.bestIndex]!; }
  get minDetectedCount(): number { return minInCounts(this.counts); }
  get maxDetectedCount(): number { return maxInCounts(this.counts); }
}

/** Immutable single asteroid vaporization step in the Part 2 clockwise laser sweep. */
export class VaporizationEvent {
  readonly order: number;
  readonly sweepIndex: number;
  readonly ray: RayDirection;
  readonly target: AsteroidPoint;

  constructor(order: number, sweepIndex: number, ray: RayDirection, target: AsteroidPoint) {
    this.order = order;
    this.sweepIndex = sweepIndex;
    this.ray = Object.freeze({ rx: ray.rx, ry: ray.ry });
    this.target = target;
    Object.freeze(this);
  }

  get coordinateCode(): number { return this.target.coordinateCode; }
}

/** Computes line-of-sight asteroid counts using a symmetric row-major half-ray stamp table. */
export function computeVisibilityCounts(map: AsteroidMap): readonly number[] {
  const n = map.asteroidCount;
  const counts = new Uint32Array(n);
  const stride = 2 * map.width - 1;
  const seen = new Uint32Array(stride * map.height);
  let stamp = 0;

  for (let i = 0; i < n; i += 1) {
    stamp += 1;
    const origin = map.asteroidAt(i);
    for (let j = i + 1; j < n; j += 1) {
      const target = map.asteroidAt(j);
      const { ray } = reduceRay(target.x - origin.x, target.y - origin.y);
      // Row-major ordering guarantees ry > 0 or (ry === 0 && rx === 1), keeping key in [0, stride * height).
      const key = ray.ry * stride + (ray.rx + map.width - 1);
      if (seen[key]! !== stamp) { seen[key] = stamp; counts[i] = counts[i]! + 1; counts[j] = counts[j]! + 1; }
    }
  }
  return Object.freeze(Array.from(counts));
}

/** Analyzes all candidate stations on `map` and selects the earliest row-major maximum. */
export function analyzeVisibility(map: AsteroidMap): VisibilityAnalysis {
  const counts = computeVisibilityCounts(map);
  let bestIndex = 0;
  for (let i = 1; i < counts.length; i += 1) {
    if (counts[i]! > counts[bestIndex]!) bestIndex = i;
  }
  return new VisibilityAnalysis(map, counts, bestIndex);
}

function encodeFullRayKey(rx: number, ry: number, width: number, height: number): number {
  return (ry + height - 1) * (2 * width - 1) + (rx + width - 1);
}

function compareTargetSteps(a: RayTargetEntry, b: RayTargetEntry): number { return a.step - b.step; }
function compareBucketsClockwise(a: RayBucket, b: RayBucket): number { return compareRaysClockwise(a.ray, b.ray); }
function bucketClosestPoint(bucket: RayBucket): AsteroidPoint { return bucket.targets[0]!.point; }

function buildRayBuckets(map: AsteroidMap, stationIndex: number): readonly RayBucket[] {
  const station = map.asteroidAt(stationIndex);
  const byRay = new Map<number, RayBucket>();

  for (let i = 0; i < map.asteroidCount; i += 1) {
    if (i === stationIndex) continue;
    const point = map.asteroidAt(i);
    const { ray, step } = reduceRay(point.x - station.x, point.y - station.y);
    const key = encodeFullRayKey(ray.rx, ray.ry, map.width, map.height);
    let bucket = byRay.get(key);
    if (bucket === undefined) {
      bucket = { ray, targets: [] };
      byRay.set(key, bucket);
    }
    bucket.targets.push({ step, point });
  }
  const buckets = Array.from(byRay.values());
  for (const bucket of buckets) bucket.targets.sort(compareTargetSteps);
  buckets.sort(compareBucketsClockwise);
  return buckets;
}

/** Returns all asteroids directly visible from `stationIndex`, ordered clockwise from 12 o'clock. */
export function findVisibleTargets(map: AsteroidMap, stationIndex: number): readonly AsteroidPoint[] {
  return Object.freeze(buildRayBuckets(map, stationIndex).map(bucketClosestPoint));
}

/** Computes the full clockwise round-robin laser vaporization schedule from `stationIndex`. */
export function computeVaporizationSchedule(map: AsteroidMap, stationIndex: number): readonly VaporizationEvent[] {
  let active = buildRayBuckets(map, stationIndex);
  const schedule: VaporizationEvent[] = [];
  let sweepIndex = 0;
  let order = 1;
  while (active.length > 0) {
    const nextActive: RayBucket[] = [];
    for (const bucket of active) {
      schedule.push(new VaporizationEvent(order, sweepIndex, bucket.ray, bucket.targets[sweepIndex]!.point));
      order += 1;
      if (sweepIndex + 1 < bucket.targets.length) nextActive.push(bucket);
    }
    active = nextActive;
    sweepIndex += 1;
  }
  return Object.freeze(schedule);
}
