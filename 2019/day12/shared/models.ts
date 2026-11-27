/** Coordinate axis identifier for 3D moon simulation. */
export type AxisName = 'x' | 'y' | 'z';

/** Canonical ordered list of 3D axes. */
export const AXES: readonly [AxisName, AxisName, AxisName] = Object.freeze(['x', 'y', 'z'] as const);

/** Maximum absolute coordinate allowed in parsed initial moon positions. */
export const MAX_ABS_COORDINATE = 10_000_000;

/** Maximum number of moons permitted in a single MoonSystem. */
export const MAX_MOONS = 64;

const MOON_LINE_RE = /^<x=\s*(-?\d+)\s*,\s*y=\s*(-?\d+)\s*,\s*z=\s*(-?\d+)\s*>$/;

function assertSafeInt(value: number, label: string): number {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${label} must be a safe integer, got ${value}`);
  }
  return value;
}

function parseInitialCoord(raw: string, axis: AxisName): number {
  const n = Number(raw);
  if (!Number.isSafeInteger(n) || Math.abs(n) > MAX_ABS_COORDINATE) {
    throw new RangeError(`Initial ${axis} coordinate out of bounds [±${MAX_ABS_COORDINATE}]: ${raw}`);
  }
  return n;
}

function parseMoonLine(line: string, lineNumber: number): MoonState {
  const trimmed = line.trim();
  if (trimmed.length === 0) {
    throw new SyntaxError(`Blank line at moon entry ${lineNumber}`);
  }
  const match = MOON_LINE_RE.exec(trimmed);
  if (match === null) {
    throw new SyntaxError(`Invalid moon format at line ${lineNumber}: ${trimmed}`);
  }
  const x = parseInitialCoord(match[1]!, 'x');
  const y = parseInitialCoord(match[2]!, 'y');
  const z = parseInitialCoord(match[3]!, 'z');
  return new MoonState(new Vec3(x, y, z), Vec3.ZERO);
}

/** Immutable 3D integer vector value object. */
export class Vec3 {
  static readonly ZERO = new Vec3(0, 0, 0);

  readonly x: number;
  readonly y: number;
  readonly z: number;

  constructor(x: number, y: number, z: number) {
    this.x = assertSafeInt(x, 'x');
    this.y = assertSafeInt(y, 'y');
    this.z = assertSafeInt(z, 'z');
    Object.freeze(this);
  }

  /** Sum of absolute coordinate magnitudes. */
  get manhattanNorm(): number {
    return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z);
  }

  /** Returns the scalar component for the requested axis. */
  at(axis: AxisName): number {
    if (axis === 'x') return this.x;
    if (axis === 'y') return this.y;
    return this.z;
  }

  /** Checks exact component-wise equality with another vector. */
  equals(other: Vec3): boolean {
    return this.x === other.x && this.y === other.y && this.z === other.z;
  }
}

/** Immutable position/velocity pair for a single moon with derived energies. */
export class MoonState {
  readonly position: Vec3;
  readonly velocity: Vec3;

  constructor(position: Vec3, velocity: Vec3) {
    this.position = position;
    this.velocity = velocity;
    Object.freeze(this);
  }

  get potentialEnergy(): number { return this.position.manhattanNorm; }
  get kineticEnergy(): number { return this.velocity.manhattanNorm; }
  get totalEnergy(): number { return this.potentialEnergy * this.kineticEnergy; }

  equals(other: MoonState): boolean {
    return this.position.equals(other.position) && this.velocity.equals(other.velocity);
  }
}

/** Immutable collection of moons with fresh per-axis typed-array initializers. */
export class MoonSystem {
  readonly moons: readonly MoonState[];

  constructor(moons: readonly MoonState[]) {
    if (moons.length < 1 || moons.length > MAX_MOONS) {
      throw new RangeError(`Moon count must be in [1, ${MAX_MOONS}], got ${moons.length}`);
    }
    this.moons = Object.freeze([...moons]);
    Object.freeze(this);
  }

  get moonCount(): number { return this.moons.length; }

  get totalEnergy(): number {
    let sum = 0;
    for (let i = 0; i < this.moons.length; i += 1) {
      sum += this.moons[i]!.totalEnergy;
    }
    return sum;
  }

  /** Returns a fresh mutable Int32Array of initial positions along `axis`. */
  axisInitialPositions(axis: AxisName): Int32Array {
    const out = new Int32Array(this.moons.length);
    for (let i = 0; i < this.moons.length; i += 1) {
      out[i] = this.moons[i]!.position.at(axis);
    }
    return out;
  }

  /** Returns a fresh mutable Int32Array of initial velocities along `axis`. */
  axisInitialVelocities(axis: AxisName): Int32Array {
    const out = new Int32Array(this.moons.length);
    for (let i = 0; i < this.moons.length; i += 1) {
      out[i] = this.moons[i]!.velocity.at(axis);
    }
    return out;
  }

  /** Parses `<x=..., y=..., z=...>` lines into a validated MoonSystem. */
  static parse(raw: string): MoonSystem {
    const normalized = raw.replace(/\r\n?/g, '\n').trim();
    if (normalized.length === 0) {
      throw new SyntaxError('Moon input cannot be empty');
    }
    const lines = normalized.split('\n');
    if (lines.length > MAX_MOONS) {
      throw new RangeError(`Moon count must be in [1, ${MAX_MOONS}], got ${lines.length}`);
    }
    const moons: MoonState[] = [];
    for (let i = 0; i < lines.length; i += 1) {
      moons.push(parseMoonLine(lines[i]!, i + 1));
    }
    return new MoonSystem(moons);
  }
}
