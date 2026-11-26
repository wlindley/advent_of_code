import { ceilDiv, Rational, sampleTraceIndices, type TraceOptions, validateMaxSteps } from '../../../shared/core';
import type { Hailstone, TestArea } from './hailstone';
import {
  classifyPair2D,
  type CrossingPairIntersection,
  type IntersectionKind,
  IntersectionSummary,
  type PairIntersection,
} from './intersection2d';

export const DEFAULT_MAX_TRACE_STEPS = 120;
export const MAX_VISIBLE_DOTS = 4_000;

export interface ClippedRaySegment {
  readonly hailstoneId: number;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

export interface VisibleIntersectionDot {
  readonly indexA: number;
  readonly indexB: number;
  readonly kind: Exclude<IntersectionKind, 'parallel'>;
  readonly x: number;
  readonly y: number;
}

export interface HailTrace2DFrame {
  readonly step: number;
  readonly totalPairs: number;
  readonly activePair: PairIntersection | null;
  readonly summary: IntersectionSummary;
  readonly visiblePrefixCount: number;
  readonly rays: readonly ClippedRaySegment[];
  readonly visibleIntersections: readonly VisibleIntersectionDot[];
}

function compareRational(a: Rational, b: Rational): bigint {
  return a.num * b.den - b.num * a.den;
}

function normalizeAtTime(stone: Hailstone, t: Rational, area: TestArea): [number, number] {
  const x = new Rational(stone.position.x).add(t.mul(new Rational(stone.velocity.x)));
  const y = new Rational(stone.position.y).add(t.mul(new Rational(stone.velocity.y)));
  return [area.normalizeRatio(x.num, x.den), area.normalizeRatio(y.num, y.den)];
}

/** Exact Rational Liang-Barsky clip of a 2D hailstone ray `[0, +inf)` to `[clipMin, clipMax]^2`. */
export function clipRayToViewport(
  stone: Hailstone,
  area: TestArea,
  clipMin: bigint,
  clipMax: bigint,
): ClippedRaySegment | null {
  let tMin = Rational.ZERO;
  let tMax: Rational | null = null;
  const axes: readonly [bigint, bigint][] = [[stone.position.x, stone.velocity.x], [stone.position.y, stone.velocity.y]];
  for (let i = 0; i < axes.length; i += 1) {
    const [p, v] = axes[i]!;
    if (v === 0n) {
      if (p < clipMin || p > clipMax) return null;
      continue;
    }
    const t1 = new Rational(clipMin - p, v);
    const t2 = new Rational(clipMax - p, v);
    const tEnter = v > 0n ? t1 : t2;
    const tExit = v > 0n ? t2 : t1;
    if (compareRational(tEnter, tMin) > 0n) tMin = tEnter;
    if (tMax === null || compareRational(tExit, tMax) < 0n) tMax = tExit;
    if (compareRational(tMin, tMax) > 0n) return null;
  }
  const [x1, y1] = normalizeAtTime(stone, tMin, area);
  const [x2, y2] = tMax === null ? [x1, y1] : normalizeAtTime(stone, tMax, area);
  return Object.freeze({ hailstoneId: stone.id, x1, y1, x2, y2 });
}

function isInsideBox(hit: CrossingPairIntersection, min: bigint, max: bigint): boolean {
  const minS = min * hit.den;
  const maxS = max * hit.den;
  return minS <= hit.xNum && hit.xNum <= maxS && minS <= hit.yNum && hit.yNum <= maxS;
}

function makeFrame(
  step: number,
  totalPairs: number,
  activePair: PairIntersection | null,
  c: Record<IntersectionKind, number>,
  visiblePrefixCount: number,
  rays: readonly ClippedRaySegment[],
  visibleIntersections: readonly VisibleIntersectionDot[],
): HailTrace2DFrame {
  const summary = new IntersectionSummary(c.inside, c.outside, c['past-a'], c['past-b'], c['past-both'], c.parallel);
  return Object.freeze({ step, totalPairs, activePair, summary, visiblePrefixCount, rays, visibleIntersections });
}

function recordPairDot(
  hit: PairIntersection,
  area: TestArea,
  clipMin: bigint,
  clipMax: bigint,
  dots: VisibleIntersectionDot[],
): void {
  if (hit.kind === 'parallel' || dots.length >= MAX_VISIBLE_DOTS || !isInsideBox(hit, clipMin, clipMax)) return;
  const x = area.normalizeRatio(hit.xNum, hit.den);
  const y = area.normalizeRatio(hit.yNum, hit.den);
  dots.push(Object.freeze({ indexA: hit.indexA, indexB: hit.indexB, kind: hit.kind, x, y }));
}

function collectSampledFrames(
  hailstones: readonly Hailstone[],
  area: TestArea,
  clipMin: bigint,
  clipMax: bigint,
  rays: readonly ClippedRaySegment[],
  sampled: readonly number[],
  totalPairs: number,
): readonly HailTrace2DFrame[] {
  const counts: Record<IntersectionKind, number> = { inside: 0, outside: 0, 'past-a': 0, 'past-b': 0, 'past-both': 0, parallel: 0 };
  const dots: VisibleIntersectionDot[] = [];
  const frames: HailTrace2DFrame[] = [];
  let cursor = sampled[0] === 0 ? (frames.push(makeFrame(0, totalPairs, null, counts, 0, rays, dots)), 1) : 0;
  let step = 0;
  for (let i = 0; i < hailstones.length; i += 1) {
    for (let j = i + 1; j < hailstones.length; j += 1) {
      step += 1;
      const hit = classifyPair2D(hailstones[i]!, hailstones[j]!, area);
      counts[hit.kind] += 1;
      recordPairDot(hit, area, clipMin, clipMax, dots);
      if (step === sampled[cursor]) {
        frames.push(makeFrame(step, totalPairs, hit, counts, dots.length, rays, dots));
        cursor += 1;
      }
    }
  }
  Object.freeze(dots);
  return Object.freeze(frames);
}

/** Builds a bounded 2D intersection trace sharing frozen rays and capped visible dots. */
export function buildHailTrace2D(
  hailstones: readonly Hailstone[],
  area: TestArea,
  options?: TraceOptions,
): readonly HailTrace2DFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const pad = ceilDiv(area.span, 5n);
  const clipMin = area.min - pad;
  const clipMax = area.max + pad;
  const rays: ClippedRaySegment[] = [];
  for (let i = 0; i < hailstones.length; i += 1) {
    const seg = clipRayToViewport(hailstones[i]!, area, clipMin, clipMax);
    if (seg !== null) rays.push(seg);
  }
  const n = hailstones.length;
  const totalPairs = n < 2 ? 0 : (n * (n - 1)) / 2;
  const sampled = totalPairs === 0 ? [0] : sampleTraceIndices(totalPairs + 1, maxSteps);
  return collectSampledFrames(hailstones, area, clipMin, clipMax, Object.freeze(rays), sampled, totalPairs);
}
