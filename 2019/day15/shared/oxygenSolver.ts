import {
  sampleTraceIndices,
  validateMaxSteps,
  type PuzzleSolver,
  type TraceOptions,
} from '../../../shared/core';
import { parseIntcodeProgram, type IntcodeProgram } from '../../shared/intcode';
import {
  DEFAULT_OXYGEN_LIMITS,
  ORIGIN,
  pointKey,
  type GridPoint,
  type OxygenExecutionLimits,
  type OxygenPolicy,
  type OxygenTraceFrame,
  type ShipMap,
  type ShipTile,
} from './oxygenModels';
import { exploreShip, type ExplorationMove } from './shipExplorer';
import {
  DistanceField,
  computeDistanceField,
  reconstructPath,
  requireOxygenPoint,
} from './shipSearch';

export const DEFAULT_MAX_TRACE_STEPS = 120;
const EMPTY_PATH: readonly GridPoint[] = Object.freeze([]);

function createExploreFrame(
  stepIndex: number,
  totalSteps: number,
  tiles: ReadonlyMap<string, ShipTile>,
  droid: GridPoint,
  oxygen: GridPoint | null,
  move: ExplorationMove | null,
): OxygenTraceFrame {
  return Object.freeze({
    stepIndex, totalSteps, phase: 'explore', tiles: new Map(tiles), droid, oxygen,
    lastCommand: move !== null ? move.command : null,
    lastStatus: move !== null ? move.status : null,
    isBacktrack: move !== null ? move.isBacktrack : false,
    frontierDistance: null, distances: null, shortestPath: EMPTY_PATH,
  });
}

function buildExploreFrames(
  moves: readonly ExplorationMove[],
  maxFrames: number,
  totalSteps: number,
): OxygenTraceFrame[] {
  const sampled = sampleTraceIndices(moves.length + 1, maxFrames);
  const tiles = new Map<string, ShipTile>([
    [pointKey(ORIGIN.x, ORIGIN.y), Object.freeze({ x: ORIGIN.x, y: ORIGIN.y, kind: 'open' })],
  ]);
  const frames: OxygenTraceFrame[] = [];
  let droid = ORIGIN, oxygen: GridPoint | null = null, cursor = 0;

  if (sampled[cursor] === 0) {
    frames.push(createExploreFrame(0, totalSteps, tiles, droid, oxygen, null));
    cursor += 1;
  }
  for (let i = 0; i < moves.length; i += 1) {
    const move = moves[i]!;
    droid = move.droid;
    if (move.discoveredTile !== null) {
      tiles.set(pointKey(move.discoveredTile.x, move.discoveredTile.y), move.discoveredTile);
      if (move.discoveredTile.kind === 'oxygen') {
        oxygen = Object.freeze({ x: move.discoveredTile.x, y: move.discoveredTile.y });
      }
    }
    if (sampled[cursor] === i + 1) {
      frames.push(createExploreFrame(i + 1, totalSteps, tiles, droid, oxygen, move));
      cursor += 1;
    }
  }
  return frames;
}

function createSolveFrame(
  stepIndex: number,
  totalSteps: number,
  map: ShipMap,
  frontierDistance: number,
  distances: ReadonlyMap<string, number>,
  shortestPath: readonly GridPoint[],
): OxygenTraceFrame {
  return Object.freeze({
    stepIndex, totalSteps, phase: 'solve', tiles: map.tiles, droid: map.origin, oxygen: map.oxygen,
    lastCommand: null, lastStatus: null, isBacktrack: false, frontierDistance, distances, shortestPath,
  });
}

function buildSolveFrames(
  map: ShipMap,
  field: DistanceField,
  shortestPath: readonly GridPoint[],
  maxFrames: number,
  exploreMovesCount: number,
  totalSteps: number,
): OxygenTraceFrame[] {
  const maxDist = field.maxDistance;
  const buckets: Array<Array<[string, number]>> = Array.from({ length: maxDist + 1 }, () => []);
  for (const entry of field.distances.entries()) buckets[entry[1]]!.push(entry);
  const sampled = sampleTraceIndices(maxDist + 1, maxFrames);
  const visible = new Map<string, number>();
  const frames: OxygenTraceFrame[] = [];
  let cursor = 0;

  for (let d = 0; d <= maxDist; d += 1) {
    for (const [key, dist] of buckets[d]!) visible.set(key, dist);
    if (sampled[cursor] === d) {
      const path = d === maxDist ? shortestPath : EMPTY_PATH;
      frames.push(createSolveFrame(exploreMovesCount + 1 + d, totalSteps, map, d, new Map(visible), path));
      cursor += 1;
    }
  }
  return frames;
}

/** Explores the ship compartment and returns the complete ShipMap. */
export function executeOxygenSystem(program: IntcodeProgram, limits?: OxygenExecutionLimits): ShipMap {
  return exploreShip(program, limits ?? DEFAULT_OXYGEN_LIMITS, false).map;
}

/** Explores and solves the compartment, returning bounded trace frames across explore and solve phases. */
export function traceOxygenSystem(
  program: IntcodeProgram,
  policy: OxygenPolicy,
  maxSteps?: number,
  limits?: OxygenExecutionLimits,
): readonly OxygenTraceFrame[] {
  const limit = validateMaxSteps(maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const exploration = exploreShip(program, limits ?? DEFAULT_OXYGEN_LIMITS, true);
  const oxygen = requireOxygenPoint(exploration.map);
  const source = policy.solveSource === 'origin' ? exploration.map.origin : oxygen;
  const field = computeDistanceField(exploration.map, source);
  const shortestPath = policy.solveSource === 'origin' ? reconstructPath(field, oxygen) : EMPTY_PATH;
  const totalSteps = exploration.moves.length + field.maxDistance + 1;

  if (limit === 1) {
    return Object.freeze([
      createSolveFrame(totalSteps, totalSteps, exploration.map, field.maxDistance, field.distances, shortestPath),
    ]);
  }
  const exploreBudget = Math.floor(limit / 2);
  return Object.freeze([
    ...buildExploreFrames(exploration.moves, exploreBudget, totalSteps),
    ...buildSolveFrames(exploration.map, field, shortestPath, limit - exploreBudget, exploration.moves.length, totalSteps),
  ]);
}

export const SHORTEST_PATH_POLICY: OxygenPolicy = Object.freeze({
  id: 'part1',
  label: 'Shortest Path',
  waveLabel: 'BFS from Origin',
  solveSource: 'origin',
  extractAnswer: (map: ShipMap) => computeDistanceField(map, map.origin).requireDistance(requireOxygenPoint(map)),
  formatFrameAnswer: (frame: OxygenTraceFrame) => {
    if (frame.distances !== null && frame.oxygen !== null) {
      const distance = frame.distances.get(pointKey(frame.oxygen.x, frame.oxygen.y));
      if (distance !== undefined) return String(distance);
    }
    return 'Pending';
  },
});

export const OXYGEN_FILL_MINUTES_POLICY: OxygenPolicy = Object.freeze({
  id: 'part2',
  label: 'Oxygen Fill Time',
  waveLabel: 'Oxygen Wavefront',
  solveSource: 'oxygen',
  extractAnswer: (map: ShipMap) => computeDistanceField(map, requireOxygenPoint(map)).maxDistance,
  formatFrameAnswer: (frame: OxygenTraceFrame) =>
    frame.frontierDistance !== null ? String(frame.frontierDistance) : 'Pending',
});

/** Reusable PuzzleSolver parameterized by Part 1 / Part 2 OxygenPolicy. */
export class OxygenSystemSolver implements Required<PuzzleSolver<IntcodeProgram, number, OxygenTraceFrame>> {
  readonly policy: OxygenPolicy;

  constructor(policy: OxygenPolicy) { this.policy = policy; }
  parse(raw: string): IntcodeProgram { return parseIntcodeProgram(raw); }
  solve(input: IntcodeProgram): number { return this.policy.extractAnswer(executeOxygenSystem(input)); }
  trace(input: IntcodeProgram, options?: TraceOptions): readonly OxygenTraceFrame[] {
    return traceOxygenSystem(input, this.policy, options?.maxSteps);
  }
}
