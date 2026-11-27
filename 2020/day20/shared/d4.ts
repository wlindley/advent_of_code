export type D4Orientation = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const D4_COUNT = 8;

type PullbackRule = readonly [number, number, number, number, number, number];

/**
 * Pullback coefficients [dr, dc, ro, er, ec, co] mapping destination (r, c)
 * to source (sr, sc) = (dr*r + dc*c + ro*last, er*r + ec*c + co*last).
 */
const D4_PULLBACK: readonly [
  PullbackRule,
  PullbackRule,
  PullbackRule,
  PullbackRule,
  PullbackRule,
  PullbackRule,
  PullbackRule,
  PullbackRule,
] = [
  [1, 0, 0, 0, 1, 0],   // 0: Identity
  [0, -1, 1, 1, 0, 0],  // 1: Rotate 90 CW
  [-1, 0, 1, 0, -1, 1], // 2: Rotate 180
  [0, 1, 0, -1, 0, 1],  // 3: Rotate 270 CW
  [1, 0, 0, 0, -1, 1],  // 4: Flip horizontal
  [0, -1, 1, -1, 0, 1], // 5: Anti-diagonal transpose
  [-1, 0, 1, 0, 1, 0],  // 6: Flip vertical
  [0, 1, 0, 1, 0, 0],   // 7: Main-diagonal transpose
];

/** Flat source index in a `side x side` grid for destination `(r, c)` under `ori`. */
export function d4SourceIndex(ori: D4Orientation, r: number, c: number, side: number): number {
  const last = side - 1;
  const [dr, dc, ro, er, ec, co] = D4_PULLBACK[ori];
  const sr = dr * r + dc * c + ro * last;
  const sc = er * r + ec * c + co * last;
  return sr * side + sc;
}

/** Reverses the lowest `width` bits of `mask` (sign-safe for `width <= 30`). */
export function reverseBits(mask: number, width: number): number {
  let out = 0;
  let cur = mask;
  for (let i = 0; i < width; i += 1) {
    out = (out << 1) | (cur & 1);
    cur >>>= 1;
  }
  return out;
}

/** Orientation-invariant canonical edge signature: min(mask, reverseBits(mask, width)). */
export function canonicalEdge(mask: number, width: number): number {
  const rev = reverseBits(mask, width);
  return mask < rev ? mask : rev;
}

/** Dense square binary/byte bitmap backed by a private unfrozen Uint8Array. */
export class SquareBitmap {
  readonly side: number;
  private readonly pixels: Uint8Array;

  constructor(side: number, pixels: Uint8Array) {
    if (!Number.isInteger(side) || side < 1 || pixels.length !== side * side) {
      throw new RangeError(`Invalid SquareBitmap dimensions: side=${side}, len=${pixels.length}`);
    }
    this.side = side;
    this.pixels = pixels;
  }

  at(r: number, c: number): number {
    return this.pixels[r * this.side + c]!;
  }

  atIndex(index: number): number {
    return this.pixels[index]!;
  }
}

/** Returns a new SquareBitmap transformed by the given D4 dihedral orientation. */
export function transformSquare(bitmap: SquareBitmap, ori: D4Orientation): SquareBitmap {
  const { side } = bitmap;
  const out = new Uint8Array(side * side);
  for (let r = 0; r < side; r += 1) {
    const rowOffset = r * side;
    for (let c = 0; c < side; c += 1) {
      out[rowOffset + c] = bitmap.atIndex(d4SourceIndex(ori, r, c, side));
    }
  }
  return new SquareBitmap(side, out);
}
