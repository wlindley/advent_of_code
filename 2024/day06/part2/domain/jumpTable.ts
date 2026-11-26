import { simulatePatrol, turnRight, type CellCoord, type GuardDirection, type LabMap } from '../../shared';

export interface LoopTrajectory {
  readonly approachVertices: readonly CellCoord[];
  readonly cycleVertices: readonly CellCoord[];
}

function buildVerticalTables(map: LabMap): readonly [Int32Array, Int32Array] {
  const up = new Int32Array(map.size);
  const down = new Int32Array(map.size);
  for (let c = 0; c < map.cols; c += 1) {
    let stopUp = -1;
    for (let r = 0; r < map.rows; r += 1) {
      const idx = r * map.cols + c;
      if (map.isObstacle(r, c)) stopUp = r + 1;
      else up[idx] = stopUp;
    }
    let stopDown = -1;
    for (let r = map.rows - 1; r >= 0; r -= 1) {
      const idx = r * map.cols + c;
      if (map.isObstacle(r, c)) stopDown = r - 1;
      else down[idx] = stopDown;
    }
  }
  return [up, down];
}

function buildHorizontalTables(map: LabMap): readonly [Int32Array, Int32Array] {
  const right = new Int32Array(map.size);
  const left = new Int32Array(map.size);
  for (let r = 0; r < map.rows; r += 1) {
    let stopLeft = -1;
    for (let c = 0; c < map.cols; c += 1) {
      const idx = r * map.cols + c;
      if (map.isObstacle(r, c)) stopLeft = c + 1;
      else left[idx] = stopLeft;
    }
    let stopRight = -1;
    for (let c = map.cols - 1; c >= 0; c -= 1) {
      const idx = r * map.cols + c;
      if (map.isObstacle(r, c)) stopRight = c - 1;
      else right[idx] = stopRight;
    }
  }
  return [right, left];
}

function buildDirectionTables(
  map: LabMap,
): readonly [Int32Array, Int32Array, Int32Array, Int32Array] {
  const [up, down] = buildVerticalTables(map);
  const [right, left] = buildHorizontalTables(map);
  return Object.freeze([up, right, down, left]);
}

function buildTrajectory(poses: readonly CellCoord[], cycleStart: number): LoopTrajectory {
  const approachVertices = Object.freeze(poses.slice(0, cycleStart + 1));
  const cycleVertices = Object.freeze([...poses.slice(cycleStart), poses[cycleStart]!]);
  return Object.freeze({ approachVertices, cycleVertices });
}

/**
 * Immutable directional jump-table index over a `LabMap` supporting `O(1)` ray
 * interception for any candidate extra obstacle and fast cycle/trajectory queries.
 */
export class ObstacleJumpTable {
  readonly map: LabMap;
  private readonly tables: readonly [Int32Array, Int32Array, Int32Array, Int32Array];

  constructor(map: LabMap) {
    this.map = map;
    this.tables = buildDirectionTables(map);
    Object.freeze(this);
  }

  private validateExtraObstacle(extraObstacle: CellCoord): void {
    if (!this.map.inBounds(extraObstacle.row, extraObstacle.col)) {
      throw new RangeError(
        `Extra obstacle (${extraObstacle.row}, ${extraObstacle.col}) out of bounds for ${this.map.rows}x${this.map.cols}`,
      );
    }
    if (extraObstacle.row === this.map.startRow && extraObstacle.col === this.map.startCol) {
      throw new Error(`Extra obstacle cannot be placed on guard start (${extraObstacle.row}, ${extraObstacle.col})`);
    }
  }

  private resolveStop(row: number, col: number, dir: GuardDirection, obsRow: number, obsCol: number): number {
    const base = this.tables[dir][row * this.map.cols + col]!;
    if (dir === 0) {
      return obsCol === col && obsRow < row && obsRow + 1 > base ? obsRow + 1 : base;
    }
    if (dir === 1) {
      return obsRow === row && obsCol > col && (base === -1 || obsCol - 1 < base) ? obsCol - 1 : base;
    }
    if (dir === 2) {
      return obsCol === col && obsRow > row && (base === -1 || obsRow - 1 < base) ? obsRow - 1 : base;
    }
    return obsRow === row && obsCol < col && obsCol + 1 > base ? obsCol + 1 : base;
  }

  private detectLoop(obsRow: number, obsCol: number, seen: Uint32Array, stamp: number): boolean {
    const cols = this.map.cols;
    let row = this.map.startRow;
    let col = this.map.startCol;
    let dir = this.map.startDir;

    while (true) {
      const state = (row * cols + col) * 4 + dir;
      if (seen[state]! === stamp) return true;
      seen[state] = stamp;
      const stop = this.resolveStop(row, col, dir, obsRow, obsCol);
      if (stop === -1) return false;
      if (dir === 0 || dir === 2) row = stop;
      else col = stop;
      dir = turnRight(dir);
    }
  }

  causesLoop(extraObstacle: CellCoord): boolean {
    this.validateExtraObstacle(extraObstacle);
    const seen = new Uint32Array(4 * this.map.size);
    return this.detectLoop(extraObstacle.row, extraObstacle.col, seen, 1);
  }

  traceLoopPath(extraObstacle: CellCoord): LoopTrajectory | null {
    this.validateExtraObstacle(extraObstacle);
    const cols = this.map.cols;
    const firstVisit = new Int32Array(4 * this.map.size).fill(-1);
    const poses: CellCoord[] = [];
    let row = this.map.startRow;
    let col = this.map.startCol;
    let dir = this.map.startDir;

    while (true) {
      const state = (row * cols + col) * 4 + dir;
      const seenIndex = firstVisit[state]!;
      if (seenIndex !== -1) return buildTrajectory(poses, seenIndex);
      firstVisit[state] = poses.length;
      poses.push(Object.freeze({ row, col }));
      const stop = this.resolveStop(row, col, dir, extraObstacle.row, extraObstacle.col);
      if (stop === -1) return null;
      if (dir === 0 || dir === 2) row = stop;
      else col = stop;
      dir = turnRight(dir);
    }
  }

  findLoopObstructions(): readonly CellCoord[] {
    const baseline = simulatePatrol(this.map);
    const checkVisitedOnly = baseline.outcome === 'exited';
    const seen = new Uint32Array(4 * this.map.size);
    const result: CellCoord[] = [];
    let stamp = 0;

    for (let r = 0; r < this.map.rows; r += 1) {
      for (let c = 0; c < this.map.cols; c += 1) {
        if (r === this.map.startRow && c === this.map.startCol) continue;
        if (checkVisitedOnly ? !baseline.wasVisited(r, c) : this.map.isObstacle(r, c)) continue;
        stamp += 1;
        if (this.detectLoop(r, c, seen, stamp)) {
          result.push(Object.freeze({ row: r, col: c }));
        }
      }
    }
    return Object.freeze(result);
  }
}
