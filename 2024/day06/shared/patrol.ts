import { DIRS_4 } from '../../../shared/core';
import { turnRight, type GuardDirection } from './direction';
import type { CellCoord, LabMap } from './labMap';

export type PatrolOutcome = 'exited' | 'loop';
export type PatrolAction = 'start' | 'move' | 'turn';

export interface PatrolStep {
  readonly row: number;
  readonly col: number;
  readonly dir: GuardDirection;
  readonly action: PatrolAction;
}

export interface PatrolOptions {
  readonly extraObstacle?: CellCoord;
  readonly recordSteps?: boolean;
}

/** Immutable outcome of a guard patrol simulation over a `LabMap`. */
export class PatrolResult {
  private readonly map: LabMap;
  private readonly visitedMask: Uint8Array;
  readonly outcome: PatrolOutcome;
  readonly steps: readonly PatrolStep[];

  constructor(map: LabMap, outcome: PatrolOutcome, visitedMask: Uint8Array, steps: readonly PatrolStep[] = []) {
    if (visitedMask.length !== map.size) {
      throw new RangeError(`Expected visitedMask of length ${map.size}, got ${visitedMask.length}`);
    }
    this.map = map;
    this.outcome = outcome;
    this.visitedMask = new Uint8Array(visitedMask);
    this.steps = Object.freeze(steps.slice());
    Object.freeze(this);
  }

  get visitedCount(): number {
    let count = 0;
    for (let i = 0; i < this.visitedMask.length; i += 1) {
      if (this.visitedMask[i]! !== 0) count += 1;
    }
    return count;
  }

  wasVisited(row: number, col: number): boolean {
    if (!this.map.inBounds(row, col)) {
      throw new RangeError(`Grid coordinates (${row}, ${col}) out of bounds for ${this.map.rows}x${this.map.cols}`);
    }
    return this.visitedMask[row * this.map.cols + col]! !== 0;
  }
}

function resolveExtraObstacleIndex(map: LabMap, extraObstacle?: CellCoord): number {
  if (!extraObstacle) return -1;
  if (!map.inBounds(extraObstacle.row, extraObstacle.col)) {
    throw new RangeError(
      `Extra obstacle (${extraObstacle.row}, ${extraObstacle.col}) out of bounds for ${map.rows}x${map.cols}`,
    );
  }
  if (extraObstacle.row === map.startRow && extraObstacle.col === map.startCol) {
    throw new Error(`Extra obstacle cannot be placed on guard start (${extraObstacle.row}, ${extraObstacle.col})`);
  }
  return extraObstacle.row * map.cols + extraObstacle.col;
}

function createStep(row: number, col: number, dir: GuardDirection, action: PatrolAction): PatrolStep {
  return Object.freeze({ row, col, dir, action });
}

function markState(visitedMask: Uint8Array, idx: number, dir: GuardDirection): boolean {
  const bit = 1 << dir;
  const mask = visitedMask[idx]!;
  if ((mask & bit) !== 0) return true;
  visitedMask[idx] = mask | bit;
  return false;
}

/** Simulates the guard's patrol until leaving the lab or revisiting a `(cell, direction)` state. */
export function simulatePatrol(map: LabMap, options: PatrolOptions = {}): PatrolResult {
  const extraIdx = resolveExtraObstacleIndex(map, options.extraObstacle);
  const recordSteps = options.recordSteps === true;
  const visitedMask = new Uint8Array(map.size);
  const steps: PatrolStep[] = [];
  let row = map.startRow;
  let col = map.startCol;
  let dir = map.startDir;

  markState(visitedMask, row * map.cols + col, dir);
  if (recordSteps) steps.push(createStep(row, col, dir, 'start'));

  while (true) {
    const [dr, dc] = DIRS_4[dir]!;
    const nextRow = row + dr;
    const nextCol = col + dc;
    if (!map.inBounds(nextRow, nextCol)) return new PatrolResult(map, 'exited', visitedMask, steps);
    const nextIdx = nextRow * map.cols + nextCol;
    const blocked = map.isObstacle(nextRow, nextCol) || nextIdx === extraIdx;
    const action: PatrolAction = blocked ? 'turn' : 'move';
    if (blocked) {
      dir = turnRight(dir);
    } else {
      row = nextRow;
      col = nextCol;
    }
    if (markState(visitedMask, row * map.cols + col, dir)) return new PatrolResult(map, 'loop', visitedMask, steps);
    if (recordSteps) steps.push(createStep(row, col, dir, action));
  }
}
