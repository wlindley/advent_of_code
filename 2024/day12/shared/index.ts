export {
  DEFAULT_MAX_TRACE_STEPS,
  evaluateTotalFenceCost,
  GardenTraceFrame,
  traceGardenGroups,
  type GardenTraceFrameInit,
  type RegionFenceMetric,
} from './fence';
export { GardenMap, isValidPlant, parseGardenMap } from './map';
export { GardenRegion, partitionGarden, RegionPartition } from './regions';
export { createGardenGroupsSolver } from './solverFactory';
