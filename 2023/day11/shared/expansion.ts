import type { UniverseMap } from './universe';

export interface ExpandedGalaxyCoord {
  readonly row: bigint;
  readonly col: bigint;
}

/** Validates that the cosmic expansion factor is at least `1n`. */
export function validateExpansionFactor(factor: bigint): bigint {
  if (factor < 1n) {
    throw new RangeError(`Expansion factor must be >= 1n, got ${factor}`);
  }
  return factor;
}

function sumValidCounts(counts: readonly number[]): number {
  let total = 0;
  for (let i = 0; i < counts.length; i += 1) {
    const count = counts[i]!;
    if (!Number.isInteger(count) || count < 0) {
      throw new RangeError(`Galaxy count at index ${i} must be a non-negative integer, got ${count}`);
    }
    total += count;
  }
  return total;
}

/**
 * Computes the exact 1D pairwise Manhattan distance sum along one axis in O(N) time.
 * Every slice i contributes `prefix * (total - prefix) * width(i)` across all separated pairs.
 */
export function sweepAxisDistances(counts: readonly number[], expansionFactor: bigint): bigint {
  const factor = validateExpansionFactor(expansionFactor);
  const total = sumValidCounts(counts);
  let prefix = 0;
  let sum = 0n;

  for (let i = 0; i < counts.length; i += 1) {
    const count = counts[i]!;
    prefix += count;
    const width = count === 0 ? factor : 1n;
    // Cast counts to BigInt before multiplying so arbitrary galaxy counts never overflow.
    sum += BigInt(prefix) * BigInt(total - prefix) * width;
  }
  return sum;
}

/** Sums expanded Manhattan distances over all unordered galaxy pairs via axis decomposition. */
export function sumExpandedPairwiseDistances(
  universe: UniverseMap,
  expansionFactor: bigint,
): bigint {
  const factor = validateExpansionFactor(expansionFactor);
  return (
    sweepAxisDistances(universe.rowCounts(), factor) +
    sweepAxisDistances(universe.colCounts(), factor)
  );
}

function buildExpandedOffsets(counts: readonly number[], factor: bigint): readonly bigint[] {
  const offsets: bigint[] = [];
  let cursor = 0n;
  for (let i = 0; i < counts.length; i += 1) {
    offsets.push(cursor);
    cursor += counts[i] === 0 ? factor : 1n;
  }
  return offsets;
}

/** Computes exact BigInt expanded `(row, col)` coordinates for every galaxy in reading order. */
export function expandedGalaxyCoords(
  universe: UniverseMap,
  expansionFactor: bigint,
): readonly ExpandedGalaxyCoord[] {
  const factor = validateExpansionFactor(expansionFactor);
  const rowOffsets = buildExpandedOffsets(universe.rowCounts(), factor);
  const colOffsets = buildExpandedOffsets(universe.colCounts(), factor);
  const coords = universe.galaxies().map((g) =>
    Object.freeze({
      row: rowOffsets[g.row]!,
      col: colOffsets[g.col]!,
    }),
  );
  return Object.freeze(coords);
}
