import { AsteroidPoint } from './geometry';

function assertPositiveSafeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new RangeError(`${label} must be a positive safe integer, got ${value}`);
  }
}

function assertStrictlyRowMajor(prev: AsteroidPoint, curr: AsteroidPoint): void {
  if (curr.y < prev.y || (curr.y === prev.y && curr.x <= prev.x)) {
    throw new RangeError(
      `Asteroids must be in strictly ascending row-major order, got (${curr.x},${curr.y}) after (${prev.x},${prev.y})`,
    );
  }
}

function validateAsteroids(width: number, height: number, asteroids: readonly AsteroidPoint[]): void {
  if (asteroids.length === 0) {
    throw new RangeError('Asteroid map must contain at least one asteroid');
  }
  for (let i = 0; i < asteroids.length; i += 1) {
    const point = asteroids[i]!;
    if (point.x >= width || point.y >= height) {
      throw new RangeError(`Asteroid (${point.x},${point.y}) is out of bounds for ${width}x${height}`);
    }
    if (i > 0) {
      assertStrictlyRowMajor(asteroids[i - 1]!, point);
    }
  }
}

function parseRow(row: string, y: number, width: number, asteroids: AsteroidPoint[]): void {
  if (row.length !== width) {
    throw new RangeError(`Expected row ${y} to have length ${width}, got ${row.length}`);
  }
  for (let x = 0; x < width; x += 1) {
    const ch = row[x]!;
    if (ch === '#') {
      asteroids.push(new AsteroidPoint(x, y));
    } else if (ch !== '.') {
      throw new RangeError(`Invalid map character '${ch}' at (${x},${y})`);
    }
  }
}

/** Immutable asteroid field grid storing asteroids in strictly ascending row-major `(y, x)` order. */
export class AsteroidMap {
  readonly width: number;
  readonly height: number;
  readonly asteroids: readonly AsteroidPoint[];

  constructor(width: number, height: number, asteroids: readonly AsteroidPoint[]) {
    assertPositiveSafeInteger(width, 'width');
    assertPositiveSafeInteger(height, 'height');
    validateAsteroids(width, height, asteroids);
    this.width = width;
    this.height = height;
    this.asteroids = Object.freeze([...asteroids]);
    Object.freeze(this);
  }

  /** Total number of asteroids in the field. */
  get asteroidCount(): number {
    return this.asteroids.length;
  }

  /** Returns the asteroid at `index` after bounds checking. */
  asteroidAt(index: number): AsteroidPoint {
    if (!Number.isInteger(index) || index < 0 || index >= this.asteroids.length) {
      throw new RangeError(`Asteroid index ${index} out of bounds [0, ${this.asteroids.length - 1}]`);
    }
    return this.asteroids[index]!;
  }

  /** Parses a rectangular `.` / `#` asteroid field string into an `AsteroidMap`. */
  static parse(raw: string): AsteroidMap {
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
      throw new RangeError('Asteroid map input must not be empty');
    }
    const rows = trimmed.split(/\r?\n/);
    const height = rows.length;
    const width = rows[0]!.length;
    const asteroids: AsteroidPoint[] = [];
    for (let y = 0; y < height; y += 1) {
      parseRow(rows[y]!, y, width, asteroids);
    }
    return new AsteroidMap(width, height, asteroids);
  }
}
