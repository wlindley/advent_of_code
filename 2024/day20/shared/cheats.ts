import type { DistanceField } from './bfs';
import { Cheat, type CheatConfig, type Racetrack, UNREACHABLE } from './model';

export interface SavingBucket {
  readonly saving: number;
  readonly count: number;
  readonly witness: Cheat;
}

/** Immutable sorted histogram of cheat savings with dynamic aggregate getters. */
export class CheatSummary {
  readonly buckets: readonly SavingBucket[];

  constructor(buckets: readonly SavingBucket[]) {
    const sorted = [...buckets].sort((a, b) => a.saving - b.saving);
    this.buckets = Object.freeze(sorted);
    Object.freeze(this);
  }

  get totalCount(): number {
    let sum = 0;
    for (const bucket of this.buckets) {
      sum += bucket.count;
    }
    return sum;
  }

  get maxSaving(): number {
    return this.buckets.length === 0 ? 0 : this.buckets[this.buckets.length - 1]!.saving;
  }

  get bestCheat(): Cheat | null {
    return this.buckets.length === 0 ? null : this.buckets[this.buckets.length - 1]!.witness;
  }
}

interface ScanContext {
  readonly rows: number;
  readonly cols: number;
  readonly maxDuration: number;
  readonly minSaving: number;
  readonly baseline: number;
  readonly distFromStart: Int32Array;
  readonly distFromEnd: Int32Array;
  readonly counts: Int32Array;
  readonly witnessStart: Int32Array;
  readonly witnessEnd: Int32Array;
}

function scanDiamondFromCell(ctx: ScanContext, uIdx: number): void {
  const uCol = uIdx % ctx.cols;
  const uRow = (uIdx - uCol) / ctx.cols;
  const distU = ctx.distFromStart[uIdx]!;
  const rMin = Math.max(0, uRow - ctx.maxDuration);
  const rMax = Math.min(ctx.rows - 1, uRow + ctx.maxDuration);

  for (let vr = rMin; vr <= rMax; vr += 1) {
    const dr = Math.abs(vr - uRow);
    const rem = ctx.maxDuration - dr;
    const cMin = Math.max(0, uCol - rem);
    const cMax = Math.min(ctx.cols - 1, uCol + rem);
    for (let vc = cMin; vc <= cMax; vc += 1) {
      const d = dr + Math.abs(vc - uCol);
      if (d < 2) continue;
      const vIdx = vr * ctx.cols + vc;
      const distV = ctx.distFromEnd[vIdx]!;
      if (distV === UNREACHABLE) continue;
      const saving = ctx.baseline - (distU + d + distV);
      if (saving >= ctx.minSaving) {
        const prev = ctx.counts[saving]!;
        if (prev === 0) {
          ctx.witnessStart[saving] = uIdx;
          ctx.witnessEnd[saving] = vIdx;
        }
        ctx.counts[saving] = prev + 1;
      }
    }
  }
}

function buildSavingBuckets(
  racetrack: Racetrack,
  counts: Int32Array,
  witnessStart: Int32Array,
  witnessEnd: Int32Array,
  minSaving: number,
): SavingBucket[] {
  const buckets: SavingBucket[] = [];
  for (let saving = minSaving; saving < counts.length; saving += 1) {
    const count = counts[saving]!;
    if (count === 0) continue;
    const witness = new Cheat(
      racetrack.pointAt(witnessStart[saving]!),
      racetrack.pointAt(witnessEnd[saving]!),
      saving,
    );
    buckets.push(Object.freeze({ saving, count, witness }));
  }
  return buckets;
}

function createScanContext(field: DistanceField, config: CheatConfig, baseline: number): ScanContext {
  const racetrack = field.racetrack;
  return {
    rows: racetrack.rows,
    cols: racetrack.cols,
    maxDuration: config.maxDuration,
    minSaving: config.minSaving,
    baseline,
    distFromStart: field.copyDistFromStart(),
    distFromEnd: field.copyDistFromEnd(),
    counts: new Int32Array(baseline - 1),
    witnessStart: new Int32Array(baseline - 1),
    witnessEnd: new Int32Array(baseline - 1),
  };
}

/** Finds all valid single-cheat shortcuts saving at least `config.minSaving` picoseconds. */
export function analyzeCheats(field: DistanceField, config: CheatConfig): CheatSummary {
  const baseline = field.baseline;
  if (baseline < config.minSaving + 2) return new CheatSummary([]);

  const ctx = createScanContext(field, config, baseline);
  const reachable = field.copyReachableCells();
  const maxStartDist = baseline - config.minSaving - 2;
  // `reachable` is ordered by distFromStart and includes E at baseline > maxStartDist, so the loop terminates before reachable.length.
  for (let i = 0; ctx.distFromStart[reachable[i]!]! <= maxStartDist; i += 1) {
    scanDiamondFromCell(ctx, reachable[i]!);
  }

  return new CheatSummary(
    buildSavingBuckets(field.racetrack, ctx.counts, ctx.witnessStart, ctx.witnessEnd, config.minSaving),
  );
}
