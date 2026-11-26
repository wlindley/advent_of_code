import { assertSafeInteger, type SensorReading } from '../../shared';

/** Multiplier applied to the distress beacon X coordinate in tuning frequency. */
export const TUNING_X_MULTIPLIER = 4_000_000n;

/** Integer 2D coordinate inside the Part 2 distress beacon search box. */
export interface DistressPoint {
  readonly x: number;
  readonly y: number;
}

/** Validates that `maxCoord` is a non-negative IEEE-754 safe integer. */
export function assertValidMaxCoord(maxCoord: number): void {
  assertSafeInteger(maxCoord, 'maxCoord');
  if (maxCoord < 0) {
    throw new RangeError(`maxCoord must be non-negative, got ${maxCoord}`);
  }
}

/** Computes the exact BigInt tuning frequency `4_000_000 * x + y`. */
export function tuningFrequency(point: DistressPoint): bigint {
  assertSafeInteger(point.x, 'x');
  assertSafeInteger(point.y, 'y');
  return BigInt(point.x) * TUNING_X_MULTIPLIER + BigInt(point.y);
}

function addInBox(
  map: Map<string, DistressPoint>,
  x: bigint,
  y: bigint,
  maxBig: bigint,
): void {
  if (x < 0n || x > maxBig || y < 0n || y > maxBig) return;
  const nx = Number(x);
  const ny = Number(y);
  const key = `${nx},${ny}`;
  if (!map.has(key)) {
    map.set(key, Object.freeze({ x: nx, y: ny }));
  }
}

function addBoxCorners(map: Map<string, DistressPoint>, maxBig: bigint): void {
  addInBox(map, 0n, 0n, maxBig);
  addInBox(map, 0n, maxBig, maxBig);
  addInBox(map, maxBig, 0n, maxBig);
  addInBox(map, maxBig, maxBig, maxBig);
}

function addBoundaryIntersections(
  map: Map<string, DistressPoint>,
  sumLines: ReadonlySet<bigint>,
  diffLines: ReadonlySet<bigint>,
  maxBig: bigint,
): void {
  for (const s of sumLines) {
    addInBox(map, 0n, s, maxBig);
    addInBox(map, maxBig, s - maxBig, maxBig);
    addInBox(map, s, 0n, maxBig);
    addInBox(map, s - maxBig, maxBig, maxBig);
  }
  for (const d of diffLines) {
    addInBox(map, 0n, -d, maxBig);
    addInBox(map, maxBig, maxBig - d, maxBig);
    addInBox(map, d, 0n, maxBig);
    addInBox(map, maxBig + d, maxBig, maxBig);
  }
}

function addDiagonalIntersections(
  map: Map<string, DistressPoint>,
  sumLines: ReadonlySet<bigint>,
  diffLines: ReadonlySet<bigint>,
  maxBig: bigint,
): void {
  for (const s of sumLines) {
    for (const d of diffLines) {
      const sd = s + d;
      if ((sd & 1n) === 0n) {
        addInBox(map, sd / 2n, (s - d) / 2n, maxBig);
      } else {
        // When s + d is odd, diagonals cross at a half-integer; check all 4 surrounding lattice points.
        const k = (sd - 1n) / 2n;
        addInBox(map, k, s - k, maxBig);
        addInBox(map, k + 1n, s - k - 1n, maxBig);
        addInBox(map, k, k - d, maxBig);
        addInBox(map, k + 1n, k + 1n - d, maxBig);
      }
    }
  }
}

/** Collects and deterministically sorts all candidate lattice points in `[0, maxCoord]^2`. */
export function collectCandidates(
  readings: readonly SensorReading[],
  maxCoord: number,
): readonly DistressPoint[] {
  assertValidMaxCoord(maxCoord);
  const maxBig = BigInt(maxCoord);
  const sumLines = new Set<bigint>();
  const diffLines = new Set<bigint>();
  for (const reading of readings) {
    const diag = reading.outerDiagonals;
    for (const s of diag.sumLines) sumLines.add(s);
    for (const d of diag.diffLines) diffLines.add(d);
  }
  const map = new Map<string, DistressPoint>();
  addBoxCorners(map, maxBig);
  addBoundaryIntersections(map, sumLines, diffLines, maxBig);
  addDiagonalIntersections(map, sumLines, diffLines, maxBig);
  const sorted = [...map.values()].sort((a, b) => (a.x !== b.x ? a.x - b.x : a.y - b.y));
  return Object.freeze(sorted);
}

/** Returns the index of the sole uncovered candidate, throwing if 0 or >= 2 match. */
export function findUniqueUncoveredIndex(
  readings: readonly SensorReading[],
  candidates: readonly DistressPoint[],
): number {
  const matches: number[] = [];
  for (let i = 0; i < candidates.length; i += 1) {
    const pt = candidates[i]!;
    if (!readings.some((r) => r.covers(pt.x, pt.y))) {
      matches.push(i);
    }
  }
  if (matches.length !== 1) {
    throw new Error(`Expected exactly 1 uncovered distress beacon, found ${matches.length}`);
  }
  return matches[0]!;
}

/** Finds the unique uncovered distress beacon coordinate inside `[0, maxCoord]^2`. */
export function findDistressBeacon(
  readings: readonly SensorReading[],
  maxCoord: number,
): DistressPoint {
  const candidates = collectCandidates(readings, maxCoord);
  const idx = findUniqueUncoveredIndex(readings, candidates);
  return candidates[idx]!;
}
