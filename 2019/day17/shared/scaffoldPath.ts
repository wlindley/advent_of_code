import {
  DIRECTION_DELTAS,
  ScaffoldMap,
  turnBack,
  turnLeft,
  turnRight,
  type Direction,
  type GridPoint,
  type RobotPose,
} from './scaffoldMap';

/** Uncompressed scaffold traversal path from the robot's initial pose to the end of the track. */
export interface ScaffoldPath {
  readonly start: RobotPose;
  readonly tokens: readonly string[];
  readonly waypoints: readonly GridPoint[];
}

const DIR_INDEX: Readonly<Record<Direction, number>> = Object.freeze({ U: 0, R: 1, D: 2, L: 3 });

function canAdvance(map: ScaffoldMap, x: number, y: number, dir: Direction): boolean {
  const delta = DIRECTION_DELTAS[dir];
  return map.isScaffold(x + delta.x, y + delta.y);
}

function chooseTurn(
  map: ScaffoldMap,
  x: number,
  y: number,
  dir: Direction,
  isInitial: boolean,
): { readonly nextDir: Direction; readonly turnTokens: readonly ('L' | 'R')[] } | null {
  const left = turnLeft(dir);
  if (canAdvance(map, x, y, left)) {
    return { nextDir: left, turnTokens: ['L'] };
  }
  const right = turnRight(dir);
  if (canAdvance(map, x, y, right)) {
    return { nextDir: right, turnTokens: ['R'] };
  }
  if (isInitial) {
    const back = turnBack(dir);
    if (canAdvance(map, x, y, back)) {
      return { nextDir: back, turnTokens: ['R', 'R'] };
    }
  }
  return null;
}

function walkStraight(
  map: ScaffoldMap,
  startX: number,
  startY: number,
  dir: Direction,
  visitedStates: Set<number>,
  waypoints: GridPoint[],
): { readonly x: number; readonly y: number; readonly steps: number } {
  let x = startX;
  let y = startY;
  let steps = 0;
  const delta = DIRECTION_DELTAS[dir];

  while (canAdvance(map, x, y, dir)) {
    const stateKey = (y * map.width + x) * 4 + DIR_INDEX[dir];
    if (visitedStates.has(stateKey)) {
      throw new Error(`Cycle detected in scaffold path at (${x}, ${y}) facing ${dir}`);
    }
    visitedStates.add(stateKey);
    x += delta.x;
    y += delta.y;
    steps += 1;
    waypoints.push(Object.freeze({ x, y }));
  }
  return { x, y, steps };
}

/** Traces the greedy straight-across-intersections movement sequence for a ScaffoldMap. */
export function traceScaffoldPath(map: ScaffoldMap): ScaffoldPath {
  const start = map.robot;
  if (start === null) {
    throw new Error('Scaffold map has no live robot');
  }
  let x = start.x;
  let y = start.y;
  let dir = start.direction;
  const tokens: string[] = [];
  const waypoints: GridPoint[] = [Object.freeze({ x, y })];
  const visitedStates = new Set<number>();

  while (true) {
    if (canAdvance(map, x, y, dir)) {
      const moved = walkStraight(map, x, y, dir, visitedStates, waypoints);
      x = moved.x;
      y = moved.y;
      tokens.push(String(moved.steps));
    }
    const turn = chooseTurn(map, x, y, dir, tokens.length === 0);
    if (turn === null) {
      break;
    }
    dir = turn.nextDir;
    tokens.push(...turn.turnTokens);
  }
  return Object.freeze({ start, tokens: Object.freeze(tokens), waypoints: Object.freeze(waypoints) });
}
