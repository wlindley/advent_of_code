import type { Rotation3D } from './rotation';
import type { Vec3 } from './vec3';

function validateNonNegativeInt(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative safe integer, got ${value}`);
  }
  return 0 + value;
}

function deduplicateBeacons(beacons: readonly Vec3[]): readonly Vec3[] {
  if (beacons.length === 0) {
    throw new RangeError('Scanner must contain at least one beacon');
  }
  const seen = new Set<string>();
  const unique: Vec3[] = [];
  for (const beacon of beacons) {
    if (seen.has(beacon.key)) continue;
    seen.add(beacon.key);
    unique.push(beacon);
  }
  return Object.freeze(unique);
}

/** Raw beacon readings reported in a single scanner's local coordinate frame. */
export class ScannerReport {
  readonly id: number;
  readonly beacons: readonly Vec3[];

  constructor(id: number, beacons: readonly Vec3[]) {
    this.id = validateNonNegativeInt(id, 'Scanner id');
    this.beacons = deduplicateBeacons(beacons);
    Object.freeze(this);
  }

  get beaconCount(): number {
    return this.beacons.length;
  }
}

/** Scanner aligned into the anchor scanner's world coordinate frame. */
export class AlignedScanner {
  readonly id: number;
  readonly matchedParentId: number | null;
  readonly overlapCount: number;
  readonly beacons: readonly Vec3[];

  constructor(
    id: number,
    readonly position: Vec3,
    readonly rotation: Rotation3D,
    matchedParentId: number | null,
    overlapCount: number,
    beacons: readonly Vec3[],
  ) {
    this.id = validateNonNegativeInt(id, 'Scanner id');
    this.matchedParentId =
      matchedParentId === null ? null : validateNonNegativeInt(matchedParentId, 'Parent scanner id');
    this.overlapCount = validateNonNegativeInt(overlapCount, 'Overlap count');
    this.beacons = deduplicateBeacons(beacons);
    Object.freeze(this);
  }

  get isAnchor(): boolean {
    return this.matchedParentId === null;
  }

  get beaconCount(): number {
    return this.beacons.length;
  }
}

/** Computes sorted pairwise squared Euclidean distances for fast rotation-invariant filtering. */
export function computePairwiseSqDistances(beacons: readonly Vec3[]): Float64Array {
  const n = beacons.length;
  const distances = new Float64Array((n * (n - 1)) / 2);
  let k = 0;
  for (let i = 0; i < n; i += 1) {
    const a = beacons[i]!;
    for (let j = i + 1; j < n; j += 1) {
      distances[k] = a.squaredDistanceTo(beacons[j]!);
      k += 1;
    }
  }
  distances.sort();
  return distances;
}

/** Counts multiset overlap between two sorted squared-distance fingerprints. */
export function countSharedDistances(a: Float64Array, b: Float64Array): number {
  let i = 0;
  let j = 0;
  let shared = 0;
  while (i < a.length && j < b.length) {
    const va = a[i]!;
    const vb = b[j]!;
    if (va === vb) {
      shared += 1;
      i += 1;
      j += 1;
    } else if (va < vb) {
      i += 1;
    } else {
      j += 1;
    }
  }
  return shared;
}
