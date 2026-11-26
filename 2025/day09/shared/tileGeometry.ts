const INT_TOKEN = /^-?\d+$/;

/** Immutable 2D integer tile coordinate using exact BigInt values. */
export class TilePoint {
  readonly x: bigint;
  readonly y: bigint;

  constructor(x: bigint, y: bigint) {
    this.x = x;
    this.y = y;
    Object.freeze(this);
  }

  equals(other: TilePoint): boolean {
    return this.x === other.x && this.y === other.y;
  }
}

/**
 * Axis-aligned inclusive tile rectangle defined solely by two corners.
 * Bounds and area are derived dynamically via getters to avoid redundant state.
 */
export class TileRect {
  readonly cornerA: TilePoint;
  readonly cornerB: TilePoint;

  constructor(cornerA: TilePoint, cornerB: TilePoint) {
    this.cornerA = cornerA;
    this.cornerB = cornerB;
    Object.freeze(this);
  }

  get minX(): bigint { return this.cornerA.x < this.cornerB.x ? this.cornerA.x : this.cornerB.x; }
  get maxX(): bigint { return this.cornerA.x > this.cornerB.x ? this.cornerA.x : this.cornerB.x; }
  get minY(): bigint { return this.cornerA.y < this.cornerB.y ? this.cornerA.y : this.cornerB.y; }
  get maxY(): bigint { return this.cornerA.y > this.cornerB.y ? this.cornerA.y : this.cornerB.y; }
  get width(): bigint { return this.maxX - this.minX + 1n; }
  get height(): bigint { return this.maxY - this.minY + 1n; }
  get area(): bigint { return this.width * this.height; }

  static bounding(points: readonly TilePoint[]): TileRect {
    if (points.length === 0) {
      throw new Error('Cannot compute bounding TileRect of an empty point list');
    }
    let minX = points[0]!.x;
    let maxX = minX;
    let minY = points[0]!.y;
    let maxY = minY;
    for (let i = 1; i < points.length; i++) {
      const p = points[i]!;
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    return new TileRect(new TilePoint(minX, minY), new TilePoint(maxX, maxY));
  }
}

/** Parses `x,y` lines while preserving exact vertex order (needed by Part 2). */
export function parseTilePoints(raw: string): readonly TilePoint[] {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new Error('Tile coordinate input cannot be empty');
  }
  const lines = trimmed.split(/\r?\n/);
  const points: TilePoint[] = [];
  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i]!.split(',');
    if (parts.length !== 2) {
      throw new Error(`Line ${i + 1}: expected "x,y", got ${parts.length} tokens`);
    }
    const [rawX, rawY] = parts as [string, string];
    if (!INT_TOKEN.test(rawX) || !INT_TOKEN.test(rawY)) {
      throw new Error(`Line ${i + 1}: coordinates must be strict integer tokens`);
    }
    points.push(new TilePoint(BigInt(rawX), BigInt(rawY)));
  }
  return Object.freeze(points);
}
