import type { Bounds3D, Brick, BrickAxis, BrickSnapshot } from './brickSnapshot';

export const MAX_FOOTPRINT_AREA = 1_000_000;

function compareByElevation(a: Brick, b: Brick): number {
  return a.zMin !== b.zMin ? a.zMin - b.zMin : a.id - b.id;
}

function compareAscending(a: number, b: number): number {
  return a - b;
}

/** Immutable settled brick keyed by topological settled index `0..N-1`. */
export class SettledBrick {
  readonly index: number;
  readonly brick: Brick;
  readonly zMin: number;

  constructor(index: number, brick: Brick, zMin: number) {
    if (!Number.isSafeInteger(index) || index < 0) {
      throw new RangeError(`Settled index must be a non-negative safe integer, got ${index}`);
    }
    if (!Number.isSafeInteger(zMin) || zMin < 1 || zMin > brick.zMin) {
      throw new RangeError(`Settled zMin must satisfy 1 <= zMin <= ${brick.zMin}, got ${zMin}`);
    }
    this.index = index;
    this.brick = brick;
    this.zMin = zMin;
    Object.freeze(this);
  }

  get id(): number { return this.brick.id; }
  get xMin(): number { return this.brick.xMin; }
  get xMax(): number { return this.brick.xMax; }
  get yMin(): number { return this.brick.yMin; }
  get yMax(): number { return this.brick.yMax; }
  get zMax(): number { return this.zMin + this.brick.height - 1; }
  get initialZMin(): number { return this.brick.zMin; }
  get dropDistance(): number { return this.brick.zMin - this.zMin; }
  get height(): number { return this.brick.height; }
  get axis(): BrickAxis { return this.brick.axis; }
}

/** Immutable settled slab configuration and sorted per-brick supporter lists. */
export class SettledStack {
  readonly bricks: readonly SettledBrick[];
  readonly supportedBy: readonly (readonly number[])[];

  constructor(bricks: readonly SettledBrick[], supportedBy: readonly (readonly number[])[]) {
    if (bricks.length === 0) throw new Error('SettledStack must contain at least one brick');
    if (supportedBy.length !== bricks.length) {
      throw new Error('supportedBy length must match bricks length');
    }
    const frozenSupporters: (readonly number[])[] = [];
    for (let i = 0; i < supportedBy.length; i += 1) {
      frozenSupporters.push(Object.freeze(supportedBy[i]!.slice()));
    }
    this.bricks = Object.freeze(bricks.slice());
    this.supportedBy = Object.freeze(frozenSupporters);
    Object.freeze(this);
  }

  get length(): number { return this.bricks.length; }

  get bounds(): Bounds3D {
    const first = this.bricks[0]!;
    let xMin = first.xMin, xMax = first.xMax, yMin = first.yMin;
    let yMax = first.yMax, zMin = first.zMin, zMax = first.zMax;
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

  get totalDropDistance(): number {
    let total = 0;
    for (let i = 0; i < this.bricks.length; i += 1) total += this.bricks[i]!.dropDistance;
    return total;
  }
}

function findSupport(
  brick: Brick,
  xOff: number,
  yOff: number,
  width: number,
  heightMap: Int32Array,
  topBrick: Int32Array,
): { readonly maxH: number; readonly supporters: readonly number[] } {
  let maxH = 0;
  const seen = new Set<number>();
  for (let y = brick.yMin; y <= brick.yMax; y += 1) {
    const rowBase = (y - yOff) * width;
    for (let x = brick.xMin; x <= brick.xMax; x += 1) {
      const cell = rowBase + (x - xOff);
      const h = heightMap[cell]!;
      if (h > maxH) {
        maxH = h;
        seen.clear();
        seen.add(topBrick[cell]!);
      } else if (h === maxH && h > 0) {
        seen.add(topBrick[cell]!);
      }
    }
  }
  return { maxH, supporters: Object.freeze(Array.from(seen).sort(compareAscending)) };
}

function stampBrick(
  brick: Brick,
  settledIndex: number,
  settledZMax: number,
  xOff: number,
  yOff: number,
  width: number,
  heightMap: Int32Array,
  topBrick: Int32Array,
): void {
  for (let y = brick.yMin; y <= brick.yMax; y += 1) {
    const rowBase = (y - yOff) * width;
    for (let x = brick.xMin; x <= brick.xMax; x += 1) {
      const cell = rowBase + (x - xOff);
      heightMap[cell] = settledZMax;
      topBrick[cell] = settledIndex;
    }
  }
}

/** Drops airborne bricks vertically to rest via a dense XY height-map sweep. */
export function settleBricks(snapshot: BrickSnapshot): SettledStack {
  const bounds = snapshot.bounds;
  const width = bounds.xMax - bounds.xMin + 1;
  const area = width * (bounds.yMax - bounds.yMin + 1);
  if (area > MAX_FOOTPRINT_AREA) {
    throw new RangeError(`XY footprint area ${area} exceeds limit ${MAX_FOOTPRINT_AREA}`);
  }
  const heightMap = new Int32Array(area);
  const topBrick = new Int32Array(area).fill(-1);
  const sorted = snapshot.bricks.slice().sort(compareByElevation);
  const settled: SettledBrick[] = [];
  const supportedBy: (readonly number[])[] = [];
  for (let i = 0; i < sorted.length; i += 1) {
    const brick = sorted[i]!;
    const { maxH, supporters } = findSupport(brick, bounds.xMin, bounds.yMin, width, heightMap, topBrick);
    if (maxH >= brick.zMin) {
      throw new Error(`Brick ${brick.id} overlaps settled support at z=${maxH}`);
    }
    const sb = new SettledBrick(i, brick, maxH + 1);
    settled.push(sb);
    supportedBy.push(supporters);
    stampBrick(brick, i, sb.zMax, bounds.xMin, bounds.yMin, width, heightMap, topBrick);
  }
  return new SettledStack(settled, supportedBy);
}
