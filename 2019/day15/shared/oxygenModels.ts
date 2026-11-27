export type MoveCommand = 1 | 2 | 3 | 4;
export type DroidStatus = 0 | 1 | 2;
export type TileKind = 'wall' | 'open' | 'oxygen';
export type OxygenTracePhase = 'explore' | 'solve';

export interface GridPoint {
  readonly x: number;
  readonly y: number;
}

export interface ShipTile {
  readonly x: number;
  readonly y: number;
  readonly kind: TileKind;
}

export interface OxygenExecutionLimits {
  readonly maxVmSteps: number;
  readonly maxMoves: number;
}

/** Immutable visualization trace frame with zero stored derived counts or bounds. */
export interface OxygenTraceFrame {
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly phase: OxygenTracePhase;
  readonly tiles: ReadonlyMap<string, ShipTile>;
  readonly droid: GridPoint;
  readonly oxygen: GridPoint | null;
  readonly lastCommand: MoveCommand | null;
  readonly lastStatus: DroidStatus | null;
  readonly isBacktrack: boolean;
  readonly frontierDistance: number | null;
  readonly distances: ReadonlyMap<string, number> | null;
  readonly shortestPath: readonly GridPoint[];
}

/** Polymorphic policy differentiating Part 1 shortest path from Part 2 oxygen fill time. */
export interface OxygenPolicy {
  readonly id: 'part1' | 'part2';
  readonly label: string;
  readonly waveLabel: string;
  readonly solveSource: 'origin' | 'oxygen';
  extractAnswer(map: ShipMap): number;
  formatFrameAnswer(frame: OxygenTraceFrame): string;
}

export const ORIGIN: GridPoint = Object.freeze({ x: 0, y: 0 });
export const MOVE_COMMANDS: readonly [1, 2, 3, 4] = Object.freeze([1, 2, 3, 4] as const);
export const DEFAULT_MAX_VM_STEPS = 5_000_000;
export const DEFAULT_MAX_MOVES = 50_000;
export const DEFAULT_OXYGEN_LIMITS: OxygenExecutionLimits = Object.freeze({
  maxVmSteps: DEFAULT_MAX_VM_STEPS,
  maxMoves: DEFAULT_MAX_MOVES,
});

const STEP_DELTAS: Readonly<Record<MoveCommand, GridPoint>> = Object.freeze({
  1: Object.freeze({ x: 0, y: -1 }),
  2: Object.freeze({ x: 0, y: 1 }),
  3: Object.freeze({ x: -1, y: 0 }),
  4: Object.freeze({ x: 1, y: 0 }),
});

const OPPOSITE_COMMANDS: Readonly<Record<MoveCommand, MoveCommand>> = Object.freeze({ 1: 2, 2: 1, 3: 4, 4: 3 });

export function pointKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function stepPoint(point: GridPoint, command: MoveCommand): GridPoint {
  const delta = STEP_DELTAS[command];
  return Object.freeze({ x: point.x + delta.x, y: point.y + delta.y });
}

export function oppositeCommand(command: MoveCommand): MoveCommand {
  return OPPOSITE_COMMANDS[command];
}

export function parseDroidStatus(raw: bigint): DroidStatus {
  if (raw < 0n || raw > 2n) throw new RangeError(`Invalid droid status: ${raw}`);
  return Number(raw) as DroidStatus;
}

export function validateOxygenLimits(limits: OxygenExecutionLimits): OxygenExecutionLimits {
  if (!Number.isSafeInteger(limits.maxVmSteps) || limits.maxVmSteps < 1) {
    throw new RangeError(`maxVmSteps must be a positive safe integer, got ${limits.maxVmSteps}`);
  }
  if (!Number.isSafeInteger(limits.maxMoves) || limits.maxMoves < 1) {
    throw new RangeError(`maxMoves must be a positive safe integer, got ${limits.maxMoves}`);
  }
  return Object.freeze({ maxVmSteps: limits.maxVmSteps, maxMoves: limits.maxMoves });
}

/** Immutable axis-aligned bounds with dynamically derived width and height. */
export class ShipBounds {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;

  constructor(minX: number, maxX: number, minY: number, maxY: number) {
    this.minX = minX;
    this.maxX = maxX;
    this.minY = minY;
    this.maxY = maxY;
    Object.freeze(this);
  }

  static empty(): ShipBounds { return new ShipBounds(0, 0, 0, 0); }
  get width(): number { return this.maxX - this.minX + 1; }
  get height(): number { return this.maxY - this.minY + 1; }

  expand(x: number, y: number): ShipBounds {
    return new ShipBounds(
      Math.min(this.minX, x), Math.max(this.maxX, x),
      Math.min(this.minY, y), Math.max(this.maxY, y),
    );
  }
}

/** Computes tight bounds over all tiles, or ShipBounds.empty() when empty. */
export function computeShipBounds(tiles: ReadonlyMap<string, ShipTile>): ShipBounds {
  let bounds: ShipBounds | null = null;
  for (const tile of tiles.values()) {
    bounds = bounds === null ? new ShipBounds(tile.x, tile.x, tile.y, tile.y) : bounds.expand(tile.x, tile.y);
  }
  return bounds ?? ShipBounds.empty();
}

function countTiles(tiles: ReadonlyMap<string, ShipTile>, countWalls: boolean): number {
  let count = 0;
  for (const tile of tiles.values()) {
    if (countWalls ? tile.kind === 'wall' : tile.kind !== 'wall') count += 1;
  }
  return count;
}

/** Immutable explored compartment map with dynamically derived bounds and counts. */
export class ShipMap {
  readonly tiles: ReadonlyMap<string, ShipTile>;
  readonly origin: GridPoint;
  readonly oxygen: GridPoint | null;
  readonly moveCount: number;
  readonly vmSteps: number;

  constructor(
    tiles: ReadonlyMap<string, ShipTile>,
    origin: GridPoint,
    oxygen: GridPoint | null,
    moveCount: number,
    vmSteps: number,
  ) {
    this.tiles = tiles;
    this.origin = origin;
    this.oxygen = oxygen;
    this.moveCount = moveCount;
    this.vmSteps = vmSteps;
    Object.freeze(this);
  }

  get bounds(): ShipBounds { return computeShipBounds(this.tiles); }
  get openCount(): number { return countTiles(this.tiles, false); }
  get wallCount(): number { return countTiles(this.tiles, true); }

  tileAt(x: number, y: number): TileKind | null {
    const tile = this.tiles.get(pointKey(x, y));
    return tile !== undefined ? tile.kind : null;
  }

  isTraversable(x: number, y: number): boolean {
    const kind = this.tileAt(x, y);
    return kind === 'open' || kind === 'oxygen';
  }
}
