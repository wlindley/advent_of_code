import {
  IntcodeMachine,
  type CompleteParameterMode,
  type IntcodeProgram,
  type MemoryPatch,
} from '../../shared/intcode';
import { ArcadeIoChannel } from './arcadeIo';
import {
  ArcadeReport,
  chooseJoystickTilt,
  tileKey,
  validateArcadeLimits,
  type ArcadeExecutionLimits,
  type JoystickTilt,
  type ScreenTile,
  type TileId,
} from './arcadeModels';

export type ArcadeEvent =
  | { readonly kind: 'tile'; readonly x: number; readonly y: number; readonly tileId: TileId }
  | { readonly kind: 'score'; readonly score: number };

export interface ArcadeRunResult {
  readonly report: ArcadeReport;
  readonly events: readonly ArcadeEvent[];
  readonly turnEndOffsets: readonly number[];
  readonly turnTilts: readonly JoystickTilt[];
}

export interface MutableArcadeState {
  readonly tiles: Map<string, ScreenTile>;
  score: number;
  paddleX: number | null;
  ballX: number | null;
  drawCount: number;
  readonly events: ArcadeEvent[];
}

export function toNonNegativeSafeInt(value: bigint, label: string): number {
  if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError(`Arcade ${label} out of safe non-negative integer range: ${value}`);
  }
  return Number(value);
}

export function parseTileId(raw: bigint): TileId {
  if (raw < 0n || raw > 4n) {
    throw new RangeError(`Invalid arcade tile id: ${raw}`);
  }
  return Number(raw) as TileId;
}

export function decodeTriple(rawX: bigint, rawY: bigint, rawValue: bigint): ArcadeEvent {
  if (rawX === -1n && rawY === 0n) {
    return Object.freeze({ kind: 'score', score: toNonNegativeSafeInt(rawValue, 'score') });
  }
  return Object.freeze({
    kind: 'tile',
    x: toNonNegativeSafeInt(rawX, 'x coordinate'),
    y: toNonNegativeSafeInt(rawY, 'y coordinate'),
    tileId: parseTileId(rawValue),
  });
}

function applyDecodedEvent(state: MutableArcadeState, event: ArcadeEvent, recordEvents: boolean): void {
  if (event.kind === 'score') {
    state.score = event.score;
  } else {
    state.tiles.set(tileKey(event.x, event.y), Object.freeze({ x: event.x, y: event.y, id: event.tileId }));
    if (event.tileId === 3) {
      state.paddleX = event.x;
    } else if (event.tileId === 4) {
      state.ballX = event.x;
    }
  }
  state.drawCount += 1;
  if (recordEvents) {
    state.events.push(event);
  }
}

export function drainPendingTriples(
  io: ArcadeIoChannel,
  state: MutableArcadeState,
  recordEvents: boolean,
): void {
  if (io.pendingOutputCount % 3 !== 0) {
    throw new Error(`Expected multiples of 3 arcade outputs, got ${io.pendingOutputCount}`);
  }
  while (io.pendingOutputCount >= 3) {
    const event = decodeTriple(io.takeOutput()!, io.takeOutput()!, io.takeOutput()!);
    applyDecodedEvent(state, event, recordEvents);
  }
}

function runInteractiveTurns(
  machine: IntcodeMachine<CompleteParameterMode>,
  io: ArcadeIoChannel,
  state: MutableArcadeState,
  limits: ArcadeExecutionLimits,
  recordEvents: boolean,
  turnEndOffsets: number[],
  turnTilts: JoystickTilt[],
): number {
  let inputTurns = 0;
  while (machine.status === 'waiting-input') {
    if (inputTurns >= limits.maxInputTurns) {
      throw new RangeError(`Arcade exceeded input turn limit of ${limits.maxInputTurns}`);
    }
    const tilt = chooseJoystickTilt(state.ballX, state.paddleX);
    machine.pushInput(BigInt(tilt));
    machine.run(limits.maxVmSteps);
    drainPendingTriples(io, state, recordEvents);
    inputTurns += 1;
    if (recordEvents) {
      turnEndOffsets.push(state.drawCount);
      turnTilts.push(tilt);
    }
  }
  return inputTurns;
}

/** Runs an Intcode arcade program with optional memory patch and joystick autopilot. */
export function runArcade(
  program: IntcodeProgram,
  memoryPatch: MemoryPatch | null,
  limits: ArcadeExecutionLimits,
  recordEvents: boolean,
): ArcadeRunResult {
  const validated = validateArcadeLimits(limits);
  const effectiveProgram = memoryPatch !== null ? program.withPatches([memoryPatch]) : program;
  const io = new ArcadeIoChannel();
  const machine = IntcodeMachine.fromCompleteProgram(effectiveProgram, { io });
  const state: MutableArcadeState = {
    tiles: new Map(), score: 0, paddleX: null, ballX: null, drawCount: 0, events: [],
  };
  const turnEndOffsets: number[] = [];
  const turnTilts: JoystickTilt[] = [];

  machine.run(validated.maxVmSteps);
  drainPendingTriples(io, state, recordEvents);
  if (recordEvents) turnEndOffsets.push(state.drawCount);

  const inputTurns = runInteractiveTurns(machine, io, state, validated, recordEvents, turnEndOffsets, turnTilts);
  const report = new ArcadeReport(state.tiles, state.score, inputTurns, machine.stepCount, state.drawCount);
  return Object.freeze({
    report,
    events: Object.freeze(state.events),
    turnEndOffsets: Object.freeze(turnEndOffsets),
    turnTilts: Object.freeze(turnTilts),
  });
}
