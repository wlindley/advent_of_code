/** Canonical cube color order matching AoC Day 2 bag definitions. */
export const CUBE_COLORS = Object.freeze(['red', 'green', 'blue'] as const);

/** Valid cube colors drawn from a bag. */
export type CubeColor = (typeof CUBE_COLORS)[number];

/** Type guard verifying whether a string is a valid {@link CubeColor}. */
export function isCubeColor(value: string): value is CubeColor {
  return (CUBE_COLORS as readonly string[]).includes(value);
}

function assertCubeCount(count: number, color: CubeColor): number {
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new RangeError(`${color} cube count must be a non-negative safe integer, got ${count}`);
  }
  return count;
}

/**
 * Immutable RGB cube count tuple representing either a single reveal,
 * a bag limit configuration, or the minimum required bag across reveals.
 */
export class CubeBag {
  static readonly EMPTY = new CubeBag(0, 0, 0);

  readonly red: number;
  readonly green: number;
  readonly blue: number;

  constructor(red: number, green: number, blue: number) {
    this.red = assertCubeCount(red, 'red');
    this.green = assertCubeCount(green, 'green');
    this.blue = assertCubeCount(blue, 'blue');
    Object.freeze(this);
  }

  /** Product of red, green, and blue cube counts (computed dynamically). */
  get power(): number {
    return this.red * this.green * this.blue;
  }

  /** Returns true when every color count is within `limits`. */
  fitsWithin(limits: CubeBag): boolean {
    return this.red <= limits.red && this.green <= limits.green && this.blue <= limits.blue;
  }

  /** Returns a new frozen bag taking the component-wise maximum of `this` and `other`. */
  maxWith(other: CubeBag): CubeBag {
    return new CubeBag(
      Math.max(this.red, other.red),
      Math.max(this.green, other.green),
      Math.max(this.blue, other.blue),
    );
  }

  /** Returns a frozen list of colors whose count exceeds `limits`. */
  exceededColors(limits: CubeBag): readonly CubeColor[] {
    return Object.freeze(CUBE_COLORS.filter((color) => this[color] > limits[color]));
  }
}
