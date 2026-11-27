import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../shared/core';
import type { TrickShotAnalysis } from './analyzer';
import {
  LaunchVelocity,
  simulateTrajectory,
  type ProbePoint,
  type YStepInterval,
} from './ballistics';
import type { TrickShotPolicy } from './policy';
import type { TargetArea } from './target';

export const DEFAULT_MAX_TRACE_STEPS = 48;
export const MAX_ARC_POINTS = 240;
export const MAX_PHASE_BANDS = 96;
export type TrickShotTracePhase = 'sweep' | 'arc';

const EMPTY_ARC: readonly ProbePoint[] = Object.freeze([]);

/** Contiguous inclusive horizontal launch velocity range [minVx, maxVx]. */
export class VxRange {
  constructor(readonly minVx: number, readonly maxVx: number) {
    Object.freeze(this);
  }

  get count(): number {
    return this.maxVx - this.minVx + 1;
  }
}

/** Validated phase-space band for a vertical velocity and its matching vx ranges. */
export class PhaseBand {
  readonly vxRanges: readonly VxRange[];

  constructor(readonly yInterval: YStepInterval, vxRanges: readonly VxRange[]) {
    this.vxRanges = Object.freeze([...vxRanges]);
    Object.freeze(this);
  }

  get matchCount(): number {
    let total = 0;
    for (const range of this.vxRanges) total += range.count;
    return total;
  }
}

/** Shared immutable target, phase-space bands, and winning trajectory snapshot. */
export class TrickShotTraceSnapshot {
  readonly phaseBands: readonly PhaseBand[];
  readonly bestArc: readonly ProbePoint[];

  constructor(
    readonly target: TargetArea,
    readonly policy: TrickShotPolicy,
    readonly bestVelocity: LaunchVelocity,
    readonly maxApexY: number,
    readonly validVelocityCount: number,
    phaseBands: readonly PhaseBand[],
    bestArc: readonly ProbePoint[],
  ) {
    this.phaseBands = Object.freeze([...phaseBands]);
    this.bestArc = Object.freeze([...bestArc]);
    Object.freeze(this);
  }

  get totalTimeline(): number {
    return this.phaseBands.length + this.bestArc.length;
  }
}

/** Immutable single animation frame covering either the vy sweep or ballistic arc replay. */
export class TrickShotTraceFrame {
  constructor(
    readonly step: number,
    readonly phase: TrickShotTracePhase,
    readonly activeBandIndex: number,
    readonly revealedArcCount: number,
    readonly runningBestApex: number,
    readonly runningValidCount: number,
    readonly candidateArc: readonly ProbePoint[],
    readonly snapshot: TrickShotTraceSnapshot,
  ) {
    Object.freeze(this);
  }

  get activeBand(): PhaseBand {
    return this.snapshot.phaseBands[this.activeBandIndex]!;
  }

  get activeResult(): number {
    return this.snapshot.policy.mode === 'max-apex' ? this.runningBestApex : this.runningValidCount;
  }

  get isComplete(): boolean {
    return this.phase === 'arc' && this.revealedArcCount === this.snapshot.bestArc.length;
  }

  get progressRatio(): number {
    return (this.activeBandIndex + 1 + this.revealedArcCount) / this.snapshot.totalTimeline;
  }
}

interface SweepEntry {
  readonly band: PhaseBand;
  readonly runningBestApex: number;
  readonly runningValidCount: number;
}

function groupVxRanges(vxValues: readonly number[]): readonly VxRange[] {
  if (vxValues.length === 0) return Object.freeze([]);
  const ranges: VxRange[] = [];
  let start = vxValues[0]!;
  let end = start;
  for (let i = 1; i < vxValues.length; i += 1) {
    const vx = vxValues[i]!;
    if (vx === end + 1) {
      end = vx;
    } else {
      ranges.push(new VxRange(start, end));
      start = vx;
      end = vx;
    }
  }
  ranges.push(new VxRange(start, end));
  return Object.freeze(ranges);
}

function capArcPoints(points: readonly ProbePoint[]): readonly ProbePoint[] {
  if (points.length <= MAX_ARC_POINTS) return points;
  const indices = sampleTraceIndices(points.length, MAX_ARC_POINTS);
  return Object.freeze(indices.map((i) => points[i]!));
}

function buildSweepEntries(analysis: TrickShotAnalysis): readonly SweepEntry[] {
  const bandIndices = sampleTraceIndices(analysis.yIntervals.length, MAX_PHASE_BANDS);
  const entries: SweepEntry[] = [];
  let cursor = 0;
  let runningBestApex = 0;
  let runningValidCount = 0;
  for (let i = 0; i < analysis.yIntervals.length; i += 1) {
    const yInt = analysis.yIntervals[i]!;
    const count = analysis.countMatchingVx(yInt);
    runningValidCount += count;
    if (count > 0 && yInt.apexY > runningBestApex) runningBestApex = yInt.apexY;
    if (i === bandIndices[cursor]) {
      const band = new PhaseBand(yInt, groupVxRanges(analysis.matchingVxValues(yInt)));
      entries.push({ band, runningBestApex, runningValidCount });
      cursor += 1;
    }
  }
  return entries;
}

function buildFrame(
  step: number,
  rawIdx: number,
  sweepEntries: readonly SweepEntry[],
  snapshot: TrickShotTraceSnapshot,
): TrickShotTraceFrame {
  const sweepTotal = sweepEntries.length;
  if (rawIdx < sweepTotal) {
    const entry = sweepEntries[rawIdx]!;
    const firstRange = entry.band.vxRanges[0];
    const candidateArc =
      firstRange === undefined
        ? EMPTY_ARC
        : capArcPoints(simulateTrajectory(new LaunchVelocity(firstRange.minVx, entry.band.yInterval.vy), snapshot.target));
    return new TrickShotTraceFrame(
      step, 'sweep', rawIdx, 0, entry.runningBestApex, entry.runningValidCount, candidateArc, snapshot,
    );
  }
  return new TrickShotTraceFrame(
    step, 'arc', sweepTotal - 1, rawIdx - sweepTotal + 1, snapshot.maxApexY, snapshot.validVelocityCount, EMPTY_ARC, snapshot,
  );
}

/** Generates bounded sweep-and-arc visualization trace frames for an analyzed target. */
export function traceTrickShot(
  analysis: TrickShotAnalysis,
  policy: TrickShotPolicy,
  options?: TraceOptions,
): readonly TrickShotTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sweepEntries = buildSweepEntries(analysis);
  const bestArc = capArcPoints(simulateTrajectory(analysis.bestVelocity, analysis.target));
  const snapshot = new TrickShotTraceSnapshot(
    analysis.target, policy, analysis.bestVelocity, analysis.maxApexY, analysis.validVelocityCount,
    sweepEntries.map((entry) => entry.band), bestArc,
  );
  const rawIndices = sampleTraceIndices(snapshot.totalTimeline, limit);
  return Object.freeze(rawIndices.map((rawIdx, step) => buildFrame(step, rawIdx, sweepEntries, snapshot)));
}
