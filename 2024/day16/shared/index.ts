export { analyzeReindeerMaze, MazeAnalysis } from './dijkstra';
export { StateMinHeap } from './minHeap';
export { parseReindeerMaze } from './parse';
export { createReindeerMazeSolver, type MazeObjective } from './solver';
export {
  buildMazeTrace,
  DEFAULT_MAX_TRACE_STEPS,
  type MazeTraceContext,
  type MazeTraceFrame,
  type TracePhase,
} from './trace';
export {
  DIR_DELTAS, DIR_EAST, DIR_NORTH, DIR_SOUTH, DIR_WEST,
  type DirDelta, type Direction, oppositeDir, type PathStep,
  ReindeerMaze, STEP_COST, TURN_COST, turnCcw, turnCw,
} from './types';
