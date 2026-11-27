export {
  CANONICAL_GLYPHS,
  GLYPH_HEIGHT,
  GLYPH_WIDTH,
  decodeHullRegistration,
  tryDecodeHullRegistration,
  type GlyphDefinition,
} from './bitmapFont';
export { RobotIoChannel } from './robotIo';
export {
  DEFAULT_MAX_ROBOT_STEPS,
  DEFAULT_MAX_VM_STEPS,
  HEADING_DELTAS,
  HullBounds,
  PaintingReport,
  panelKey,
  stepPosition,
  turnHeading,
  validateRobotLimits,
  type GridPoint,
  type Heading,
  type HullTraceFrame,
  type PaintedPanel,
  type PaintingPolicy,
  type PanelColor,
  type RobotExecutionLimits,
  type TurnDirection,
} from './robotModels';
export {
  DEFAULT_MAX_TRACE_STEPS,
  DEFAULT_ROBOT_LIMITS,
  PAINTED_COUNT_POLICY,
  PaintingRobotSolver,
  REGISTRATION_ID_POLICY,
  executePaintingRobot,
  tracePaintingRobot,
} from './robotRunner';
export {
  CELL_SIZE,
  buildHullSvgLayout,
  formatHeadingLabel,
  formatRobotPolygon,
  type HullSvgLayout,
} from './vizLayout';
