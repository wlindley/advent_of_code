export { SpringdroidAsciiIo, type SpringdroidOutput } from './asciiIo';
export {
  DEMO_RUN_HULLS,
  DEMO_WALK_HULLS,
  EXAMPLE_RUN_ANSWER,
  EXAMPLE_SPRINGDROID_PROGRAM,
  EXAMPLE_WALK_ANSWER,
} from './exampleProgram';
export {
  JUMP_DISTANCE,
  readSensorWindow,
  simulateHullCrossing,
  type HullSimulationResult,
  type HullTick,
} from './hullSimulator';
export {
  DEFAULT_MAX_VM_STEPS,
  extractHullDamage,
  runSpringdroidProgram,
  type SpringdroidRunResult,
} from './springdroidRunner';
export {
  DEFAULT_MAX_TRACE_STEPS,
  RUN_POLICY,
  SpringdroidSolver,
  WALK_POLICY,
  type SpringdroidPolicy,
  type SpringdroidTraceFrame,
} from './springdroidSolver';
export {
  MAX_SPRINGSCRIPT_INSTRUCTIONS,
  SENSOR_ORDER,
  SpringscriptProgram,
  formatSpringscriptInstruction,
  type ExtendedSensorRegister,
  type ReadableRegister,
  type SensorRegister,
  type SensorWindow,
  type SpringdroidMode,
  type SpringscriptEvaluation,
  type SpringscriptInstruction,
  type SpringscriptOp,
  type SpringscriptStep,
  type WalkSensorRegister,
  type WritableRegister,
} from './springscript';
export {
  SVG_HEIGHT,
  SVG_PADDING,
  TILE_GAP,
  TILE_SIZE,
  buildSpringdroidSvgLayout,
  type HullTileLayout,
  type SensorPinLayout,
  type SpringdroidSvgLayout,
} from './vizLayout';
