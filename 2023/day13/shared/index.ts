export { MirrorPattern, parseMirrorPatterns, type TerrainCell } from './pattern';
export {
  findReflection,
  ReflectionMatch,
  summarizePatterns,
  validateTargetSmudges,
  type GridCoord,
  type ReflectionOrientation,
  type SmudgePair,
} from './reflection';
export { createIncidenceSolver } from './solverFactory';
export {
  buildIncidenceTrace,
  DEFAULT_MAX_TRACE_STEPS,
  type IncidenceTraceFrame,
} from './trace';
