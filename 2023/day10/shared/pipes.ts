/** North direction bitmask (matches DIRS_4[0]). */
export const DIR_N = 1 as const;
/** East direction bitmask (matches DIRS_4[1]). */
export const DIR_E = 2 as const;
/** South direction bitmask (matches DIRS_4[2]). */
export const DIR_S = 4 as const;
/** West direction bitmask (matches DIRS_4[3]). */
export const DIR_W = 8 as const;

export type DirBit = typeof DIR_N | typeof DIR_E | typeof DIR_S | typeof DIR_W;
export const DIR_BITS: readonly DirBit[] = Object.freeze([DIR_N, DIR_E, DIR_S, DIR_W]);

export type PipeShape = '|' | '-' | 'L' | 'J' | '7' | 'F';
export type PipeTile = PipeShape | '.';
export type PipeSymbol = PipeTile | 'S';

export interface GridCoord {
  readonly row: number;
  readonly col: number;
}

const VALID_SYMBOLS = new Set<string>(['|', '-', 'L', 'J', '7', 'F', '.', 'S']);

const OPPOSITE_BIT: Record<DirBit, DirBit> = {
  [DIR_N]: DIR_S,
  [DIR_E]: DIR_W,
  [DIR_S]: DIR_N,
  [DIR_W]: DIR_E,
};

const BIT_TO_INDEX: Record<DirBit, 0 | 1 | 2 | 3> = {
  [DIR_N]: 0,
  [DIR_E]: 1,
  [DIR_S]: 2,
  [DIR_W]: 3,
};

const PIPE_PORTS: Record<PipeShape, readonly [DirBit, DirBit]> = {
  '|': Object.freeze([DIR_N, DIR_S]),
  '-': Object.freeze([DIR_E, DIR_W]),
  L: Object.freeze([DIR_N, DIR_E]),
  J: Object.freeze([DIR_N, DIR_W]),
  '7': Object.freeze([DIR_S, DIR_W]),
  F: Object.freeze([DIR_S, DIR_E]),
};

const TILE_MASK: Record<PipeTile, number> = {
  '.': 0,
  '|': DIR_N | DIR_S,
  '-': DIR_E | DIR_W,
  L: DIR_N | DIR_E,
  J: DIR_N | DIR_W,
  '7': DIR_S | DIR_W,
  F: DIR_S | DIR_E,
};

const MASK_TO_SHAPE = new Map<number, PipeShape>([
  [DIR_N | DIR_S, '|'],
  [DIR_E | DIR_W, '-'],
  [DIR_N | DIR_E, 'L'],
  [DIR_N | DIR_W, 'J'],
  [DIR_S | DIR_W, '7'],
  [DIR_S | DIR_E, 'F'],
]);

/** Creates an immutable grid coordinate value object. */
export function createCoord(row: number, col: number): GridCoord {
  return Object.freeze({ row, col });
}

/** Validates and parses a single character from the pipe maze grid. */
export function parsePipeSymbol(ch: string, row: number, col: number): PipeSymbol {
  if (!VALID_SYMBOLS.has(ch)) {
    throw new Error(`Invalid pipe symbol "${ch}" at (${row}, ${col})`);
  }
  return ch as PipeSymbol;
}

/** Returns the reciprocal direction bit for a neighbor connection. */
export function oppositeBit(bit: DirBit): DirBit {
  return OPPOSITE_BIT[bit];
}

/** Maps a direction bit to its index in shared `DIRS_4` (N=0, E=1, S=2, W=3). */
export function bitToDirIndex(bit: DirBit): 0 | 1 | 2 | 3 {
  return BIT_TO_INDEX[bit];
}

/** Returns the 4-bit connection mask for a resolved pipe tile or ground `.`. */
export function tileMask(tile: PipeTile): number {
  return TILE_MASK[tile];
}

/** Returns the two endpoint direction bits of a pipe shape. */
export function pipePorts(shape: PipeShape): readonly [DirBit, DirBit] {
  return PIPE_PORTS[shape];
}

/** Converts a 2-bit orthogonal connection mask into its canonical pipe shape. */
export function maskToPipeShape(mask: number): PipeShape {
  const shape = MASK_TO_SHAPE.get(mask);
  if (!shape) {
    throw new Error(`Invalid pipe mask: ${mask}`);
  }
  return shape;
}

/** Given a pipe shape and one of its endpoint bits, returns the opposite endpoint bit. */
export function otherPort(shape: PipeShape, incomingBit: DirBit): DirBit {
  const [portA, portB] = PIPE_PORTS[shape];
  if (incomingBit === portA) return portB;
  if (incomingBit === portB) return portA;
  throw new Error(`Incoming bit ${incomingBit} is not a port of "${shape}"`);
}
