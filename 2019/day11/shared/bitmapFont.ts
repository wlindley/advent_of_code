import { panelKey, type GridPoint } from './robotModels';

export const GLYPH_WIDTH = 5;
export const GLYPH_HEIGHT = 6;

/** Immutable 5x6 bitmap template for an uppercase AoC Space Image glyph. */
export interface GlyphDefinition {
  readonly letter: string;
  readonly rows: readonly string[];
}

function glyph(letter: string, rows: readonly string[]): GlyphDefinition {
  return Object.freeze({ letter, rows: Object.freeze(rows) });
}

/** Canonical 20 AoC 5x6 uppercase glyphs (including both I, both S, and 5-wide Y). */
export const CANONICAL_GLYPHS: readonly GlyphDefinition[] = Object.freeze([
  glyph('A', ['.##..', '#..#.', '#..#.', '####.', '#..#.', '#..#.']),
  glyph('B', ['###..', '#..#.', '###..', '#..#.', '#..#.', '###..']),
  glyph('C', ['.##..', '#..#.', '#....', '#....', '#..#.', '.##..']),
  glyph('E', ['####.', '#....', '###..', '#....', '#....', '####.']),
  glyph('F', ['####.', '#....', '###..', '#....', '#....', '#....']),
  glyph('G', ['.##..', '#..#.', '#....', '#.##.', '#..#.', '.###.']),
  glyph('H', ['#..#.', '#..#.', '####.', '#..#.', '#..#.', '#..#.']),
  glyph('I', ['###..', '.#...', '.#...', '.#...', '.#...', '###..']),
  glyph('I', ['.###.', '..#..', '..#..', '..#..', '..#..', '.###.']),
  glyph('J', ['..##.', '...#.', '...#.', '...#.', '#..#.', '.##..']),
  glyph('K', ['#..#.', '#.#..', '##...', '#.#..', '#.#..', '#..#.']),
  glyph('L', ['#....', '#....', '#....', '#....', '#....', '####.']),
  glyph('O', ['.##..', '#..#.', '#..#.', '#..#.', '#..#.', '.##..']),
  glyph('P', ['###..', '#..#.', '#..#.', '###..', '#....', '#....']),
  glyph('R', ['###..', '#..#.', '#..#.', '###..', '#.#..', '#..#.']),
  glyph('S', ['.###.', '#....', '.##..', '...#.', '...#.', '###..']),
  glyph('S', ['.###.', '#....', '#....', '.##..', '...#.', '###..']),
  glyph('U', ['#..#.', '#..#.', '#..#.', '#..#.', '#..#.', '.##..']),
  glyph('Y', ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..']),
  glyph('Z', ['####.', '...#.', '..#..', '.#...', '#....', '####.']),
]);

function packGlyphRows(rows: readonly string[]): number {
  let mask = 0;
  for (let row = 0; row < GLYPH_HEIGHT; row += 1) {
    const line = rows[row]!;
    for (let col = 0; col < GLYPH_WIDTH; col += 1) {
      if (line[col] === '#') {
        mask |= 1 << (row * GLYPH_WIDTH + col);
      }
    }
  }
  return mask;
}

const GLYPH_LOOKUP: ReadonlyMap<number, string> = new Map(
  CANONICAL_GLYPHS.map((entry) => [packGlyphRows(entry.rows), entry.letter]),
);

function extractSlotMask(
  whiteSet: ReadonlySet<string>,
  originX: number,
  minY: number,
  slot: number,
): number {
  let mask = 0;
  const baseX = originX + slot * GLYPH_WIDTH;
  for (let row = 0; row < GLYPH_HEIGHT; row += 1) {
    for (let col = 0; col < GLYPH_WIDTH; col += 1) {
      if (whiteSet.has(panelKey(baseX + col, minY + row))) {
        mask |= 1 << (row * GLYPH_WIDTH + col);
      }
    }
  }
  return mask;
}

function tryDecodeAtOrigin(
  whiteSet: ReadonlySet<string>,
  originX: number,
  maxX: number,
  minY: number,
): string | null {
  const slots = Math.ceil((maxX - originX + 1) / GLYPH_WIDTH);
  let decoded = '';
  for (let slot = 0; slot < slots; slot += 1) {
    const letter = GLYPH_LOOKUP.get(extractSlotMask(whiteSet, originX, minY, slot));
    if (letter === undefined) {
      return null;
    }
    decoded += letter;
  }
  return decoded;
}

/** Decodes a 6-row hull registration identifier from white panel coordinates. */
export function decodeHullRegistration(whitePanels: readonly GridPoint[]): string {
  if (whitePanels.length === 0) {
    throw new Error('Cannot decode hull registration from empty white panels');
  }
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const whiteSet = new Set<string>();
  for (const pt of whitePanels) {
    minX = Math.min(minX, pt.x);
    maxX = Math.max(maxX, pt.x);
    minY = Math.min(minY, pt.y);
    maxY = Math.max(maxY, pt.y);
    whiteSet.add(panelKey(pt.x, pt.y));
  }
  const height = maxY - minY + 1;
  if (height !== GLYPH_HEIGHT) {
    throw new RangeError(`White panel height must be ${GLYPH_HEIGHT}, got ${height}`);
  }
  const primary = tryDecodeAtOrigin(whiteSet, minX, maxX, minY);
  if (primary !== null) return primary;
  const shifted = tryDecodeAtOrigin(whiteSet, minX - 1, maxX, minY);
  if (shifted !== null) return shifted;
  throw new Error('Unrecognized 5x6 AoC glyphs in white panels');
}

/** Attempts to decode a hull registration identifier, returning null if unrecognized. */
export function tryDecodeHullRegistration(whitePanels: readonly GridPoint[]): string | null {
  try {
    return decodeHullRegistration(whitePanels);
  } catch {
    return null;
  }
}
