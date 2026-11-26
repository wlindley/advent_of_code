export {
  MAX_PROFILE_POINTS,
  PROFILE_VIEWBOX,
  buildComparisonOverlay,
  buildProfileGeometry,
  projectDepthPoint,
  type ComparisonOverlay,
  type ProfileGeometry,
  type ProfilePoint,
  type WindowHighlightBand,
} from './profileGeometry';
export { SonarReport, parseSonarReport, validateWindowSize } from './sonarReport';
export {
  DEFAULT_MAX_TRACE_STEPS,
  classifyDelta,
  countWindowIncreases,
  traceWindowIncreases,
  type SweepDeltaKind,
  type SweepTraceFrame,
} from './windowSweep';
