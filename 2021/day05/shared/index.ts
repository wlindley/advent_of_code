export {
  VentBounds,
  VentField,
  VentPoint,
  VentSegment,
  computeSegmentBounds,
  type SegmentOrientation,
  type VentSelectionPolicy,
} from './types';
export { parseVentField } from './parser';
export {
  BaseCoverageAccumulator,
  DenseCoverageAccumulator,
  MAX_DENSE_GRID_CELLS,
  NOOP_COVERAGE_OBSERVER,
  SparseCoverageAccumulator,
  createCoverageAccumulator,
  type CoverageAccumulator,
  type CoverageMode,
  type CoverageObserver,
} from './accumulator';
export {
  AXIS_ALIGNED_POLICY,
  OCTILINEAR_POLICY,
  VentOverlapSummary,
  analyzeVentField,
  countVentOverlaps,
} from './engine';
export { ViewportTransform } from './viewport';
export {
  DEFAULT_MAX_TRACE_STEPS,
  FrameHotspotCollector,
  MAX_TRACE_HOTSPOTS,
  PolicyVentSolver,
  VentTraceFrame,
  createVentSolver,
  traceVentField,
  type VentTraceOptions,
} from './trace';
