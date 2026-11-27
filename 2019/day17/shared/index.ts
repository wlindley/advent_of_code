export { AsciiIoChannel, type AsciiDustOutput } from './asciiIo';
export {
  MAX_MAIN_CALLS,
  MAX_ROUTINE_CHARS,
  MAX_ROUTINE_TOKENS,
  RoutinePlan,
  compressPath,
  type RoutineName,
} from './routineCompressor';
export {
  DIRECTION_DELTAS,
  ScaffoldMap,
  turnBack,
  turnLeft,
  turnRight,
  type Direction,
  type GridPoint,
  type RobotPose,
  type ScaffoldCell,
} from './scaffoldMap';
export { traceScaffoldPath, type ScaffoldPath } from './scaffoldPath';
export {
  DEFAULT_MAX_VM_STEPS,
  DEFAULT_SCAFFOLD_LIMITS,
  captureScaffoldMap,
  runDustCollection,
  type DustCollectionResult,
  type ScaffoldExecutionLimits,
} from './scaffoldRunner';
export {
  ALIGNMENT_PARAMETERS_POLICY,
  DEFAULT_MAX_TRACE_STEPS,
  DUST_COLLECTION_POLICY,
  ScaffoldSolver,
  executeScaffold,
  traceScaffold,
  type ScaffoldPolicy,
  type ScaffoldTraceFrame,
  type ScaffoldTracePhase,
} from './scaffoldSolver';
export {
  CELL_SIZE,
  buildScaffoldSvgLayout,
  type RobotMarkerLayout,
  type ScaffoldSvgLayout,
} from './vizLayout';
