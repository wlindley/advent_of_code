export {
  decodeTriple,
  drainPendingTriples,
  parseTileId,
  runArcade,
  toNonNegativeSafeInt,
  type ArcadeEvent,
  type ArcadeRunResult,
  type MutableArcadeState,
} from './arcadeExecution';
export { ArcadeIoChannel } from './arcadeIo';
export {
  ArcadeReport,
  DEFAULT_ARCADE_LIMITS,
  DEFAULT_MAX_INPUT_TURNS,
  DEFAULT_MAX_VM_STEPS,
  ScreenBounds,
  chooseJoystickTilt,
  computeScreenBounds,
  countBlocks,
  tileKey,
  validateArcadeLimits,
  type ArcadeExecutionLimits,
  type ArcadePolicy,
  type ArcadeTraceFrame,
  type GridPoint,
  type JoystickTilt,
  type ScreenTile,
  type TileId,
  type TracePhase,
} from './arcadeModels';
export {
  ArcadeSolver,
  BALL_TRAIL_LIMIT,
  BLOCK_COUNT_POLICY,
  DEFAULT_MAX_TRACE_STEPS,
  FREE_PLAY_SCORE_POLICY,
  executeArcade,
  replayEventsToFrames,
  traceArcade,
} from './arcadeSolver';
export {
  RAINBOW_BAND_COLORS,
  TILE_SIZE,
  buildArcadeSvgLayout,
  formatTiltLabel,
  type ArcadeSvgLayout,
} from './vizLayout';
