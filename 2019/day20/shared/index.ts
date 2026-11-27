export {
  buildPortalGraph,
  reconstructCorridorPath,
  type PortalEdge,
  type PortalGraph,
} from './graph';
export {
  DonutMaze,
  parseDonutMaze,
  type GridPoint,
  type PortalNode,
  type PortalSide,
} from './maze';
export {
  FLAT_DONUT_POLICY,
  RECURSIVE_DONUT_POLICY,
  type DonutPolicy,
  type DonutPolicyId,
} from './policy';
export {
  solveDonutMaze,
  type DonutSolution,
  type PortalHop,
} from './search';
export {
  DEFAULT_MAX_TRACE_STEPS,
  DonutSolver,
  type DonutPathStep,
  type DonutTraceFrame,
} from './solver';
export {
  computeDepthStats,
  computeDonutRenderMetrics,
  formatDonutStatus,
  type DonutDepthStats,
  type DonutRenderMetrics,
} from './vizLayout';
