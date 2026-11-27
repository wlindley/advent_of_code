import {
  sampleTraceIndices,
  validateMaxSteps,
  type PuzzleSolver,
  type TraceOptions,
} from '../../../shared/core';
import { parseIntcodeProgram, type IntcodeProgram } from '../../shared/intcode';
import { compressPath, type RoutinePlan } from './routineCompressor';
import type { Direction, GridPoint, RobotPose, ScaffoldMap } from './scaffoldMap';
import { traceScaffoldPath } from './scaffoldPath';
import {
  DEFAULT_SCAFFOLD_LIMITS,
  captureScaffoldMap,
  runDustCollection,
  type ScaffoldExecutionLimits,
} from './scaffoldRunner';

/** Default maximum trace frames emitted for visualization playback. */
export const DEFAULT_MAX_TRACE_STEPS = 120;

/** Visualization phase for Day 17 scaffold tracing. */
export type ScaffoldTracePhase = 'scan' | 'sweep';

/** Single immutable trace frame for Day 17 Parts 1 and 2. */
export interface ScaffoldTraceFrame {
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly phase: ScaffoldTracePhase;
  readonly map: ScaffoldMap;
  readonly revealedRows: number;
  readonly robot: RobotPose | null;
  readonly sweptPath: readonly GridPoint[];
  readonly plan: RoutinePlan | null;
  readonly dust: bigint | null;
}

/** Strategy policy parameterizing Part 1 (alignment sum) vs Part 2 (dust sweep). */
export interface ScaffoldPolicy {
  readonly id: 'part1' | 'part2';
  readonly label: string;
  readonly solve: (program: IntcodeProgram, limits: ScaffoldExecutionLimits) => bigint;
  readonly buildFrames: (
    program: IntcodeProgram,
    limit: number,
    limits: ScaffoldExecutionLimits,
  ) => readonly ScaffoldTraceFrame[];
  readonly formatFrameAnswer: (frame: ScaffoldTraceFrame) => string;
}

const EMPTY_PATH: readonly GridPoint[] = Object.freeze([]);
const DELTA_TO_DIR = new Map<string, Direction>([
  ['0,-1', 'U'],
  ['1,0', 'R'],
  ['0,1', 'D'],
  ['-1,0', 'L'],
]);

function poseAtWaypoint(waypoints: readonly GridPoint[], index: number, startPose: RobotPose): RobotPose {
  if (index === 0) return startPose;
  const prev = waypoints[index - 1]!;
  const curr = waypoints[index]!;
  const direction = DELTA_TO_DIR.get(`${curr.x - prev.x},${curr.y - prev.y}`)!;
  return Object.freeze({ x: curr.x, y: curr.y, direction });
}

function visibleRobotDuringScan(map: ScaffoldMap, revealedRows: number): RobotPose | null {
  const robot = map.robot;
  return robot !== null && revealedRows > robot.y ? robot : null;
}

function createFrame(
  stepIndex: number,
  totalSteps: number,
  phase: ScaffoldTracePhase,
  map: ScaffoldMap,
  revealedRows: number,
  robot: RobotPose | null,
  sweptPath: readonly GridPoint[],
  plan: RoutinePlan | null,
  dust: bigint | null,
): ScaffoldTraceFrame {
  return Object.freeze({ stepIndex, totalSteps, phase, map, revealedRows, robot, sweptPath, plan, dust });
}

function buildScanFrames(map: ScaffoldMap, limit: number): readonly ScaffoldTraceFrame[] {
  const frames = sampleTraceIndices(map.height, limit).map((rowIndex) => {
    const rows = rowIndex + 1;
    return createFrame(rows, map.height, 'scan', map, rows, visibleRobotDuringScan(map, rows), EMPTY_PATH, null, null);
  });
  return Object.freeze(frames);
}

function buildSweepFrames(
  program: IntcodeProgram,
  limit: number,
  limits: ScaffoldExecutionLimits,
): readonly ScaffoldTraceFrame[] {
  const map = captureScaffoldMap(program, limits.maxVmSteps);
  const path = traceScaffoldPath(map);
  const plan = compressPath(path.tokens);
  const { dust } = runDustCollection(program, plan, limits.maxVmSteps);
  const totalSteps = path.waypoints.length;
  const sweepIndices = sampleTraceIndices(totalSteps, limit === 1 ? 1 : limit - 1);
  const frames: ScaffoldTraceFrame[] = [];

  if (limit > 1) {
    frames.push(createFrame(0, totalSteps, 'scan', map, map.height, map.robot, EMPTY_PATH, plan, null));
  }
  for (const idx of sweepIndices) {
    const swept = Object.freeze(path.waypoints.slice(0, idx + 1));
    const frameDust = idx === totalSteps - 1 ? dust : null;
    frames.push(
      createFrame(idx + 1, totalSteps, 'sweep', map, map.height, poseAtWaypoint(path.waypoints, idx, path.start), swept, plan, frameDust),
    );
  }
  return Object.freeze(frames);
}

/** Part 1 policy: scan the scaffold grid and sum intersection alignment parameters. */
export const ALIGNMENT_PARAMETERS_POLICY: ScaffoldPolicy = Object.freeze({
  id: 'part1',
  label: 'Alignment Sum',
  solve: (program: IntcodeProgram, limits: ScaffoldExecutionLimits) =>
    captureScaffoldMap(program, limits.maxVmSteps).alignmentParameterSum,
  buildFrames: (program: IntcodeProgram, limit: number, limits: ScaffoldExecutionLimits) =>
    buildScanFrames(captureScaffoldMap(program, limits.maxVmSteps), limit),
  formatFrameAnswer: (frame: ScaffoldTraceFrame) =>
    frame.revealedRows === frame.map.height ? String(frame.map.alignmentParameterSum) : 'Pending',
});

/** Part 2 policy: trace, compress into A/B/C routines, and collect vacuum dust. */
export const DUST_COLLECTION_POLICY: ScaffoldPolicy = Object.freeze({
  id: 'part2',
  label: 'Dust Collected',
  solve: (program: IntcodeProgram, limits: ScaffoldExecutionLimits) => {
    const map = captureScaffoldMap(program, limits.maxVmSteps);
    const plan = compressPath(traceScaffoldPath(map).tokens);
    return runDustCollection(program, plan, limits.maxVmSteps).dust;
  },
  buildFrames: buildSweepFrames,
  formatFrameAnswer: (frame: ScaffoldTraceFrame) =>
    frame.dust !== null ? String(frame.dust) : 'Pending',
});

/** Executes a Day 17 solver policy on a parsed Intcode program. */
export function executeScaffold(
  program: IntcodeProgram,
  policy: ScaffoldPolicy,
  limits?: ScaffoldExecutionLimits,
): bigint {
  return policy.solve(program, limits ?? DEFAULT_SCAFFOLD_LIMITS);
}

/** Traces a Day 17 solver policy into bounded visualization frames. */
export function traceScaffold(
  program: IntcodeProgram,
  policy: ScaffoldPolicy,
  maxSteps?: number,
  limits?: ScaffoldExecutionLimits,
): readonly ScaffoldTraceFrame[] {
  const limit = validateMaxSteps(maxSteps, DEFAULT_MAX_TRACE_STEPS);
  return policy.buildFrames(program, limit, limits ?? DEFAULT_SCAFFOLD_LIMITS);
}

/** Reusable PuzzleSolver parameterized by Part 1 / Part 2 ScaffoldPolicy. */
export class ScaffoldSolver implements Required<PuzzleSolver<IntcodeProgram, bigint, ScaffoldTraceFrame>> {
  readonly policy: ScaffoldPolicy;
  private readonly limits: ScaffoldExecutionLimits;

  constructor(policy: ScaffoldPolicy, limits?: ScaffoldExecutionLimits) {
    this.policy = policy;
    this.limits = limits ?? DEFAULT_SCAFFOLD_LIMITS;
    Object.freeze(this);
  }

  parse(raw: string): IntcodeProgram {
    return parseIntcodeProgram(raw);
  }

  solve(program: IntcodeProgram): bigint {
    return executeScaffold(program, this.policy, this.limits);
  }

  trace(program: IntcodeProgram, options?: TraceOptions): readonly ScaffoldTraceFrame[] {
    return traceScaffold(program, this.policy, options?.maxSteps, this.limits);
  }
}
