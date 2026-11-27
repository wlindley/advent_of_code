import { sampleTraceIndices, validateMaxSteps, type PuzzleSolver, type TraceOptions } from '../../../shared/core';
import { parseIntcodeProgram, type IntcodeProgram } from '../../shared/intcode';
import type { BeamPoint, RowSpan } from './beamGrid';
import { IntcodeBeamOracle, type BeamOracle } from './beamProbe';
import { scanBeamGrid } from './beamScan';
import { DEFAULT_SQUARE_LIMITS, SquarePlacement, findClosestSquare } from './beamSquare';

export const EXAMPLE_BEAM_PROGRAM =
  '3,59,3,60,107,-1,59,61,107,-1,60,62,102,6,60,63,102,7,59,64,1001,64,1,64,7,63,64,63,102,3,59,64,102,5,60,65,1001,65,1,65,7,64,65,64,2,61,62,61,2,61,63,61,2,61,64,61,4,61,99';

export const DEFAULT_MAX_TRACE_STEPS = 120;
export const PART1_GRID_SIZE = 50;
export const PART2_SQUARE_SIZE = 100;

/** Trace frame emitted during Part 1 50x50 grid area scanning. */
export interface ScanTraceFrame {
  readonly kind: 'scan';
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly gridSize: number;
  readonly activeY: number;
  readonly spans: readonly (RowSpan | null)[];
  readonly affectedCount: number;
  readonly probeCount: number;
}

/** Trace frame emitted during Part 2 100x100 closest-square search. */
export interface SquareTraceFrame {
  readonly kind: 'square';
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly squareSize: number;
  readonly anchor: BeamPoint;
  readonly leftEdge: readonly BeamPoint[];
  readonly candidate: SquarePlacement | null;
  readonly probePoint: BeamPoint;
  readonly fits: boolean;
  readonly phase: 'jump' | 'walk' | 'found';
  readonly probeCount: number;
}

export type TractorBeamTraceFrame = ScanTraceFrame | SquareTraceFrame;

/** Strategy interface decoupling Part 1 area scanning from Part 2 closest-square search. */
export interface TractorBeamPolicy {
  readonly id: 'area-scan' | 'closest-square';
  readonly label: string;
  solve(oracle: BeamOracle): number;
  trace(oracle: BeamOracle, maxSteps: number): readonly TractorBeamTraceFrame[];
  formatFrameAnswer(frame: TractorBeamTraceFrame): string;
}

function formatBeamFrameAnswer(frame: TractorBeamTraceFrame): string {
  if (frame.kind === 'scan') {
    return String(frame.affectedCount);
  }
  return frame.candidate !== null ? String(frame.candidate.answerCode) : '—';
}

function traceAreaScan(oracle: BeamOracle, maxSteps: number): readonly ScanTraceFrame[] {
  const result = scanBeamGrid(oracle, PART1_GRID_SIZE);
  const allSpans = result.grid.spans();
  const indices = sampleTraceIndices(result.steps.length, maxSteps);
  const frames = indices.map((idx): ScanTraceFrame => {
    const step = result.steps[idx]!;
    return Object.freeze({
      kind: 'scan',
      stepIndex: idx + 1,
      totalSteps: result.steps.length,
      gridSize: PART1_GRID_SIZE,
      activeY: step.y,
      spans: Object.freeze(allSpans.slice(0, step.y + 1)),
      affectedCount: step.affectedSoFar,
      probeCount: step.probeCount,
    });
  });
  return Object.freeze(frames);
}

function traceClosestSquare(oracle: BeamOracle, maxSteps: number): readonly SquareTraceFrame[] {
  const result = findClosestSquare(oracle, PART2_SQUARE_SIZE, DEFAULT_SQUARE_LIMITS);
  const indices = sampleTraceIndices(result.steps.length, maxSteps);
  const frames = indices.map((idx): SquareTraceFrame => {
    const step = result.steps[idx]!;
    const leftEdge = Object.freeze(result.leftEdge.filter((pt) => pt.y <= step.y));
    const candidate = step.topRightY >= 0 ? new SquarePlacement(step.left, step.topRightY, PART2_SQUARE_SIZE) : null;
    const probePoint = Object.freeze({ x: step.topRightX, y: Math.max(0, step.topRightY) });
    return Object.freeze({
      kind: 'square',
      stepIndex: idx + 1,
      totalSteps: result.steps.length,
      squareSize: PART2_SQUARE_SIZE,
      anchor: result.anchor,
      leftEdge,
      candidate,
      probePoint,
      fits: step.fits,
      phase: step.phase,
      probeCount: step.probeCount,
    });
  });
  return Object.freeze(frames);
}

export const AREA_SCAN_POLICY: TractorBeamPolicy = Object.freeze({
  id: 'area-scan',
  label: '50×50 Area Scan',
  solve: (oracle: BeamOracle) => scanBeamGrid(oracle, PART1_GRID_SIZE).grid.affectedCount,
  trace: traceAreaScan,
  formatFrameAnswer: formatBeamFrameAnswer,
});

export const CLOSEST_SQUARE_POLICY: TractorBeamPolicy = Object.freeze({
  id: 'closest-square',
  label: '100×100 Closest Square',
  solve: (oracle: BeamOracle) => findClosestSquare(oracle, PART2_SQUARE_SIZE, DEFAULT_SQUARE_LIMITS).placement.answerCode,
  trace: traceClosestSquare,
  formatFrameAnswer: formatBeamFrameAnswer,
});

/** Policy-parameterized Intcode tractor beam solver shared by Day 19 Parts 1 and 2. */
export class TractorBeamSolver implements PuzzleSolver<IntcodeProgram, number, TractorBeamTraceFrame> {
  readonly policy: TractorBeamPolicy;

  constructor(policy: TractorBeamPolicy) {
    this.policy = policy;
    Object.freeze(this);
  }

  parse(raw: string): IntcodeProgram {
    return parseIntcodeProgram(raw);
  }

  solve(program: IntcodeProgram): number {
    return this.policy.solve(new IntcodeBeamOracle(program));
  }

  trace(program: IntcodeProgram, options?: TraceOptions): readonly TractorBeamTraceFrame[] {
    const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
    return this.policy.trace(new IntcodeBeamOracle(program), maxSteps);
  }
}
