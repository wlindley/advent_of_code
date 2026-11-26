import { sampleTraceIndices, validateMaxSteps, type PuzzleSolver, type TraceOptions } from '../../../shared/core';
import { MAX_DENSE_GRID_CELLS, createCoverageAccumulator, type CoverageAccumulator, type CoverageObserver } from './accumulator';
import { countVentOverlaps } from './engine';
import { parseVentField } from './parser';
import { VentField, VentPoint, computeSegmentBounds, type VentSegment, type VentSelectionPolicy } from './types';

export const DEFAULT_MAX_TRACE_STEPS = 120;
export const MAX_TRACE_HOTSPOTS = 25_000;

export interface VentTraceOptions extends TraceOptions {
  readonly maxHotspots?: number;
}

/** Mutable bounded collector capturing newly crossed overlap and intense coordinates per frame. */
export class FrameHotspotCollector implements CoverageObserver {
  private readonly maxHotspots: number;
  private totalStored = 0;
  private _truncated = false;
  private overlaps: VentPoint[] = [];
  private intense: VentPoint[] = [];

  constructor(maxHotspots: number) { this.maxHotspots = maxHotspots; }
  get truncated(): boolean { return this._truncated; }

  private pushHotspot(bucket: VentPoint[], x: number, y: number): void {
    if (this.totalStored >= this.maxHotspots) {
      this._truncated = true;
      return;
    }
    bucket.push(new VentPoint(x, y));
    this.totalStored += 1;
  }

  onOverlap(x: number, y: number): void { this.pushHotspot(this.overlaps, x, y); }
  onIntense(x: number, y: number): void { this.pushHotspot(this.intense, x, y); }

  drainOverlaps(): readonly VentPoint[] {
    const drained = Object.freeze(this.overlaps);
    this.overlaps = [];
    return drained;
  }

  drainIntense(): readonly VentPoint[] {
    const drained = Object.freeze(this.intense);
    this.intense = [];
    return drained;
  }
}

/** Immutable sampled segment-playback trace frame with dynamically derived progress metrics. */
export class VentTraceFrame {
  readonly latestSegment: VentSegment;
  readonly latestIncluded: boolean;
  readonly includedCount: number;
  readonly skippedCount: number;
  readonly coveredCount: number;
  readonly overlapCount: number;
  readonly intenseCount: number;
  readonly maxDepth: number;
  readonly addedOverlaps: readonly VentPoint[];
  readonly addedIntense: readonly VentPoint[];
  readonly hotspotsTruncated: boolean;

  constructor(
    latestSegment: VentSegment, latestIncluded: boolean, includedCount: number, skippedCount: number,
    coveredCount: number, overlapCount: number, intenseCount: number, maxDepth: number,
    addedOverlaps: readonly VentPoint[], addedIntense: readonly VentPoint[], hotspotsTruncated: boolean,
  ) {
    this.latestSegment = latestSegment;
    this.latestIncluded = latestIncluded;
    this.includedCount = includedCount;
    this.skippedCount = skippedCount;
    this.coveredCount = coveredCount;
    this.overlapCount = overlapCount;
    this.intenseCount = intenseCount;
    this.maxDepth = maxDepth;
    this.addedOverlaps = Object.freeze(addedOverlaps);
    this.addedIntense = Object.freeze(addedIntense);
    this.hotspotsTruncated = hotspotsTruncated;
    Object.freeze(this);
  }

  get processedSegmentCount(): number { return this.includedCount + this.skippedCount; }
  get stepIndex(): number { return this.processedSegmentCount - 1; }
  get overlapRatio(): number { return this.coveredCount === 0 ? 0 : this.overlapCount / this.coveredCount; }
}

function buildTraceFrame(
  latestSegment: VentSegment, latestIncluded: boolean, includedCount: number, skippedCount: number,
  acc: CoverageAccumulator | null, collector: FrameHotspotCollector,
): VentTraceFrame {
  return new VentTraceFrame(
    latestSegment, latestIncluded, includedCount, skippedCount,
    acc === null ? 0 : acc.coveredCount, acc === null ? 0 : acc.overlapCount,
    acc === null ? 0 : acc.intenseCount, acc === null ? 0 : acc.maxDepth,
    collector.drainOverlaps(), collector.drainIntense(), collector.truncated,
  );
}

/** Generates bounded segment-by-segment trace frames with globally capped hotspot deltas. */
export function traceVentField(field: VentField, policy: VentSelectionPolicy, options?: VentTraceOptions): readonly VentTraceFrame[] {
  const limit = validateMaxSteps(options === undefined ? undefined : options.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const hotspotLimit = validateMaxSteps(options === undefined ? undefined : options.maxHotspots, MAX_TRACE_HOTSPOTS);
  const sampleSet = new Set(sampleTraceIndices(field.segmentCount, limit));
  const included = field.filter(policy);
  const collector = new FrameHotspotCollector(hotspotLimit);
  const acc = included.length === 0 ? null : createCoverageAccumulator(computeSegmentBounds(included), MAX_DENSE_GRID_CELLS, collector);
  const frames: VentTraceFrame[] = [];
  let includedCount = 0;
  let skippedCount = 0;
  for (let i = 0; i < field.segmentCount; i += 1) {
    const segment = field.segments[i]!;
    const latestIncluded = policy.includes(segment);
    if (latestIncluded) { includedCount += 1; acc!.addSegment(segment); }
    else skippedCount += 1;
    if (sampleSet.has(i)) frames.push(buildTraceFrame(segment, latestIncluded, includedCount, skippedCount, acc, collector));
  }
  return Object.freeze(frames);
}

/** Policy-parameterized PuzzleSolver implementation for hydrothermal vent fields. */
export class PolicyVentSolver implements Required<PuzzleSolver<VentField, number, VentTraceFrame>> {
  private readonly policy: VentSelectionPolicy;
  constructor(policy: VentSelectionPolicy) { this.policy = policy; Object.freeze(this); }
  parse(raw: string): VentField { return parseVentField(raw); }
  solve(field: VentField): number { return countVentOverlaps(field, this.policy); }
  trace(field: VentField, options?: VentTraceOptions): readonly VentTraceFrame[] { return traceVentField(field, this.policy, options); }
}

/** Creates a frozen PolicyVentSolver bound to the specified selection policy. */
export function createVentSolver(policy: VentSelectionPolicy): Required<PuzzleSolver<VentField, number, VentTraceFrame>> {
  return new PolicyVentSolver(policy);
}
