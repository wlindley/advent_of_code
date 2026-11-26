import { SOURCE_X, type CaveScan } from './caveScan';

/** Immutable bounding box for cave rasterization and sand simulation. */
export class CaveBounds {
  readonly minX: number;
  readonly maxX: number;
  readonly maxY: number;
  readonly floorY: number | null;

  constructor(minX: number, maxX: number, maxY: number, floorY: number | null) {
    if (!Number.isSafeInteger(minX) || !Number.isSafeInteger(maxX) || minX > SOURCE_X || maxX < SOURCE_X) {
      throw new RangeError(`CaveBounds x range [${minX}, ${maxX}] must be safe integers containing ${SOURCE_X}`);
    }
    if (!Number.isSafeInteger(maxY) || maxY < 0) {
      throw new RangeError(`CaveBounds maxY must be a non-negative safe integer, got ${maxY}`);
    }
    if (floorY !== null && (!Number.isSafeInteger(floorY) || floorY < 1 || floorY > maxY)) {
      throw new RangeError(`CaveBounds floorY must be null or in [1, ${maxY}], got ${floorY}`);
    }
    this.minX = minX;
    this.maxX = maxX;
    this.maxY = maxY;
    this.floorY = floorY;
    Object.freeze(this);
  }

  get width(): number {
    return this.maxX - this.minX + 1;
  }

  get height(): number {
    return this.maxY + 1;
  }

  get cellCount(): number {
    return this.width * this.height;
  }

  contains(x: number, y: number): boolean {
    return Number.isSafeInteger(x) && Number.isSafeInteger(y) &&
      x >= this.minX && x <= this.maxX && y >= 0 && y <= this.maxY;
  }
}

/** Strategy defining simulation bounding box and abyss-escape condition. */
export interface CaveBoundaryPolicy {
  readonly label: string;
  computeBounds(scan: CaveScan): CaveBounds;
  isEscape(y: number, bounds: CaveBounds): boolean;
}
