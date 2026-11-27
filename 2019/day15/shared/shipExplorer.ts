import {
  IntcodeMachine,
  type CompleteParameterMode,
  type IntcodeProgram,
} from '../../shared/intcode';
import { DroidIoChannel } from './droidIo';
import {
  MOVE_COMMANDS,
  ORIGIN,
  ShipMap,
  oppositeCommand,
  parseDroidStatus,
  pointKey,
  stepPoint,
  validateOxygenLimits,
  type DroidStatus,
  type GridPoint,
  type MoveCommand,
  type OxygenExecutionLimits,
  type ShipTile,
  type TileKind,
} from './oxygenModels';

export interface ExplorationMove {
  readonly command: MoveCommand;
  readonly status: DroidStatus;
  readonly droid: GridPoint;
  readonly discoveredTile: ShipTile | null;
  readonly isBacktrack: boolean;
}

export interface ExplorationResult {
  readonly map: ShipMap;
  readonly moves: readonly ExplorationMove[];
}

interface DfsFrame {
  readonly point: GridPoint;
  nextCmdIdx: number;
  readonly backtrackCmd: MoveCommand | null;
}

interface ExplorerState {
  readonly machine: IntcodeMachine<CompleteParameterMode>;
  readonly io: DroidIoChannel;
  readonly limits: OxygenExecutionLimits;
  readonly tiles: Map<string, ShipTile>;
  readonly stack: DfsFrame[];
  readonly moves: ExplorationMove[];
  readonly recordMoves: boolean;
  droid: GridPoint;
  oxygen: GridPoint | null;
  moveCount: number;
}

function initializeDroid(
  program: IntcodeProgram,
  limits: OxygenExecutionLimits,
  recordMoves: boolean,
): ExplorerState {
  const io = new DroidIoChannel();
  const machine = IntcodeMachine.fromCompleteProgram(program, { io });
  machine.run(limits.maxVmSteps);
  if (io.pendingOutputCount !== 0) {
    throw new Error(`Unexpected output before droid command: ${io.pendingOutputCount}`);
  }
  if (machine.status !== 'waiting-input') {
    throw new Error(`Expected droid to enter waiting-input state, got "${machine.status}"`);
  }
  const originTile: ShipTile = Object.freeze({ x: ORIGIN.x, y: ORIGIN.y, kind: 'open' });
  return {
    machine,
    io,
    limits,
    tiles: new Map([[pointKey(ORIGIN.x, ORIGIN.y), originTile]]),
    stack: [{ point: ORIGIN, nextCmdIdx: 0, backtrackCmd: null }],
    moves: [],
    recordMoves,
    droid: ORIGIN,
    oxygen: null,
    moveCount: 0,
  };
}

function issueDroidCommand(state: ExplorerState, command: MoveCommand): DroidStatus {
  if (state.moveCount >= state.limits.maxMoves) {
    throw new RangeError(`Droid exploration exceeded move limit of ${state.limits.maxMoves}`);
  }
  if (state.machine.status !== 'waiting-input') {
    throw new Error(`Cannot issue droid command: expected waiting-input, got "${state.machine.status}"`);
  }
  state.machine.pushInput(BigInt(command));
  state.machine.run(state.limits.maxVmSteps);
  state.moveCount += 1;
  if (state.io.pendingOutputCount !== 1) {
    throw new Error(`Expected 1 droid status output, got ${state.io.pendingOutputCount}`);
  }
  return parseDroidStatus(state.io.takeOutput()!);
}

function probeNextDirection(state: ExplorerState, top: DfsFrame): void {
  const command = MOVE_COMMANDS[top.nextCmdIdx]!;
  top.nextCmdIdx += 1;
  const target = stepPoint(top.point, command);
  const targetKey = pointKey(target.x, target.y);
  if (state.tiles.has(targetKey)) {
    return;
  }
  const status = issueDroidCommand(state, command);
  if (status === 0) {
    const wallTile: ShipTile = Object.freeze({ x: target.x, y: target.y, kind: 'wall' });
    state.tiles.set(targetKey, wallTile);
    if (state.recordMoves) {
      state.moves.push(Object.freeze({ command, status, droid: state.droid, discoveredTile: wallTile, isBacktrack: false }));
    }
    return;
  }
  if (status === 2) {
    if (state.oxygen !== null) {
      throw new Error('Multiple oxygen systems detected');
    }
    state.oxygen = target;
  }
  const kind: TileKind = status === 2 ? 'oxygen' : 'open';
  const openTile: ShipTile = Object.freeze({ x: target.x, y: target.y, kind });
  state.tiles.set(targetKey, openTile);
  state.droid = target;
  if (state.recordMoves) {
    state.moves.push(Object.freeze({ command, status, droid: target, discoveredTile: openTile, isBacktrack: false }));
  }
  state.stack.push({ point: target, nextCmdIdx: 0, backtrackCmd: oppositeCommand(command) });
}

function backtrackFrame(state: ExplorerState, top: DfsFrame): void {
  state.stack.pop();
  if (top.backtrackCmd === null) {
    return;
  }
  const backStatus = issueDroidCommand(state, top.backtrackCmd);
  if (backStatus === 0) {
    throw new Error('Droid hit unexpected wall while backtracking');
  }
  state.droid = stepPoint(top.point, top.backtrackCmd);
  if (state.recordMoves) {
    state.moves.push(
      Object.freeze({
        command: top.backtrackCmd,
        status: backStatus,
        droid: state.droid,
        discoveredTile: null,
        isBacktrack: true,
      }),
    );
  }
}

/** Explores the entire reachable compartment via iterative DFS with backtracking. */
export function exploreShip(
  program: IntcodeProgram,
  limits: OxygenExecutionLimits,
  recordMoves: boolean,
): ExplorationResult {
  const validated = validateOxygenLimits(limits);
  const state = initializeDroid(program, validated, recordMoves);
  while (state.stack.length > 0) {
    const top = state.stack[state.stack.length - 1]!;
    if (top.nextCmdIdx < MOVE_COMMANDS.length) {
      probeNextDirection(state, top);
    } else {
      backtrackFrame(state, top);
    }
  }
  const map = new ShipMap(state.tiles, ORIGIN, state.oxygen, state.moveCount, state.machine.stepCount);
  return Object.freeze({ map, moves: Object.freeze(state.moves) });
}
