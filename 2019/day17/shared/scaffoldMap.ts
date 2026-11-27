/** Cardinal heading of the vacuum robot on the scaffold grid. */
export type Direction = 'U' | 'R' | 'D' | 'L';

/** Valid ASCII symbols appearing in a Day 17 camera frame. */
export type ScaffoldCell = '.' | '#' | '^' | 'v' | '<' | '>' | 'X';

/** Immutable 2D integer coordinate on the scaffold grid. */
export interface GridPoint {
  readonly x: number;
  readonly y: number;
}

/** Position and cardinal heading of a live vacuum robot. */
export interface RobotPose {
  readonly x: number;
  readonly y: number;
  readonly direction: Direction;
}

const DIRECTIONS: readonly Direction[] = Object.freeze(['U', 'R', 'D', 'L']);
const DIR_INDEX: Readonly<Record<Direction, number>> = Object.freeze({ U: 0, R: 1, D: 2, L: 3 });

/** Unit step vector for each cardinal heading (y grows downward). */
export const DIRECTION_DELTAS: Readonly<Record<Direction, GridPoint>> = Object.freeze({
  U: Object.freeze({ x: 0, y: -1 }),
  R: Object.freeze({ x: 1, y: 0 }),
  D: Object.freeze({ x: 0, y: 1 }),
  L: Object.freeze({ x: -1, y: 0 }),
});

/** Rotates a cardinal heading 90 degrees counter-clockwise. */
export function turnLeft(direction: Direction): Direction {
  return DIRECTIONS[(DIR_INDEX[direction] + 3) % 4]!;
}

/** Rotates a cardinal heading 90 degrees clockwise. */
export function turnRight(direction: Direction): Direction {
  return DIRECTIONS[(DIR_INDEX[direction] + 1) % 4]!;
}

/** Rotates a cardinal heading 180 degrees. */
export function turnBack(direction: Direction): Direction {
  return DIRECTIONS[(DIR_INDEX[direction] + 2) % 4]!;
}

const CELL_SYMBOLS: readonly ScaffoldCell[] = Object.freeze(['.', '#', '^', 'v', '<', '>', 'X']);
const CELL_CODE_MAP = new Map<string, number>(CELL_SYMBOLS.map((sym, idx) => [sym, idx]));
const ROBOT_DIRECTIONS: readonly Direction[] = Object.freeze(['U', 'D', 'L', 'R']);

function parseAsciiLines(raw: string): string[] {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }
  if (lines.length === 0) {
    throw new Error('Scaffold map is empty');
  }
  return lines;
}

function encodeRows(lines: readonly string[]): Uint8Array {
  const width = lines[0]!.length;
  const cells = new Uint8Array(width * lines.length);
  let robotCount = 0;

  for (let y = 0; y < lines.length; y += 1) {
    const line = lines[y]!;
    if (line.length === 0) {
      throw new Error(`Scaffold map contains a blank line at row ${y}`);
    }
    if (line.length !== width) {
      throw new Error(`Scaffold map is ragged at row ${y}: expected ${width}, got ${line.length}`);
    }
    for (let x = 0; x < width; x += 1) {
      const code = CELL_CODE_MAP.get(line[x]!);
      if (code === undefined) {
        throw new Error(`Unknown scaffold character "${line[x]!}" at (${x}, ${y})`);
      }
      if (code >= 2 && code <= 5) {
        robotCount += 1;
        if (robotCount > 1) {
          throw new Error('Multiple robots in scaffold map');
        }
      }
      cells[y * width + x] = code;
    }
  }
  return cells;
}

/** Immutable 2D ASCII scaffold grid backed by a private typed array. */
export class ScaffoldMap {
  readonly width: number;
  readonly height: number;
  private readonly cells: Uint8Array;

  constructor(width: number, height: number, cells: Uint8Array) {
    this.width = width;
    this.height = height;
    this.cells = cells;
    // Never freeze Uint8Array directly; freeze the wrapper instance only.
    Object.freeze(this);
  }

  static fromAscii(raw: string): ScaffoldMap {
    const lines = parseAsciiLines(raw);
    return new ScaffoldMap(lines[0]!.length, lines.length, encodeRows(lines));
  }

  get robot(): RobotPose | null {
    for (let i = 0; i < this.cells.length; i += 1) {
      const code = this.cells[i]!;
      if (code >= 2 && code <= 5) {
        const x = i % this.width;
        const y = (i - x) / this.width;
        return Object.freeze({ x, y, direction: ROBOT_DIRECTIONS[code - 2]! });
      }
    }
    return null;
  }

  get scaffoldCount(): number {
    let count = 0;
    for (let i = 0; i < this.cells.length; i += 1) {
      const code = this.cells[i]!;
      if (code >= 1 && code <= 5) {
        count += 1;
      }
    }
    return count;
  }

  get intersections(): readonly GridPoint[] {
    const points: GridPoint[] = [];
    for (let y = 1; y < this.height - 1; y += 1) {
      for (let x = 1; x < this.width - 1; x += 1) {
        if (this.isIntersectionAt(x, y)) {
          points.push(Object.freeze({ x, y }));
        }
      }
    }
    return Object.freeze(points);
  }

  get alignmentParameterSum(): bigint {
    let sum = 0n;
    for (const point of this.intersections) {
      sum += BigInt(point.x) * BigInt(point.y);
    }
    return sum;
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  cellAt(x: number, y: number): ScaffoldCell {
    if (!this.inBounds(x, y)) {
      throw new RangeError(`Scaffold coordinate (${x}, ${y}) out of bounds`);
    }
    return CELL_SYMBOLS[this.cells[y * this.width + x]!]!;
  }

  isScaffold(x: number, y: number): boolean {
    if (!this.inBounds(x, y)) {
      return false;
    }
    const code = this.cells[y * this.width + x]!;
    return code >= 1 && code <= 5;
  }

  private isIntersectionAt(x: number, y: number): boolean {
    return (
      this.isScaffold(x, y) &&
      this.isScaffold(x - 1, y) &&
      this.isScaffold(x + 1, y) &&
      this.isScaffold(x, y - 1) &&
      this.isScaffold(x, y + 1)
    );
  }
}
