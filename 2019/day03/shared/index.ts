export { findCrossings, pickBestCrossing } from './geometry';
export {
  MANHATTAN_METRIC,
  SIGNAL_DELAY_METRIC,
  type CrossingMetric,
} from './metric';
export { buildWireSegments, parseWireMoves, parseWirePair } from './parser';
export { createCrossedWiresSolver } from './solverFactory';
export {
  DEFAULT_MAX_TRACE_STEPS,
  computeWireBounds,
  projectPoint,
  traceCrossedWires,
  type WireTraceFrame,
} from './trace';
export {
  WireCrossing,
  WireSegment,
  absBigInt,
  maxBigInt,
  minBigInt,
  type Direction,
  type GridPoint,
  type Orientation,
  type ProjectedPoint,
  type Viewport,
  type WireBounds,
  type WireMove,
  type WirePair,
} from './types';
