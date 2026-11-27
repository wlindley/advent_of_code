export { simulateCrabCups, simulateCrabCupsTrace } from './engine';
export { CupRingSpec, MIN_CUP_COUNT, parseCupLabels } from './model';
export {
  MILLION_CUP_COUNT,
  MILLION_CUPS_POLICY,
  MILLION_MOVES,
  STANDARD_CUPS_POLICY,
  STANDARD_MOVES,
  type CrabCupsPolicy,
  type CrabCupsPolicyId,
} from './policies';
export {
  projectCrabCups,
  RING_CX,
  RING_CY,
  RING_R,
  SVG_HEIGHT,
  SVG_WIDTH,
  type CrabCupsProjection,
  type CupRole,
  type RibbonChipProjection,
  type RingNodeProjection,
  type SpliceArcProjection,
} from './projection';
export { CupRing, type CupMoveRecord } from './ring';
export { CrabCupsSolver } from './solver';
export {
  captureTraceFrame,
  CrabCupsTraceFrame,
  DEFAULT_MAX_TRACE_STEPS,
  FULL_RING_MAX_CUPS,
  LOCAL_WINDOW_CUPS,
  type CrabCupsTraceFrameInit,
} from './trace';
