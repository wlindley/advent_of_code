import { sampleTraceIndices, validateMaxSteps, type PuzzleSolver, type TraceOptions } from '../../../shared/core';
import {
  IntcodeMachine, parseIntcodeProgram, type CompleteParameterMode, type IntcodeProgram, type MachineStatus,
} from '../../shared/intcode';
import { decodeHullRegistration } from './bitmapFont';
import { RobotIoChannel } from './robotIo';
import {
  DEFAULT_MAX_ROBOT_STEPS, DEFAULT_MAX_VM_STEPS, PaintingReport, panelKey, stepPosition, turnHeading,
  validateRobotLimits, type GridPoint, type Heading, type HullTraceFrame, type PaintedPanel,
  type PaintingPolicy, type PanelColor, type RobotExecutionLimits, type TurnDirection,
} from './robotModels';

export const DEFAULT_MAX_TRACE_STEPS = 120;
const TRAIL_LIMIT = 32;
export const DEFAULT_ROBOT_LIMITS: RobotExecutionLimits = Object.freeze({
  maxVmSteps: DEFAULT_MAX_VM_STEPS, maxRobotSteps: DEFAULT_MAX_ROBOT_STEPS,
});

interface RobotPaintEvent {
  readonly x: number; readonly y: number; readonly color: PanelColor; readonly turn: TurnDirection;
  readonly nextX: number; readonly nextY: number; readonly nextHeading: Heading;
}

function parseBinarySignal(raw: bigint, label: string): 0 | 1 {
  if (raw !== 0n && raw !== 1n) throw new Error(`Invalid robot ${label} output ${raw}; expected 0 or 1`);
  return raw === 1n ? 1 : 0;
}

function readCameraColor(panels: ReadonlyMap<string, PaintedPanel>, x: number, y: number, startColor: PanelColor): PanelColor {
  const existing = panels.get(panelKey(x, y));
  if (existing !== undefined) return existing.color;
  return x === 0 && y === 0 ? startColor : 0;
}

function paintPanel(panels: Map<string, PaintedPanel>, x: number, y: number, color: PanelColor): void {
  const key = panelKey(x, y);
  panels.set(key, Object.freeze({ x, y, color, paintCount: (panels.get(key)?.paintCount ?? 0) + 1 }));
}

function advanceVm(
  machine: IntcodeMachine<CompleteParameterMode>, io: RobotIoChannel, input: bigint, maxVmSteps: number,
): { readonly status: MachineStatus; readonly outCount: number } {
  machine.pushInput(input);
  machine.run(maxVmSteps);
  return { status: machine.status, outCount: io.pendingOutputCount };
}

function consumeRobotStep(
  io: RobotIoChannel, panels: Map<string, PaintedPanel>, x: number, y: number, heading: Heading,
): RobotPaintEvent {
  const color = parseBinarySignal(io.takeOutput()!, 'color');
  const turn = parseBinarySignal(io.takeOutput()!, 'turn');
  paintPanel(panels, x, y, color);
  const nextHeading = turnHeading(heading, turn);
  const next = stepPosition(x, y, nextHeading);
  return { x, y, color, turn, nextX: next.x, nextY: next.y, nextHeading };
}

function runPaintingRobot(program: IntcodeProgram, startPanelColor: PanelColor, limits: RobotExecutionLimits) {
  const validated = validateRobotLimits(limits);
  const io = new RobotIoChannel();
  const machine = IntcodeMachine.fromCompleteProgram(program, { io });
  machine.run(validated.maxVmSteps);
  if (io.pendingOutputCount !== 0) throw new Error(`Robot produced ${io.pendingOutputCount} output(s) before initial camera read`);
  const panels = new Map<string, PaintedPanel>();
  const events: RobotPaintEvent[] = [];
  let x = 0, y = 0, heading: Heading = 0;

  while (machine.status === 'waiting-input') {
    const turnResult = advanceVm(machine, io, BigInt(readCameraColor(panels, x, y, startPanelColor)), validated.maxVmSteps);
    if (turnResult.status === 'halted' && turnResult.outCount === 0) break;
    if (turnResult.outCount !== 2) throw new Error(`Expected 2 robot outputs per step, got ${turnResult.outCount}`);
    if (events.length >= validated.maxRobotSteps) throw new RangeError(`Robot exceeded step limit of ${validated.maxRobotSteps}`);
    const ev = consumeRobotStep(io, panels, x, y, heading);
    events.push(ev);
    x = ev.nextX; y = ev.nextY; heading = ev.nextHeading;
  }
  return { report: new PaintingReport(startPanelColor, panels, { x, y }, heading, events.length, machine.stepCount), events };
}

function buildTraceFrames(events: readonly RobotPaintEvent[], startPanelColor: PanelColor, maxSteps: number): readonly HullTraceFrame[] {
  const sampled = sampleTraceIndices(events.length + 1, maxSteps);
  const frames: HullTraceFrame[] = [];
  const panels = new Map<string, PaintedPanel>();
  const trail: GridPoint[] = [Object.freeze({ x: 0, y: 0 })];
  let cursor = 0, x = 0, y = 0, heading: Heading = 0;

  if (sampled[cursor] === 0) {
    frames.push(Object.freeze({
      stepIndex: 0, totalSteps: events.length, robotX: x, robotY: y, heading,
      lastPaintColor: null, lastTurn: null, startPanelColor, panels: new Map(panels), trail: Object.freeze([...trail]),
    }));
    cursor += 1;
  }
  for (let i = 0; i < events.length; i += 1) {
    const ev = events[i]!;
    paintPanel(panels, ev.x, ev.y, ev.color);
    x = ev.nextX; y = ev.nextY; heading = ev.nextHeading;
    trail.push(Object.freeze({ x, y }));
    if (sampled[cursor] === i + 1) {
      frames.push(Object.freeze({
        stepIndex: i + 1, totalSteps: events.length, robotX: x, robotY: y, heading,
        lastPaintColor: ev.color, lastTurn: ev.turn, startPanelColor,
        panels: new Map(panels), trail: Object.freeze(trail.slice(-TRAIL_LIMIT)),
      }));
      cursor += 1;
    }
  }
  return Object.freeze(frames);
}

/** Runs the hull-painting robot and returns the final report. */
export function executePaintingRobot(program: IntcodeProgram, startPanelColor: PanelColor, limits?: RobotExecutionLimits): PaintingReport {
  return runPaintingRobot(program, startPanelColor, limits ?? DEFAULT_ROBOT_LIMITS).report;
}

/** Runs the robot and returns up to `maxSteps` uniformly sampled visualization frames. */
export function tracePaintingRobot(
  program: IntcodeProgram, startPanelColor: PanelColor, maxSteps?: number, limits?: RobotExecutionLimits,
): readonly HullTraceFrame[] {
  const limit = validateMaxSteps(maxSteps, DEFAULT_MAX_TRACE_STEPS);
  return buildTraceFrames(runPaintingRobot(program, startPanelColor, limits ?? DEFAULT_ROBOT_LIMITS).events, startPanelColor, limit);
}

export const PAINTED_COUNT_POLICY: PaintingPolicy<number> = Object.freeze({
  id: 'part1', label: 'Painted Panels', startPanelColor: 0, showRegistrationBanner: false,
  extractAnswer: (report: PaintingReport) => report.paintedCount,
});

export const REGISTRATION_ID_POLICY: PaintingPolicy<string> = Object.freeze({
  id: 'part2', label: 'Registration ID', startPanelColor: 1, showRegistrationBanner: true,
  extractAnswer: (report: PaintingReport) => decodeHullRegistration(report.whitePanels),
});

/** Reusable PuzzleSolver parameterized by Part 1 / Part 2 PaintingPolicy. */
export class PaintingRobotSolver<TAnswer> implements Required<PuzzleSolver<IntcodeProgram, TAnswer, HullTraceFrame>> {
  readonly policy: PaintingPolicy<TAnswer>;
  constructor(policy: PaintingPolicy<TAnswer>) { this.policy = policy; }
  parse(raw: string): IntcodeProgram { return parseIntcodeProgram(raw); }
  solve(input: IntcodeProgram): TAnswer { return this.policy.extractAnswer(executePaintingRobot(input, this.policy.startPanelColor)); }
  trace(input: IntcodeProgram, options?: TraceOptions): readonly HullTraceFrame[] {
    return tracePaintingRobot(input, this.policy.startPanelColor, options?.maxSteps);
  }
}
