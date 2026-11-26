import type { GridCoord } from './basin';

export type BasinWaypoint = 'start' | 'end';
export type MoveAction = 'start' | 'wait' | 'up' | 'down' | 'left' | 'right';

export const PART1_WAYPOINTS: readonly BasinWaypoint[] = Object.freeze(['start', 'end'] as const);
export const PART2_WAYPOINTS: readonly BasinWaypoint[] = Object.freeze([
  'start',
  'end',
  'start',
  'end',
] as const);

function assertNonNegSafeInt(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative safe integer, got ${value}`);
  }
}

/** Shortest-path result for a single valley crossing leg. */
export class LegResult {
  readonly startTime: number;
  readonly path: Int32Array;
  readonly frontierCounts: Int32Array;

  constructor(startTime: number, path: Int32Array, frontierCounts: Int32Array) {
    assertNonNegSafeInt(startTime, 'startTime');
    if (path.length < 1) {
      throw new RangeError('LegResult path must contain at least one cell');
    }
    if (frontierCounts.length !== path.length) {
      throw new RangeError(
        `frontierCounts length (${frontierCounts.length}) must match path length (${path.length})`,
      );
    }
    this.startTime = startTime;
    this.path = new Int32Array(path);
    this.frontierCounts = new Int32Array(frontierCounts);
    Object.freeze(this);
  }

  get duration(): number { return this.path.length - 1; }
  get arrivalTime(): number { return this.startTime + this.duration; }
  get startCellId(): number { return this.path[0]!; }
  get endCellId(): number { return this.path[this.path.length - 1]!; }
}

/** Multi-leg trip summary across a sequence of `BasinWaypoint` stops. */
export class TripResult {
  readonly legs: readonly LegResult[];

  constructor(legs: readonly LegResult[]) {
    if (legs.length < 1) {
      throw new RangeError('TripResult requires at least one leg');
    }
    this.legs = Object.freeze([...legs]);
    Object.freeze(this);
  }

  get totalMinutes(): number {
    let total = 0;
    for (let i = 0; i < this.legs.length; i += 1) {
      total += this.legs[i]!.duration;
    }
    return total;
  }

  get legDurations(): readonly number[] {
    return Object.freeze(this.legs.map((leg) => leg.duration));
  }
}

/** Immutable single-step visualization frame along a shortest trip. */
export class BasinFrame {
  readonly minute: number;
  readonly legIndex: number;
  readonly legCount: number;
  readonly position: GridCoord;
  readonly action: MoveAction;
  readonly frontierCount: number;

  constructor(
    minute: number,
    legIndex: number,
    legCount: number,
    position: GridCoord,
    action: MoveAction,
    frontierCount: number,
  ) {
    assertNonNegSafeInt(minute, 'minute');
    assertNonNegSafeInt(frontierCount, 'frontierCount');
    if (!Number.isInteger(legCount) || legCount < 1) {
      throw new RangeError(`legCount must be an integer >= 1, got ${legCount}`);
    }
    if (!Number.isInteger(legIndex) || legIndex < 0 || legIndex >= legCount) {
      throw new RangeError(`legIndex must be in [0, ${legCount - 1}], got ${legIndex}`);
    }
    this.minute = minute;
    this.legIndex = legIndex;
    this.legCount = legCount;
    this.position = Object.freeze({ row: position.row, col: position.col });
    this.action = action;
    this.frontierCount = frontierCount;
    Object.freeze(this);
  }
}
