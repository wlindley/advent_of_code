export {
  type DigDirection,
  type DigPlanDecoder,
  DigStep,
  DIRECT_DIG_PLAN_DECODER,
  DIRECTION_DELTAS,
  type DirectionDelta,
  parseDigPlan,
  RawDigEntry,
} from './digPlan';
export {
  LagoonBounds,
  LagoonEdge,
  type LagoonPoint,
  LagoonPolygon,
  type PolygonOrientation,
} from './lagoonPolygon';
export { createLagoonSolver } from './lagoonSolver';
export {
  buildLagoonTrace,
  DEFAULT_MAX_TRACE_STEPS,
  LagoonTraceFrame,
  type ProjectedPolygon,
  projectPolygonToSvg,
  type SvgPoint,
  type SvgViewport,
} from './lagoonTrace';
