export { Hailstone, parseHailstones, TestArea, Vec3 } from './hailstone';
export {
  classifyPair2D,
  countFutureIntersections2D,
  type CrossingPairIntersection,
  type IntersectionKind,
  IntersectionSummary,
  type PairIntersection,
  type ParallelPairIntersection,
  summarizeIntersections2D,
} from './intersection2d';
export { RationalLinearSystem } from './linearSolver';
export { type HailstoneCollision, RockTrajectory, solveRockTrajectory } from './rockTrajectory';
export {
  buildHailTrace2D,
  type ClippedRaySegment,
  clipRayToViewport,
  DEFAULT_MAX_TRACE_STEPS,
  type HailTrace2DFrame,
  MAX_VISIBLE_DOTS,
  type VisibleIntersectionDot,
} from './hailTrace2d';
export { buildRockTrace, DEFAULT_ROCK_TRACE_STEPS, type RockTraceFrame } from './rockTrace';
