import type { MemoryPatch } from '../../shared/intcode';

/** Arcade tile identifier: 0 empty, 1 wall, 2 block, 3 horizontal paddle, 4 ball. */
export type TileId = 0 | 1 | 2 | 3 | 4;
/** Joystick tilt position: -1 left, 0 neutral, 1 right. */
export type JoystickTilt = -1 | 0 | 1;
/** Visualization trace phase: initial draw stream or interactive play turns. */
export type TracePhase = 'draw' | 'play';

export const DEFAULT_MAX_VM_STEPS = 10_000_000;
export const DEFAULT_MAX_INPUT_TURNS = 100_000;

export interface GridPoint {
  readonly x: number;
  readonly y: number;
}

export interface ScreenTile {
  readonly x: number;
  readonly y: number;
  readonly id: TileId;
}

export interface ArcadeExecutionLimits {
  readonly maxVmSteps: number;
  readonly maxInputTurns: number;
}

export const DEFAULT_ARCADE_LIMITS: ArcadeExecutionLimits = Object.freeze({
  maxVmSteps: DEFAULT_MAX_VM_STEPS,
  maxInputTurns: DEFAULT_MAX_INPUT_TURNS,
});

/** Immutable visualization frame with zero stored derived counts or bounds. */
export interface ArcadeTraceFrame {
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly phase: TracePhase;
  readonly tiles: ReadonlyMap<string, ScreenTile>;
  readonly score: number;
  readonly paddleX: number | null;
  readonly ballX: number | null;
  readonly ballY: number | null;
  readonly ballTrail: readonly GridPoint[];
  readonly lastTilt: JoystickTilt | null;
  readonly inputTurn: number;
  readonly totalInputTurns: number;
}

/** Polymorphic policy differentiating Part 1 block counting from Part 2 free-play score. */
export interface ArcadePolicy<TAnswer> {
  readonly id: string;
  readonly label: string;
  readonly memoryPatch: MemoryPatch | null;
  readonly showScoreBanner: boolean;
  extractAnswer(report: ArcadeReport): TAnswer;
  formatFrameAnswer(frame: ArcadeTraceFrame): string;
}

export function tileKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function countBlocks(tiles: ReadonlyMap<string, ScreenTile>): number {
  let count = 0;
  for (const tile of tiles.values()) {
    if (tile.id === 2) {
      count += 1;
    }
  }
  return count;
}

export function chooseJoystickTilt(ballX: number | null, paddleX: number | null): JoystickTilt {
  if (ballX === null || paddleX === null || ballX === paddleX) {
    return 0;
  }
  return ballX > paddleX ? 1 : -1;
}

export function validateArcadeLimits(limits: ArcadeExecutionLimits): ArcadeExecutionLimits {
  if (!Number.isInteger(limits.maxVmSteps) || limits.maxVmSteps < 1) {
    throw new RangeError(`maxVmSteps must be a positive integer, got ${limits.maxVmSteps}`);
  }
  if (!Number.isInteger(limits.maxInputTurns) || limits.maxInputTurns < 1) {
    throw new RangeError(`maxInputTurns must be a positive integer, got ${limits.maxInputTurns}`);
  }
  return Object.freeze({ maxVmSteps: limits.maxVmSteps, maxInputTurns: limits.maxInputTurns });
}

/** Immutable axis-aligned screen bounds with dynamically derived dimensions. */
export class ScreenBounds {
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

  static empty(): ScreenBounds {
    return new ScreenBounds(0, 0, 0, 0);
  }

  get width(): number {
    return this.maxX - this.minX + 1;
  }

  get height(): number {
    return this.maxY - this.minY + 1;
  }

  expand(x: number, y: number): ScreenBounds {
    return new ScreenBounds(
      Math.min(this.minX, x),
      Math.max(this.maxX, x),
      Math.min(this.minY, y),
      Math.max(this.maxY, y),
    );
  }
}

/** Computes tight screen bounds over all tiles, or ScreenBounds.empty() if empty. */
export function computeScreenBounds(tiles: ReadonlyMap<string, ScreenTile>): ScreenBounds {
  let bounds: ScreenBounds | null = null;
  for (const tile of tiles.values()) {
    bounds = bounds === null ? new ScreenBounds(tile.x, tile.x, tile.y, tile.y) : bounds.expand(tile.x, tile.y);
  }
  return bounds ?? ScreenBounds.empty();
}

/** Final arcade run report with dynamically derived block count and screen bounds. */
export class ArcadeReport {
  readonly tiles: ReadonlyMap<string, ScreenTile>;
  readonly score: number;
  readonly inputTurns: number;
  readonly vmSteps: number;
  readonly drawCount: number;

  constructor(
    tiles: ReadonlyMap<string, ScreenTile>,
    score: number,
    inputTurns: number,
    vmSteps: number,
    drawCount: number,
  ) {
    this.tiles = tiles;
    this.score = score;
    this.inputTurns = inputTurns;
    this.vmSteps = vmSteps;
    this.drawCount = drawCount;
    Object.freeze(this);
  }

  get blockCount(): number {
    return countBlocks(this.tiles);
  }

  get bounds(): ScreenBounds {
    return computeScreenBounds(this.tiles);
  }

  tileAt(x: number, y: number): TileId {
    const tile = this.tiles.get(tileKey(x, y));
    return tile !== undefined ? tile.id : 0;
  }
}
