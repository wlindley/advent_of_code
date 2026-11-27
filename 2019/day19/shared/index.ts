export { BeamGrid, countAffectedSpans, type BeamPoint, type RowSpan } from './beamGrid';
export { DEFAULT_MAX_VM_STEPS, IntcodeBeamOracle, type BeamOracle } from './beamProbe';
export { scanBeamGrid, type BeamScanResult, type BeamScanStep } from './beamScan';
export {
  AREA_SCAN_POLICY,
  CLOSEST_SQUARE_POLICY,
  DEFAULT_MAX_TRACE_STEPS,
  EXAMPLE_BEAM_PROGRAM,
  PART1_GRID_SIZE,
  PART2_SQUARE_SIZE,
  TractorBeamSolver,
  type ScanTraceFrame,
  type SquareTraceFrame,
  type TractorBeamPolicy,
  type TractorBeamTraceFrame,
} from './beamSolver';
export {
  DEFAULT_SQUARE_LIMITS,
  SquarePlacement,
  findBeamAnchor,
  findClosestSquare,
  locateRowLeft,
  type BeamSquareResult,
  type SquareSearchLimits,
  type SquareSearchStep,
} from './beamSquare';
export {
  VIEWBOX_SIZE,
  buildTractorBeamSvgLayout,
  type ScanSvgLayout,
  type SquareSvgLayout,
  type SvgPoint,
  type SvgRect,
  type TractorBeamSvgLayout,
} from './vizLayout';
