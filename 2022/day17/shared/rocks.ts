/** Fixed vertical chamber width in units. */
export const CHAMBER_WIDTH = 7;

/** Bitmask representing a completely solid 7-column row (bits 0..6). */
export const FULL_ROW = 0x7f;

/** Bitmask of the leftmost column (bit 6) across all 4 packed rows of a rock mask. */
export const LEFT_WALL_MASK = 0x40404040;

/** Bitmask of the rightmost column (bit 0) across all 4 packed rows of a rock mask. */
export const RIGHT_WALL_MASK = 0x01010101;

/** Vertical offset above the current tower height where a new rock's bottom row spawns. */
export const SPAWN_HEIGHT_GAP = 4;

/** Number of distinct falling rock shapes in the repeating cycle. */
export const ROCK_COUNT = 5;

export type RockShapeIndex = 0 | 1 | 2 | 3 | 4;

/** 4-row little-endian byte-packed bitmasks for each rock shape at its spawn x-offset (left edge at x=2). */
export const ROCK_MASKS: readonly number[] = Object.freeze([
  0x0000001e, // '-'
  0x00081c08, // '+'
  0x0004041c, // 'J'
  0x10101010, // 'I'
  0x00001818, // 'O'
]);

/** Human-readable glyphs for each rock shape index. */
export const ROCK_LABELS: readonly string[] = Object.freeze(['-', '+', 'J', 'I', 'O']);

/** Returns the packed 32-bit spawn mask for `index`. */
export function rockMaskAt(index: RockShapeIndex): number {
  return ROCK_MASKS[index]!;
}
