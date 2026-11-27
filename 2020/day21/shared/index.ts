export {
  AllergenDocument,
  Food,
  parseAllergenDocument,
} from './model';
export {
  AllergenAnalysis,
  AllergenResolution,
  analyzeAllergens,
  PeelingRound,
  resolveAllergenMapping,
  type AllergenAssignment,
} from './analysis';
export {
  DEFAULT_MAX_TRACE_STEPS,
  IntersectionTraceFrame,
  PeelingTraceFrame,
  type AllergenTraceFrame,
  type IntersectionTraceFrameInit,
  type PeelingTraceFrameInit,
} from './traceFrames';
export {
  DANGEROUS_LIST_POLICY,
  SAFE_APPEARANCES_POLICY,
  type AllergenPolicy,
  type AllergenPolicyId,
} from './policies';
export { AllergenAssessmentSolver } from './solver';
export {
  MAX_INTERSECTION_BARS,
  projectIntersectionBars,
  projectPeelingMatrix,
  type AllergenCandidateSummary,
  type IntersectionBar,
  type IntersectionBarState,
  type IntersectionProjection,
  type PeelingCellState,
  type PeelingMatrixProjection,
  type PeelingMatrixRow,
} from './projection';
