import { D4_COUNT, type D4Orientation, d4SourceIndex, type SquareBitmap } from './d4';

/** Precomputed directional border bitmasks for a single tile in one D4 orientation. */
export interface TileOrientation {
  readonly tileIndex: number;
  readonly tileId: number;
  readonly ori: D4Orientation;
  /** Row 0 scanned L -> R. */
  readonly top: number;
  /** Col side - 1 scanned T -> B. */
  readonly right: number;
  /** Row side - 1 scanned L -> R. */
  readonly bottom: number;
  /** Col 0 scanned T -> B. */
  readonly left: number;
}

function encodeEdge(
  bitmap: SquareBitmap,
  ori: D4Orientation,
  fixed: number,
  isRow: boolean,
): number {
  const { side } = bitmap;
  let mask = 0;
  for (let i = 0; i < side; i += 1) {
    const r = isRow ? fixed : i;
    const c = isRow ? i : fixed;
    mask = (mask << 1) | bitmap.atIndex(d4SourceIndex(ori, r, c, side));
  }
  return mask;
}

function buildOrientation(
  tileIndex: number,
  tileId: number,
  bitmap: SquareBitmap,
  ori: D4Orientation,
): TileOrientation {
  const last = bitmap.side - 1;
  return {
    tileIndex,
    tileId,
    ori,
    top: encodeEdge(bitmap, ori, 0, true),
    right: encodeEdge(bitmap, ori, last, false),
    bottom: encodeEdge(bitmap, ori, last, true),
    left: encodeEdge(bitmap, ori, 0, false),
  };
}

/** Immutable camera-array tile with precomputed D4 border signatures. */
export class Tile {
  readonly tileIndex: number;
  readonly id: number;
  readonly bitmap: SquareBitmap;
  readonly orientations: readonly TileOrientation[];

  constructor(tileIndex: number, id: number, bitmap: SquareBitmap) {
    this.tileIndex = tileIndex;
    this.id = id;
    this.bitmap = bitmap;
    const list: TileOrientation[] = [];
    for (let o = 0; o < D4_COUNT; o += 1) {
      list.push(buildOrientation(tileIndex, id, bitmap, o as D4Orientation));
    }
    this.orientations = list;
  }

  orientation(ori: D4Orientation): TileOrientation {
    return this.orientations[ori]!;
  }

  pixelAt(ori: D4Orientation, r: number, c: number): number {
    return this.bitmap.atIndex(d4SourceIndex(ori, r, c, this.bitmap.side));
  }
}
