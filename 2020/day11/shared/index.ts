export {
  parseSeatingLayout,
  SeatingLayout,
  type CellState,
  type SeatCoord,
} from './layout';
export {
  ADJACENT_SEATING_RULE,
  buildSeatGraph,
  LINE_OF_SIGHT_SEATING_RULE,
  SeatGraph,
  type SeatingRule,
  type SeatingRuleId,
} from './rules';
export {
  simulateSeating,
  simulateSeatingWithGraph,
  SimulationResult,
} from './simulation';
export {
  DEFAULT_MAX_TRACE_STEPS,
  diffSeatStates,
  SeatingTraceFrame,
  traceSeating,
  type SeatVisualState,
} from './trace';
export { SeatingSystemSolver } from './solver';
