export {
  DEFAULT_REDOUBT_SPACE,
  EXAMPLE_REDOUBT_SPACE,
  Robot,
  TorusSpace,
  assertNonNegativeSafeInt,
  stepCoordinate,
  type GridPoint,
  type Quadrant,
  type QuadrantCounts,
} from './model';
export { parseRobots } from './parser';
export {
  countAdjacentOccupied,
  countOccupancyQuadrants,
  countQuadrants,
  evaluateSafetyFactor,
  fillOccupancy,
  safetyFactorOf,
} from './simulation';
export {
  RedoubtSnapshot,
  buildRedoubtSnapshot,
  type RedoubtSnapshotInit,
  type SnapshotOptions,
} from './snapshot';
