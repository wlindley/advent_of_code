export type BrickAxis = 'x' | 'y' | 'z' | 'cube';

export interface Bounds3D {
  readonly xMin: number;
  readonly xMax: number;
  readonly yMin: number;
  readonly yMax: number;
  readonly zMin: number;
  readonly zMax: number;
}

const BRICK_LINE_PATTERN = /^(-?\d+),(-?\d+),(-?\d+)~(-?\d+),(-?\d+),(-?\d+)$/;

function assertSafeInt(value: number, label: string): number {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${label} must be a safe integer, got ${value}`);
  }
  return value;
}

/** Immutable axis-aligned 3D sand slab with normalized coordinate bounds. */
export class Brick {
  readonly id: number;
  readonly xMin: number;
  readonly xMax: number;
  readonly yMin: number;
  readonly yMax: number;
  readonly zMin: number;
  readonly zMax: number;

  constructor(id: number, x1: number, y1: number, z1: number, x2: number, y2: number, z2: number) {
    if (!Number.isSafeInteger(id) || id < 0) {
      throw new RangeError(`Brick id must be a non-negative safe integer, got ${id}`);
    }
    const ax = assertSafeInt(x1, 'x1');
    const ay = assertSafeInt(y1, 'y1');
    const az = assertSafeInt(z1, 'z1');
    const bx = assertSafeInt(x2, 'x2');
    const by = assertSafeInt(y2, 'y2');
    const bz = assertSafeInt(z2, 'z2');
    this.id = id;
    this.xMin = Math.min(ax, bx);
    this.xMax = Math.max(ax, bx);
    this.yMin = Math.min(ay, by);
    this.yMax = Math.max(ay, by);
    this.zMin = Math.min(az, bz);
    this.zMax = Math.max(az, bz);
    if (this.zMin < 1) {
      throw new RangeError(`Brick ${id} zMin must be >= 1, got ${this.zMin}`);
    }
    const variedAxes =
      (this.xMin !== this.xMax ? 1 : 0) +
      (this.yMin !== this.yMax ? 1 : 0) +
      (this.zMin !== this.zMax ? 1 : 0);
    if (variedAxes > 1) {
      throw new Error(`Brick ${id} must be axis-aligned (at most 1 varying axis)`);
    }
    Object.freeze(this);
  }

  get height(): number {
    return this.zMax - this.zMin + 1;
  }

  get cellCount(): number {
    return (this.xMax - this.xMin + 1) * (this.yMax - this.yMin + 1) * this.height;
  }

  get axis(): BrickAxis {
    if (this.xMin !== this.xMax) return 'x';
    if (this.yMin !== this.yMax) return 'y';
    if (this.zMin !== this.zMax) return 'z';
    return 'cube';
  }
}

/** Immutable collection of initial airborne bricks with unique ids. */
export class BrickSnapshot {
  readonly bricks: readonly Brick[];

  constructor(bricks: readonly Brick[]) {
    if (bricks.length === 0) {
      throw new Error('BrickSnapshot must contain at least one brick');
    }
    const seenIds = new Set<number>();
    for (let i = 0; i < bricks.length; i += 1) {
      const id = bricks[i]!.id;
      if (seenIds.has(id)) {
        throw new Error(`Duplicate brick id ${id}`);
      }
      seenIds.add(id);
    }
    this.bricks = Object.freeze(bricks.slice());
    Object.freeze(this);
  }

  get length(): number {
    return this.bricks.length;
  }

  get bounds(): Bounds3D {
    const first = this.bricks[0]!;
    let xMin = first.xMin;
    let xMax = first.xMax;
    let yMin = first.yMin;
    let yMax = first.yMax;
    let zMin = first.zMin;
    let zMax = first.zMax;
    for (let i = 1; i < this.bricks.length; i += 1) {
      const b = this.bricks[i]!;
      xMin = Math.min(xMin, b.xMin);
      xMax = Math.max(xMax, b.xMax);
      yMin = Math.min(yMin, b.yMin);
      yMax = Math.max(yMax, b.yMax);
      zMin = Math.min(zMin, b.zMin);
      zMax = Math.max(zMax, b.zMax);
    }
    return Object.freeze({ xMin, xMax, yMin, yMax, zMin, zMax });
  }
}

function parseBrickLine(line: string, index: number): Brick {
  const match = BRICK_LINE_PATTERN.exec(line);
  if (!match) {
    throw new Error(`Invalid brick format on line ${index + 1}: ${JSON.stringify(line)}`);
  }
  return new Brick(
    index,
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6]),
  );
}

/** Parses `x1,y1,z1~x2,y2,z2` lines after stripping only trailing line endings. */
export function parseBrickSnapshot(raw: string): BrickSnapshot {
  const stripped = raw.replace(/(?:\r?\n)+$/, '');
  const lines = stripped.split(/\r?\n/);
  const bricks: Brick[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    bricks.push(parseBrickLine(lines[i]!, i));
  }
  return new BrickSnapshot(bricks);
}
