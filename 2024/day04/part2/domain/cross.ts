export interface GridCoord {
  readonly row: number;
  readonly col: number;
}

export interface CrossDiagonal {
  readonly from: GridCoord;
  readonly to: GridCoord;
}

export const XMAS_ORIENTATIONS = Object.freeze(['M_LEFT', 'M_RIGHT', 'M_TOP', 'M_BOTTOM'] as const);
export type XMasOrientation = (typeof XMAS_ORIENTATIONS)[number];

type CornerKey = 'nw' | 'ne' | 'sw' | 'se';
type DiagonalCornerPair = readonly [CornerKey, CornerKey];

const ORIENTATION_SET: ReadonlySet<string> = new Set(XMAS_ORIENTATIONS);

const DIAGONAL_CORNERS: Readonly<Record<XMasOrientation, readonly [DiagonalCornerPair, DiagonalCornerPair]>> =
  Object.freeze({
    M_LEFT: Object.freeze([Object.freeze(['nw', 'se'] as const), Object.freeze(['sw', 'ne'] as const)] as const),
    M_RIGHT: Object.freeze([Object.freeze(['ne', 'sw'] as const), Object.freeze(['se', 'nw'] as const)] as const),
    M_TOP: Object.freeze([Object.freeze(['nw', 'se'] as const), Object.freeze(['ne', 'sw'] as const)] as const),
    M_BOTTOM: Object.freeze([Object.freeze(['sw', 'ne'] as const), Object.freeze(['se', 'nw'] as const)] as const),
  });

function coord(row: number, col: number): GridCoord {
  return Object.freeze({ row, col });
}

function isMasPair(a: string, b: string): boolean {
  return (a === 'M' && b === 'S') || (a === 'S' && b === 'M');
}

/** Returns true iff `value` is one of the four canonical `XMasOrientation` tags. */
export function isXMasOrientation(value: string): value is XMasOrientation {
  return ORIENTATION_SET.has(value);
}

/** Classifies four diagonal corner characters (`nw, ne, sw, se`) around an `'A'` center. */
export function classifyXMasOrientation(
  nw: string,
  ne: string,
  sw: string,
  se: string,
): XMasOrientation | null {
  if (!isMasPair(nw, se) || !isMasPair(ne, sw)) return null;
  if (nw === 'M') return ne === 'M' ? 'M_TOP' : 'M_LEFT';
  return ne === 'M' ? 'M_RIGHT' : 'M_BOTTOM';
}

/** Immutable value object representing a 3x3 X-MAS cross anchored at `(centerRow, centerCol)`. */
export class XMasCross {
  readonly centerRow: number;
  readonly centerCol: number;
  readonly orientation: XMasOrientation;

  constructor(centerRow: number, centerCol: number, orientation: XMasOrientation) {
    if (!Number.isInteger(centerRow) || centerRow < 1) {
      throw new RangeError(`centerRow must be an integer >= 1, got ${centerRow}`);
    }
    if (!Number.isInteger(centerCol) || centerCol < 1) {
      throw new RangeError(`centerCol must be an integer >= 1, got ${centerCol}`);
    }
    if (!isXMasOrientation(orientation)) {
      throw new RangeError(`Invalid XMasOrientation: ${orientation}`);
    }
    this.centerRow = centerRow;
    this.centerCol = centerCol;
    this.orientation = orientation;
    Object.freeze(this);
  }

  get nw(): GridCoord {
    return coord(this.centerRow - 1, this.centerCol - 1);
  }

  get ne(): GridCoord {
    return coord(this.centerRow - 1, this.centerCol + 1);
  }

  get sw(): GridCoord {
    return coord(this.centerRow + 1, this.centerCol - 1);
  }

  get se(): GridCoord {
    return coord(this.centerRow + 1, this.centerCol + 1);
  }

  get center(): GridCoord {
    return coord(this.centerRow, this.centerCol);
  }

  get cells(): readonly GridCoord[] {
    return Object.freeze([this.nw, this.ne, this.center, this.sw, this.se]);
  }

  get diagonals(): readonly [CrossDiagonal, CrossDiagonal] {
    const [d1, d2] = DIAGONAL_CORNERS[this.orientation];
    return Object.freeze([
      Object.freeze({ from: this[d1[0]], to: this[d1[1]] }),
      Object.freeze({ from: this[d2[0]], to: this[d2[1]] }),
    ] as const);
  }
}
