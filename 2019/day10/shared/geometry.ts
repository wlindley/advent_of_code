/** Reduced coprime ray direction in screen coordinates (+x right, +y down). */
export interface RayDirection {
  readonly rx: number;
  readonly ry: number;
}

/** Coprime ray direction paired with its positive integer lattice step count. */
export interface ReducedRay {
  readonly ray: RayDirection;
  readonly step: number;
}

function assertSafeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${label} must be a safe integer, got ${value}`);
  }
}

function assertNonNegativeSafeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative safe integer, got ${value}`);
  }
}

/** Euclidean greatest common divisor of two safe integers (`gcdInt(0, 0) === 0`). */
export function gcdInt(a: number, b: number): number {
  assertSafeInteger(a, 'a');
  assertSafeInteger(b, 'b');
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const next = x % y;
    x = y;
    y = next;
  }
  return x;
}

/** Reduces a non-zero integer displacement `(dx, dy)` to a coprime ray and positive step count. */
export function reduceRay(dx: number, dy: number): ReducedRay {
  assertSafeInteger(dx, 'dx');
  assertSafeInteger(dy, 'dy');
  if (dx === 0 && dy === 0) {
    throw new RangeError('Displacement (0, 0) has no direction');
  }
  const step = gcdInt(dx, dy);
  const ray = Object.freeze({ rx: dx / step + 0, ry: dy / step + 0 });
  return Object.freeze({ ray, step });
}

/**
 * Classifies a ray into half-plane `0` (`[12 o'clock, 6 o'clock)`) or `1` (`[6 o'clock, 12 o'clock)`).
 */
export function rayHalfPlane(ray: RayDirection): 0 | 1 {
  return ray.rx > 0 || (ray.rx === 0 && ray.ry < 0) ? 0 : 1;
}

/**
 * Exact integer comparator ordering rays clockwise starting from straight up `(0, -1)`.
 */
export function compareRaysClockwise(a: RayDirection, b: RayDirection): number {
  const halfDiff = rayHalfPlane(a) - rayHalfPlane(b);
  if (halfDiff !== 0) return halfDiff;
  // Same open half-plane (< pi span): cross product sign orders clockwise around origin.
  return a.ry * b.rx - a.rx * b.ry + 0;
}

/** Immutable lattice point for an asteroid location `(x, y)`. */
export class AsteroidPoint {
  readonly x: number;
  readonly y: number;

  constructor(x: number, y: number) {
    assertNonNegativeSafeInteger(x, 'x');
    assertNonNegativeSafeInteger(y, 'y');
    this.x = x;
    this.y = y;
    Object.freeze(this);
  }

  /** Encodes coordinates as `x * 100 + y` per AoC Day 10 convention. */
  get coordinateCode(): number {
    return this.x * 100 + this.y;
  }
}
