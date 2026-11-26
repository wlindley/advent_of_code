import type { Hailstone, TestArea } from './hailstone';

export type IntersectionKind = 'inside' | 'outside' | 'past-a' | 'past-b' | 'past-both' | 'parallel';

export interface ParallelPairIntersection {
  readonly kind: 'parallel';
  readonly indexA: number;
  readonly indexB: number;
}

export interface CrossingPairIntersection {
  readonly kind: Exclude<IntersectionKind, 'parallel'>;
  readonly indexA: number;
  readonly indexB: number;
  readonly xNum: bigint;
  readonly yNum: bigint;
  readonly den: bigint;
  readonly tANum: bigint;
  readonly tBNum: bigint;
}

export type PairIntersection = ParallelPairIntersection | CrossingPairIntersection;

/** Immutable summary counts of 2D hailstone pair intersection classifications. */
export class IntersectionSummary {
  readonly inside: number;
  readonly outside: number;
  readonly pastA: number;
  readonly pastB: number;
  readonly pastBoth: number;
  readonly parallel: number;

  constructor(
    inside: number,
    outside: number,
    pastA: number,
    pastB: number,
    pastBoth: number,
    parallel: number,
  ) {
    this.inside = inside;
    this.outside = outside;
    this.pastA = pastA;
    this.pastB = pastB;
    this.pastBoth = pastBoth;
    this.parallel = parallel;
    Object.freeze(this);
  }

  get totalPairs(): number {
    return this.inside + this.outside + this.pastA + this.pastB + this.pastBoth + this.parallel;
  }
}

function classifyCrossingKind(
  tANum: bigint,
  tBNum: bigint,
  xNum: bigint,
  yNum: bigint,
  den: bigint,
  area: TestArea,
): Exclude<IntersectionKind, 'parallel'> {
  if (tANum < 0n && tBNum < 0n) return 'past-both';
  if (tANum < 0n) return 'past-a';
  if (tBNum < 0n) return 'past-b';
  return area.containsRatio(xNum, yNum, den) ? 'inside' : 'outside';
}

/** Classifies the exact 2D XY ray intersection of two hailstones relative to `area`. */
export function classifyPair2D(a: Hailstone, b: Hailstone, area: TestArea): PairIntersection {
  const det = a.velocity.x * b.velocity.y - a.velocity.y * b.velocity.x;
  if (det === 0n) {
    return Object.freeze({ kind: 'parallel', indexA: a.id, indexB: b.id });
  }
  const sign = det < 0n ? -1n : 1n;
  const den = det * sign;
  const dx = b.position.x - a.position.x;
  const dy = b.position.y - a.position.y;
  const tANum = (dx * b.velocity.y - dy * b.velocity.x) * sign;
  const tBNum = (dx * a.velocity.y - dy * a.velocity.x) * sign;
  const xNum = a.position.x * den + tANum * a.velocity.x;
  const yNum = a.position.y * den + tANum * a.velocity.y;
  const kind = classifyCrossingKind(tANum, tBNum, xNum, yNum, den, area);
  return Object.freeze({
    kind,
    indexA: a.id,
    indexB: b.id,
    xNum,
    yNum,
    den,
    tANum,
    tBNum,
  });
}

/** Summarizes all pairwise 2D intersections across `hailstones`. */
export function summarizeIntersections2D(
  hailstones: readonly Hailstone[],
  area: TestArea,
): IntersectionSummary {
  const counts: Record<IntersectionKind, number> = {
    inside: 0,
    outside: 0,
    'past-a': 0,
    'past-b': 0,
    'past-both': 0,
    parallel: 0,
  };
  for (let i = 0; i < hailstones.length; i += 1) {
    for (let j = i + 1; j < hailstones.length; j += 1) {
      const hit = classifyPair2D(hailstones[i]!, hailstones[j]!, area);
      counts[hit.kind] += 1;
    }
  }
  return new IntersectionSummary(
    counts.inside,
    counts.outside,
    counts['past-a'],
    counts['past-b'],
    counts['past-both'],
    counts.parallel,
  );
}

/** Counts pairs whose 2D trajectories cross in the future inside `area`. */
export function countFutureIntersections2D(
  hailstones: readonly Hailstone[],
  area: TestArea,
): number {
  return summarizeIntersections2D(hailstones, area).inside;
}
