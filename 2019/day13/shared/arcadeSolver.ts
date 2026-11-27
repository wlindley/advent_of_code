import {
  sampleTraceIndices,
  validateMaxSteps,
  type PuzzleSolver,
  type TraceOptions,
} from '../../../shared/core';
import { parseIntcodeProgram, type IntcodeProgram } from '../../shared/intcode';
import { runArcade, type ArcadeEvent, type ArcadeRunResult } from './arcadeExecution';
import {
  DEFAULT_ARCADE_LIMITS,
  ArcadeReport,
  countBlocks,
  tileKey,
  type ArcadeExecutionLimits,
  type ArcadePolicy,
  type ArcadeTraceFrame,
  type GridPoint,
  type JoystickTilt,
  type ScreenTile,
  type TracePhase,
} from './arcadeModels';

export const DEFAULT_MAX_TRACE_STEPS = 120;
export const BALL_TRAIL_LIMIT = 18;

interface ReplayState {
  readonly tiles: Map<string, ScreenTile>;
  score: number;
  paddleX: number | null;
  ballX: number | null;
  ballY: number | null;
  readonly ballTrail: GridPoint[];
}

interface FrameMeta {
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly phase: TracePhase;
  readonly lastTilt: JoystickTilt | null;
  readonly inputTurn: number;
  readonly totalInputTurns: number;
}

function createReplayState(): ReplayState {
  return { tiles: new Map(), score: 0, paddleX: null, ballX: null, ballY: null, ballTrail: [] };
}

function applyReplayEvent(state: ReplayState, event: ArcadeEvent): void {
  if (event.kind === 'score') {
    state.score = event.score;
    return;
  }
  state.tiles.set(tileKey(event.x, event.y), Object.freeze({ x: event.x, y: event.y, id: event.tileId }));
  if (event.tileId === 3) {
    state.paddleX = event.x;
  } else if (event.tileId === 4) {
    state.ballX = event.x;
    state.ballY = event.y;
    state.ballTrail.push(Object.freeze({ x: event.x, y: event.y }));
  }
}

function snapshotFrame(state: ReplayState, meta: FrameMeta): ArcadeTraceFrame {
  return Object.freeze({
    ...meta,
    tiles: new Map(state.tiles),
    score: state.score,
    paddleX: state.paddleX,
    ballX: state.ballX,
    ballY: state.ballY,
    ballTrail: Object.freeze(state.ballTrail.slice(-BALL_TRAIL_LIMIT)),
  });
}

function replayDrawPhase(events: readonly ArcadeEvent[], maxSteps: number): readonly ArcadeTraceFrame[] {
  const sampled = sampleTraceIndices(events.length + 1, maxSteps);
  const state = createReplayState();
  const frames: ArcadeTraceFrame[] = [];
  let cursor = 0;

  if (sampled[cursor] === 0) {
    frames.push(snapshotFrame(state, {
      stepIndex: 0, totalSteps: events.length, phase: 'draw', lastTilt: null, inputTurn: 0, totalInputTurns: 0,
    }));
    cursor += 1;
  }
  for (let i = 0; i < events.length; i += 1) {
    applyReplayEvent(state, events[i]!);
    if (sampled[cursor] === i + 1) {
      frames.push(snapshotFrame(state, {
        stepIndex: i + 1, totalSteps: events.length, phase: 'draw', lastTilt: null, inputTurn: 0, totalInputTurns: 0,
      }));
      cursor += 1;
    }
  }
  return Object.freeze(frames);
}

function replayPlayPhase(runResult: ArcadeRunResult, maxSteps: number): readonly ArcadeTraceFrame[] {
  const { events, turnEndOffsets, turnTilts } = runResult;
  const sampled = sampleTraceIndices(turnEndOffsets.length, maxSteps);
  const state = createReplayState();
  const frames: ArcadeTraceFrame[] = [];
  let cursor = 0;
  let evIndex = 0;

  for (let t = 0; t < turnEndOffsets.length; t += 1) {
    const endOffset = turnEndOffsets[t]!;
    while (evIndex < endOffset) {
      applyReplayEvent(state, events[evIndex]!);
      evIndex += 1;
    }
    if (sampled[cursor] === t) {
      frames.push(snapshotFrame(state, {
        stepIndex: t,
        totalSteps: turnEndOffsets.length - 1,
        phase: 'play',
        lastTilt: t === 0 ? null : turnTilts[t - 1]!,
        inputTurn: t,
        totalInputTurns: turnTilts.length,
      }));
      cursor += 1;
    }
  }
  return Object.freeze(frames);
}

export function replayEventsToFrames(runResult: ArcadeRunResult, maxSteps: number): readonly ArcadeTraceFrame[] {
  return runResult.turnEndOffsets.length <= 1
    ? replayDrawPhase(runResult.events, maxSteps)
    : replayPlayPhase(runResult, maxSteps);
}

/** Runs an arcade Intcode program under the given policy and returns the final report. */
export function executeArcade<TAnswer>(
  program: IntcodeProgram,
  policy: ArcadePolicy<TAnswer>,
  limits?: ArcadeExecutionLimits,
): ArcadeReport {
  return runArcade(program, policy.memoryPatch, limits ?? DEFAULT_ARCADE_LIMITS, false).report;
}

/** Runs an arcade Intcode program and returns uniformly sampled visualization frames. */
export function traceArcade<TAnswer>(
  program: IntcodeProgram,
  policy: ArcadePolicy<TAnswer>,
  maxSteps?: number,
  limits?: ArcadeExecutionLimits,
): readonly ArcadeTraceFrame[] {
  const limit = validateMaxSteps(maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const runResult = runArcade(program, policy.memoryPatch, limits ?? DEFAULT_ARCADE_LIMITS, true);
  return replayEventsToFrames(runResult, limit);
}

export const BLOCK_COUNT_POLICY: ArcadePolicy<number> = Object.freeze({
  id: 'part1',
  label: 'Block Tiles',
  memoryPatch: null,
  showScoreBanner: false,
  extractAnswer: (report: ArcadeReport) => report.blockCount,
  formatFrameAnswer: (frame: ArcadeTraceFrame) => String(countBlocks(frame.tiles)),
});

export const FREE_PLAY_SCORE_POLICY: ArcadePolicy<number> = Object.freeze({
  id: 'part2',
  label: 'Free Play Score',
  memoryPatch: Object.freeze({ address: 0n, value: 2n }),
  showScoreBanner: true,
  extractAnswer: (report: ArcadeReport) => report.score,
  formatFrameAnswer: (frame: ArcadeTraceFrame) => String(frame.score),
});

/** Reusable PuzzleSolver parameterized by Part 1 / Part 2 ArcadePolicy. */
export class ArcadeSolver<TAnswer> implements Required<PuzzleSolver<IntcodeProgram, TAnswer, ArcadeTraceFrame>> {
  readonly policy: ArcadePolicy<TAnswer>;

  constructor(policy: ArcadePolicy<TAnswer>) {
    this.policy = policy;
  }

  parse(raw: string): IntcodeProgram {
    return parseIntcodeProgram(raw);
  }

  solve(input: IntcodeProgram): TAnswer {
    return this.policy.extractAnswer(executeArcade(input, this.policy));
  }

  trace(input: IntcodeProgram, options?: TraceOptions): readonly ArcadeTraceFrame[] {
    return traceArcade(input, this.policy, options?.maxSteps);
  }
}
