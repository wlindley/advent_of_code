/** ASCII byte code for empty space (`.`). */
export const CELL_EMPTY = 46 as const;
/** ASCII byte code for a stationary cube-shaped rock (`#`). */
export const CELL_CUBE = 35 as const;
/** ASCII byte code for a rolling rounded rock (`O`). */
export const CELL_ROUND = 79 as const;

export type CellChar = '.' | '#' | 'O';
export type CellByte = typeof CELL_EMPTY | typeof CELL_CUBE | typeof CELL_ROUND;

/** Cardinal tilt directions in spin-cycle order. */
export const TILT_DIRECTIONS = Object.freeze(['north', 'west', 'south', 'east'] as const);
export type TiltDirection = (typeof TILT_DIRECTIONS)[number];

const CELL_CHAR_TO_BYTE: Readonly<Record<string, CellByte>> = Object.freeze({
  '.': CELL_EMPTY,
  '#': CELL_CUBE,
  O: CELL_ROUND,
});

/** Validates and encodes a single platform cell character into its ASCII byte. */
export function encodeCellChar(ch: string): CellByte {
  const encoded = Object.prototype.hasOwnProperty.call(CELL_CHAR_TO_BYTE, ch)
    ? CELL_CHAR_TO_BYTE[ch]
    : undefined;
  if (encoded === undefined) {
    throw new RangeError(`Invalid dish cell character: ${JSON.stringify(ch)}`);
  }
  return encoded;
}
