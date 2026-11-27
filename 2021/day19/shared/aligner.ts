import { IDENTITY_ROTATION, ROTATIONS_24, type AxisSign, type Rotation3D } from './rotation';
import { AlignedScanner, computePairwiseSqDistances, countSharedDistances, type ScannerReport } from './scanner';
import { Vec3, type AxisIndex } from './vec3';

/** Default minimum overlapping beacons required to lock two scanner frames together. */
export const DEFAULT_MIN_OVERLAP = 12;

/** Pair of aligned scanners and their Manhattan separation. */
export interface ScannerPair {
  readonly aId: number;
  readonly bId: number;
  readonly distance: number;
}

interface ParentFrame {
  readonly scanner: AlignedScanner;
  readonly keys: ReadonlySet<string>;
  readonly axes: readonly [readonly number[], readonly number[], readonly number[]];
  readonly fingerprint: Float64Array;
}

function compareVec3(a: Vec3, b: Vec3): number {
  if (a.x !== b.x) return a.x - b.x;
  if (a.y !== b.y) return a.y - b.y;
  return a.z - b.z;
}

function normalizeWorldBeacons(beacons: readonly Vec3[]): readonly Vec3[] {
  if (beacons.length === 0) throw new RangeError('TrenchMap requires at least one beacon');
  const seen = new Set<string>();
  const unique: Vec3[] = [];
  for (const b of beacons) {
    if (!seen.has(b.key)) {
      seen.add(b.key);
      unique.push(b);
    }
  }
  unique.sort(compareVec3);
  return Object.freeze(unique);
}

/** Fully aligned 3D trench map of scanners and deduplicated world-frame beacons. */
export class TrenchMap {
  readonly scanners: readonly AlignedScanner[];
  readonly beacons: readonly Vec3[];

  constructor(scanners: readonly AlignedScanner[], beacons: readonly Vec3[]) {
    if (scanners.length === 0) throw new RangeError('TrenchMap requires at least one aligned scanner');
    this.scanners = Object.freeze([...scanners]);
    this.beacons = normalizeWorldBeacons(beacons);
    Object.freeze(this);
  }

  get scannerCount(): number { return this.scanners.length; }
  get beaconCount(): number { return this.beacons.length; }
  get maxScannerManhattan(): number { return this.farthestScannerPair.distance; }

  get farthestScannerPair(): ScannerPair {
    let bestA = this.scanners[0]!.id;
    let bestB = bestA;
    let bestDist = 0;
    for (let i = 0; i < this.scanners.length; i += 1) {
      const a = this.scanners[i]!;
      for (let j = i + 1; j < this.scanners.length; j += 1) {
        const b = this.scanners[j]!;
        const dist = a.position.manhattanDistanceTo(b.position);
        if (dist > bestDist) {
          bestDist = dist;
          bestA = Math.min(a.id, b.id);
          bestB = Math.max(a.id, b.id);
        }
      }
    }
    return { aId: bestA, bId: bestB, distance: bestDist };
  }
}

/** Returns all 1D translation offsets `a - b` achieving at least `minOverlap` pair votes. */
export function findAxisOffsets(
  alignedAxis: readonly number[],
  candidateAxis: readonly number[],
  minOverlap: number,
): number[] {
  const counts = new Map<number, number>();
  for (const a of alignedAxis) {
    for (const b of candidateAxis) {
      const offset = a - b;
      counts.set(offset, (counts.get(offset) ?? 0) + 1);
    }
  }
  const offsets: number[] = [];
  for (const [offset, count] of counts) {
    if (count >= minOverlap) offsets.push(offset);
  }
  return offsets;
}

function buildParentFrame(scanner: AlignedScanner, fingerprint: Float64Array): ParentFrame {
  const keys = new Set(scanner.beacons.map((b) => b.key));
  const axes: readonly [readonly number[], readonly number[], readonly number[]] = [
    scanner.beacons.map((b) => b.x),
    scanner.beacons.map((b) => b.y),
    scanner.beacons.map((b) => b.z),
  ];
  return { scanner, keys, axes, fingerprint };
}

function countOverlapAtOffset(
  rotated: readonly Vec3[], tx: number, ty: number, tz: number, parentKeys: ReadonlySet<string>,
): number {
  let overlap = 0;
  for (const b of rotated) {
    if (parentKeys.has(`${b.x + tx},${b.y + ty},${b.z + tz}`)) overlap += 1;
  }
  return overlap;
}

function extractRotatedAxis(beacons: readonly Vec3[], axis: AxisIndex, sign: AxisSign): number[] {
  return beacons.map((b) => sign * b.axis(axis));
}

function tryMatchRotation(
  parent: ParentFrame, candidateId: number, beacons: readonly Vec3[], rot: Rotation3D, minOverlap: number,
): AlignedScanner | null {
  const xs = findAxisOffsets(parent.axes[0], extractRotatedAxis(beacons, rot.xAxis, rot.xSign), minOverlap);
  if (xs.length === 0) return null;
  const ys = findAxisOffsets(parent.axes[1], extractRotatedAxis(beacons, rot.yAxis, rot.ySign), minOverlap);
  if (ys.length === 0) return null;
  const zs = findAxisOffsets(parent.axes[2], extractRotatedAxis(beacons, rot.zAxis, rot.zSign), minOverlap);
  if (zs.length === 0) return null;
  const rotated = beacons.map((b) => rot.apply(b));

  for (const tx of xs) {
    for (const ty of ys) {
      for (const tz of zs) {
        const overlap = countOverlapAtOffset(rotated, tx, ty, tz, parent.keys);
        if (overlap >= minOverlap) {
          const pos = new Vec3(tx, ty, tz);
          return new AlignedScanner(candidateId, pos, rot, parent.scanner.id, overlap, rotated.map((b) => b.add(pos)));
        }
      }
    }
  }
  return null;
}

function matchCandidate(
  parent: ParentFrame, candidate: ScannerReport, candidateFp: Float64Array, minSharedPairs: number, minOverlap: number,
): AlignedScanner | null {
  if (countSharedDistances(parent.fingerprint, candidateFp) < minSharedPairs) return null;
  for (const rot of ROTATIONS_24) {
    const aligned = tryMatchRotation(parent, candidate.id, candidate.beacons, rot, minOverlap);
    if (aligned !== null) return aligned;
  }
  return null;
}

function matchPendingAgainstParent(
  parent: ParentFrame, pending: ScannerReport[], fingerprints: ReadonlyMap<number, Float64Array>,
  aligned: AlignedScanner[], minSharedPairs: number, minOverlap: number,
): void {
  for (let i = pending.length - 1; i >= 0; i -= 1) {
    const candidate = pending[i]!;
    const matched = matchCandidate(parent, candidate, fingerprints.get(candidate.id)!, minSharedPairs, minOverlap);
    if (matched !== null) {
      aligned.push(matched);
      pending.splice(i, 1);
    }
  }
}

/** Aligns all scanner reports into a single coordinate frame via BFS and 3D overlap verification. */
export function alignScanners(reports: readonly ScannerReport[], minOverlap: number): TrenchMap {
  if (reports.length === 0) throw new RangeError('At least one scanner report is required');
  if (!Number.isSafeInteger(minOverlap) || minOverlap < 2) {
    throw new RangeError(`minOverlap must be an integer >= 2, got ${minOverlap}`);
  }
  const minSharedPairs = (minOverlap * (minOverlap - 1)) / 2;
  const anchorReport = reports.find((r) => r.id === 0) ?? reports[0]!;
  const anchor = new AlignedScanner(
    anchorReport.id, new Vec3(0, 0, 0), IDENTITY_ROTATION, null, anchorReport.beaconCount, anchorReport.beacons,
  );
  const fingerprints = new Map(reports.map((r) => [r.id, computePairwiseSqDistances(r.beacons)]));
  const aligned: AlignedScanner[] = [anchor];
  const pending = reports.filter((r) => r !== anchorReport);

  for (let head = 0; head < aligned.length; head += 1) {
    const parent = buildParentFrame(aligned[head]!, fingerprints.get(aligned[head]!.id)!);
    matchPendingAgainstParent(parent, pending, fingerprints, aligned, minSharedPairs, minOverlap);
  }
  if (pending.length > 0) {
    throw new Error(`Unable to align all scanners; disconnected ids: ${pending.map((r) => r.id).join(', ')}`);
  }
  return new TrenchMap(aligned, aligned.flatMap((s) => s.beacons));
}
