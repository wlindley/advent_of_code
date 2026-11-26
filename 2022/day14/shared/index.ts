export { CaveBounds, type CaveBoundaryPolicy } from './boundaryPolicy';
export { CavePoint, CaveScan, parseCaveScan, RockPath, SOURCE_X, SOURCE_Y } from './caveScan';
export { CELL_AIR, CELL_ROCK, ReservoirField, simulateReservoir } from './simulation';
export { createReservoirSolver } from './solverFactory';
export {
  buildReservoirTrace,
  DEFAULT_MAX_TRACE_STEPS,
  type ReservoirPhase,
  ReservoirTraceFrame,
} from './trace';
