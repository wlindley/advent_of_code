import { validateMaxSteps } from '../../../shared/core';
import {
  MAX_DENSE_GRID_CELLS,
  NOOP_COVERAGE_OBSERVER,
  createCoverageAccumulator,
  type CoverageMode,
} from './accumulator';
import {
  computeSegmentBounds,
  type VentBounds,
  type VentField,
  type VentSegment,
  type VentSelectionPolicy,
} from './types';

export const AXIS_ALIGNED_POLICY: VentSelectionPolicy = Object.freeze({
  id: 'axis-aligned',
  label: 'Axis-Aligned',
  description: 'Horizontal and vertical vent lines only',
  includes: (segment: VentSegment) => segment.isAxisAligned,
});

export const OCTILINEAR_POLICY: VentSelectionPolicy = Object.freeze({
  id: 'octilinear',
  label: 'Octilinear',
  description: 'Horizontal, vertical, and 45-degree diagonal vent lines',
  includes: (segment: VentSegment) => segment.isOctilinear,
});

/** Immutable aggregate coverage summary for a filtered hydrothermal vent field. */
export class VentOverlapSummary {
  readonly mode: CoverageMode;
  readonly bounds: VentBounds | null;
  readonly includedCount: number;
  readonly skippedCount: number;
  readonly coveredCount: number;
  readonly overlapCount: number;
  readonly intenseCount: number;
  readonly maxDepth: number;

  constructor(
    mode: CoverageMode,
    bounds: VentBounds | null,
    includedCount: number,
    skippedCount: number,
    coveredCount: number,
    overlapCount: number,
    intenseCount: number,
    maxDepth: number,
  ) {
    this.mode = mode;
    this.bounds = bounds;
    this.includedCount = includedCount;
    this.skippedCount = skippedCount;
    this.coveredCount = coveredCount;
    this.overlapCount = overlapCount;
    this.intenseCount = intenseCount;
    this.maxDepth = maxDepth;
    Object.freeze(this);
  }

  get processedSegmentCount(): number {
    return this.includedCount + this.skippedCount;
  }

  get overlapRatio(): number {
    return this.coveredCount === 0 ? 0 : this.overlapCount / this.coveredCount;
  }
}

/** Evaluates coverage statistics for all segments matching `policy`. */
export function analyzeVentField(
  field: VentField,
  policy: VentSelectionPolicy,
  maxDenseCells?: number,
): VentOverlapSummary {
  const denseLimit = validateMaxSteps(maxDenseCells, MAX_DENSE_GRID_CELLS);
  const included = field.filter(policy);
  const skippedCount = field.segmentCount - included.length;
  if (included.length === 0) {
    return new VentOverlapSummary('sparse', null, 0, skippedCount, 0, 0, 0, 0);
  }
  const bounds = computeSegmentBounds(included);
  const acc = createCoverageAccumulator(bounds, denseLimit, NOOP_COVERAGE_OBSERVER);
  for (const segment of included) acc.addSegment(segment);
  return new VentOverlapSummary(
    acc.mode,
    bounds,
    included.length,
    skippedCount,
    acc.coveredCount,
    acc.overlapCount,
    acc.intenseCount,
    acc.maxDepth,
  );
}

/** Counts lattice points covered by at least two policy-selected segments. */
export function countVentOverlaps(field: VentField, policy: VentSelectionPolicy): number {
  return analyzeVentField(field, policy).overlapCount;
}
