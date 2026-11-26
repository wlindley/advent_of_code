export const DIR_N = 0 as const;
export const DIR_E = 1 as const;
export const DIR_S = 2 as const;
export const DIR_W = 3 as const;

export type BeamDirection = typeof DIR_N | typeof DIR_E | typeof DIR_S | typeof DIR_W;

export const BEAM_DIRECTIONS: readonly BeamDirection[] = Object.freeze([DIR_N, DIR_E, DIR_S, DIR_W]);
export const DIR_LABELS = Object.freeze(['N', 'E', 'S', 'W'] as const);
export const DIR_DR = new Int8Array([-1, 0, 1, 0]);
export const DIR_DC = new Int8Array([0, 1, 0, -1]);

export const TILE_EMPTY = 0 as const;
export const TILE_SLASH = 1 as const;
export const TILE_BACKSLASH = 2 as const;
export const TILE_SPLIT_V = 3 as const;
export const TILE_SPLIT_H = 4 as const;

export type TileCode = 0 | 1 | 2 | 3 | 4;
export type TileChar = '.' | '/' | '\\' | '|' | '-';

const TILE_CHARS: readonly TileChar[] = Object.freeze(['.', '/', '\\', '|', '-']);
const CHAR_TO_CODE = new Map<string, TileCode>([
  ['.', TILE_EMPTY],
  ['/', TILE_SLASH],
  ['\\', TILE_BACKSLASH],
  ['|', TILE_SPLIT_V],
  ['-', TILE_SPLIT_H],
]);

/** Outgoing direction bitmasks indexed by `(tileCode << 2) | dir` (N=1, E=2, S=4, W=8). */
export const OUTGOING_MASKS = new Uint8Array([
  1, 2, 4, 8, // '.'
  2, 1, 8, 4, // '/'
  8, 4, 2, 1, // '\'
  1, 5, 4, 5, // '|'
  10, 2, 10, 8, // '-'
]);

/** Maps a single-bit direction mask (1, 2, 4, 8) to its `BeamDirection` index (0..3). */
export const MASK_TO_DIR = new Uint8Array([0, 0, 1, 0, 2, 0, 0, 0, 3]);

export interface BeamState {
  readonly row: number;
  readonly col: number;
  readonly dir: BeamDirection;
}

export interface EdgeBeamScore {
  readonly entry: BeamState;
  readonly energizedCount: number;
}

/** Encodes a contraption tile character into its compact `TileCode`. */
export function encodeTileChar(ch: string): TileCode {
  const code = CHAR_TO_CODE.get(ch);
  if (code === undefined) {
    throw new RangeError(`Invalid contraption tile character: ${JSON.stringify(ch)}`);
  }
  return code;
}

/** Decodes a compact `TileCode` back into its contraption tile character. */
export function decodeTileCode(code: TileCode): TileChar {
  return TILE_CHARS[code]!;
}

/** Returns the outgoing direction bitmask when a beam traveling `dir` hits `tileCode`. */
export function outgoingMask(tileCode: TileCode, dir: BeamDirection): number {
  return OUTGOING_MASKS[(tileCode << 2) | dir]!;
}

/** Creates an immutable `BeamState` after validating non-negative integer coordinates. */
export function createBeamState(row: number, col: number, dir: BeamDirection): BeamState {
  if (!Number.isInteger(row) || row < 0 || !Number.isInteger(col) || col < 0) {
    throw new RangeError(`Beam coordinates must be non-negative integers, got (${row}, ${col})`);
  }
  return Object.freeze({ row, col, dir });
}
