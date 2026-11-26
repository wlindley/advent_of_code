import { euclideanMod } from '../../../shared/core';

export type Quadrant = 0 | 1 | 2 | 3;
export type QuadrantCounts = readonly [number, number, number, number];

export interface GridPoint {
  readonly x: number;
  readonly y: number;
}

/** Validates that a numeric parameter is a non-negative safe integer. */
export function assertNonNegativeSafeInt(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative safe integer, got ${value}`);
  }
}

function assertSignedSafeInt(value: number, label: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${label} must be a safe integer, got ${value}`);
  }
}

function assertOddPositiveSafeInt(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value <= 0 || value % 2 === 0) {
    throw new RangeError(`${label} must be an odd positive safe integer, got ${value}`);
  }
}

/** Computes wrapped 1D coordinate after `seconds` steps on a ring of length `size`. */
export function stepCoordinate(pos: number, vel: number, size: number, seconds: number): number {
  assertNonNegativeSafeInt(seconds, 'seconds');
  return euclideanMod(euclideanMod(pos, size) + euclideanMod(vel, size) * (seconds % size), size);
}

/** Immutable odd-dimensioned toroidal grid geometry for Restroom Redoubt. */
export class TorusSpace {
  readonly width: number;
  readonly height: number;

  constructor(width: number, height: number) {
    assertOddPositiveSafeInt(width, 'width');
    assertOddPositiveSafeInt(height, 'height');
    if (!Number.isSafeInteger(width * height)) {
      throw new RangeError(`space area must be a safe integer, got ${width}x${height}`);
    }
    this.width = width;
    this.height = height;
    Object.freeze(this);
  }

  get midX(): number {
    return (this.width - 1) / 2;
  }

  get midY(): number {
    return (this.height - 1) / 2;
  }

  get area(): number {
    return this.width * this.height;
  }

  cellIndex(x: number, y: number): number {
    assertNonNegativeSafeInt(x, 'x');
    assertNonNegativeSafeInt(y, 'y');
    if (x >= this.width || y >= this.height) {
      throw new RangeError(`cell (${x}, ${y}) out of bounds for ${this.width}x${this.height}`);
    }
    return y * this.width + x;
  }

  quadrantOf(x: number, y: number): Quadrant | null {
    this.cellIndex(x, y);
    if (x === this.midX || y === this.midY) return null;
    const right = x > this.midX ? 1 : 0;
    const bottom = y > this.midY ? 2 : 0;
    return (right | bottom) as Quadrant;
  }
}

export const DEFAULT_REDOUBT_SPACE = new TorusSpace(101, 103);
export const EXAMPLE_REDOUBT_SPACE = new TorusSpace(11, 7);

/** Immutable robot with initial position `(x, y)` and velocity `(vx, vy)`. */
export class Robot {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;

  constructor(x: number, y: number, vx: number, vy: number) {
    assertNonNegativeSafeInt(x, 'x');
    assertNonNegativeSafeInt(y, 'y');
    assertSignedSafeInt(vx, 'vx');
    assertSignedSafeInt(vy, 'vy');
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    Object.freeze(this);
  }

  positionAt(space: TorusSpace, seconds: number): GridPoint {
    return Object.freeze({
      x: stepCoordinate(this.x, this.vx, space.width, seconds),
      y: stepCoordinate(this.y, this.vy, space.height, seconds),
    });
  }
}
