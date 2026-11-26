export const SOURCE_X = 500;
export const SOURCE_Y = 0;

const POINT_RE = /^(-?\d+),(-?\d+)$/;

/** Immutable 2D integer cave coordinate with non-negative depth `y`. */
export class CavePoint {
  readonly x: number;
  readonly y: number;

  constructor(x: number, y: number) {
    if (!Number.isSafeInteger(x)) {
      throw new RangeError(`CavePoint x must be a safe integer, got ${x}`);
    }
    if (!Number.isSafeInteger(y) || y < 0) {
      throw new RangeError(`CavePoint y must be a non-negative safe integer, got ${y}`);
    }
    this.x = x;
    this.y = y;
    Object.freeze(this);
  }
}

/** Immutable polyline of consecutive axis-aligned rock vertices. */
export class RockPath {
  readonly points: readonly CavePoint[];

  constructor(points: readonly CavePoint[]) {
    if (points.length < 1) {
      throw new RangeError('RockPath must contain at least one point');
    }
    for (let i = 1; i < points.length; i += 1) {
      const a = points[i - 1]!;
      const b = points[i]!;
      if (a.x !== b.x && a.y !== b.y) {
        throw new Error(`Segment (${a.x},${a.y}) -> (${b.x},${b.y}) is not axis-aligned`);
      }
    }
    this.points = Object.freeze([...points]);
    Object.freeze(this);
  }

  get segmentCount(): number {
    return this.points.length - 1;
  }
}

/** Immutable parsed cave scan containing one or more rock paths. */
export class CaveScan {
  readonly paths: readonly RockPath[];

  constructor(paths: readonly RockPath[]) {
    if (paths.length < 1) {
      throw new RangeError('CaveScan must contain at least one rock path');
    }
    this.paths = Object.freeze([...paths]);
    Object.freeze(this);
  }

  get minX(): number {
    let min = this.paths[0]!.points[0]!.x;
    for (const path of this.paths) {
      for (const p of path.points) if (p.x < min) min = p.x;
    }
    return min;
  }

  get maxX(): number {
    let max = this.paths[0]!.points[0]!.x;
    for (const path of this.paths) {
      for (const p of path.points) if (p.x > max) max = p.x;
    }
    return max;
  }

  get maxY(): number {
    let max = this.paths[0]!.points[0]!.y;
    for (const path of this.paths) {
      for (const p of path.points) if (p.y > max) max = p.y;
    }
    return max;
  }

  get segmentCount(): number {
    let total = 0;
    for (const path of this.paths) total += path.segmentCount;
    return total;
  }
}

function parsePoint(token: string): CavePoint {
  const match = POINT_RE.exec(token);
  if (!match) {
    throw new Error(`Invalid cave coordinate token: "${token}"`);
  }
  return new CavePoint(Number(match[1]), Number(match[2]));
}

function parseRockPath(line: string): RockPath {
  const points = line.split(' -> ').map(parsePoint);
  return new RockPath(points);
}

/** Parses AoC cave rock scan text into an immutable `CaveScan`. */
export function parseCaveScan(raw: string): CaveScan {
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0);
  if (lines.length === 0) {
    throw new Error('Cave scan input must contain at least one rock path');
  }
  return new CaveScan(lines.map(parseRockPath));
}
