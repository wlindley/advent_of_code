const HAILSTONE_PATTERN =
  /^(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*@\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)$/;
const NORMALIZE_SCALE = 1_000_000n;
const NORMALIZE_DIVISOR = 1_000_000;

/** Immutable 3D BigInt vector for exact hailstone positions and velocities. */
export class Vec3 {
  readonly x: bigint;
  readonly y: bigint;
  readonly z: bigint;

  constructor(x: bigint, y: bigint, z: bigint) {
    this.x = x;
    this.y = y;
    this.z = z;
    Object.freeze(this);
  }

  sub(other: Vec3): Vec3 {
    return new Vec3(this.x - other.x, this.y - other.y, this.z - other.z);
  }

  cross(other: Vec3): Vec3 {
    return new Vec3(
      this.y * other.z - this.z * other.y,
      this.z * other.x - this.x * other.z,
      this.x * other.y - this.y * other.x,
    );
  }

  equals(other: Vec3): boolean {
    return this.x === other.x && this.y === other.y && this.z === other.z;
  }
}

/** Immutable hailstone trajectory defined by an initial 3D position and constant velocity. */
export class Hailstone {
  readonly id: number;
  readonly position: Vec3;
  readonly velocity: Vec3;

  constructor(id: number, position: Vec3, velocity: Vec3) {
    this.id = id;
    this.position = position;
    this.velocity = velocity;
    Object.freeze(this);
  }
}

function assertPositiveDenominator(den: bigint): void {
  if (den <= 0n) {
    throw new RangeError(`Denominator must be positive, got ${den}`);
  }
}

/** Closed square XY test region `[min, max] x [min, max]` with exact BigInt ratio checks. */
export class TestArea {
  readonly min: bigint;
  readonly max: bigint;

  constructor(min: bigint, max: bigint) {
    if (min >= max) {
      throw new RangeError(`TestArea min (${min}) must be strictly less than max (${max})`);
    }
    this.min = min;
    this.max = max;
    Object.freeze(this);
  }

  get span(): bigint {
    return this.max - this.min;
  }

  containsRatio(xNum: bigint, yNum: bigint, den: bigint): boolean {
    assertPositiveDenominator(den);
    const minScaled = this.min * den;
    const maxScaled = this.max * den;
    return minScaled <= xNum && xNum <= maxScaled && minScaled <= yNum && yNum <= maxScaled;
  }

  normalizeRatio(num: bigint, den: bigint): number {
    assertPositiveDenominator(den);
    const scaled = ((num - this.min * den) * NORMALIZE_SCALE) / (this.span * den);
    return Number(scaled) / NORMALIZE_DIVISOR;
  }
}

function parseHailstoneLine(id: number, rawLine: string, lineNumber: number): Hailstone {
  const match = HAILSTONE_PATTERN.exec(rawLine.trim());
  if (!match) {
    throw new Error(`Invalid hailstone at line ${lineNumber}: ${rawLine}`);
  }
  const pos = new Vec3(BigInt(match[1]!), BigInt(match[2]!), BigInt(match[3]!));
  const vel = new Vec3(BigInt(match[4]!), BigInt(match[5]!), BigInt(match[6]!));
  return new Hailstone(id, pos, vel);
}

/** Parses AoC 2023 Day 24 hailstone lines (`px, py, pz @ vx, vy, vz`). */
export function parseHailstones(raw: string): readonly Hailstone[] {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new Error('Hailstone input cannot be empty');
  }
  const lines = trimmed.split(/\r?\n/);
  const stones: Hailstone[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]!.trim();
    if (line.length === 0) continue;
    stones.push(parseHailstoneLine(stones.length, line, i + 1));
  }
  return Object.freeze(stones);
}
