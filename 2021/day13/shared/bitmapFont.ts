import type { DotSheet } from './models';

export const GLYPH_WIDTH = 5;
export const GLYPH_HEIGHT = 6;

/** Immutable 5x6 bitmap template for an uppercase AoC glyph. */
export interface GlyphTemplate {
  readonly letter: string;
  readonly rows: readonly string[];
}

function glyph(letter: string, rows: readonly string[]): GlyphTemplate {
  return Object.freeze({ letter, rows: Object.freeze([...rows]) });
}

/** Deep-frozen canonical 30-bit 5x6 AoC font templates (including I and S variants). */
export const CANONICAL_GLYPHS: readonly GlyphTemplate[] = Object.freeze([
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

/** Encodes a 6-row by 5-column `#`/`.` pattern into a 30-bit integer mask. */
export function packGlyphMask(rows: readonly string[]): number {
  if (rows.length !== GLYPH_HEIGHT) throw new RangeError(`Glyph must have ${GLYPH_HEIGHT} rows, got ${rows.length}`);
  let mask = 0;
  for (let row = 0; row < GLYPH_HEIGHT; row += 1) {
    const line = rows[row]!;
    if (line.length !== GLYPH_WIDTH) throw new RangeError(`Glyph row ${row} must have ${GLYPH_WIDTH} cols, got ${line.length}`);
    for (let col = 0; col < GLYPH_WIDTH; col += 1) {
      const ch = line[col]!;
      if (ch === '#') mask |= 1 << (row * GLYPH_WIDTH + col);
      else if (ch !== '.') throw new Error(`Invalid pixel char ${JSON.stringify(ch)} at (${row}, ${col})`);
    }
  }
  return mask;
}

const CANONICAL_GLYPH_LOOKUP: ReadonlyMap<number, string> = new Map(
  CANONICAL_GLYPHS.map((entry) => [packGlyphMask(entry.rows), entry.letter]),
);

function extractSlotMask(sheet: DotSheet, originX: number, originY: number, slot: number): number {
  let mask = 0;
  const baseX = originX + slot * GLYPH_WIDTH;
  for (let row = 0; row < GLYPH_HEIGHT; row += 1) {
    for (let col = 0; col < GLYPH_WIDTH; col += 1) {
      if (sheet.hasDot(baseX + col, originY + row)) mask |= 1 << (row * GLYPH_WIDTH + col);
    }
  }
  return mask;
}

function tryDecodeAtOrigin(sheet: DotSheet, originX: number, originY: number, maxX: number): string | null {
  const slots = Math.ceil((maxX - originX + 1) / GLYPH_WIDTH);
  let decoded = '';
  for (let slot = 0; slot < slots; slot += 1) {
    const letter = CANONICAL_GLYPH_LOOKUP.get(extractSlotMask(sheet, originX, originY, slot));
    if (letter === undefined) return null;
    decoded += letter;
  }
  return decoded;
}

/** Attempts to decode a 6-row `DotSheet` into uppercase letters, returning `null` on mismatch. */
export function tryDecodeDotSheet(sheet: DotSheet): string | null {
  const { minX, maxX, minY, height } = sheet.bounds;
  if (height !== GLYPH_HEIGHT) return null;
  return tryDecodeAtOrigin(sheet, minX, minY, maxX) ?? tryDecodeAtOrigin(sheet, minX - 1, minY, maxX);
}

/** Decodes a 6-row `DotSheet` into uppercase letters or throws a diagnostic error. */
export function decodeDotSheet(sheet: DotSheet): string {
  const decoded = tryDecodeDotSheet(sheet);
  if (decoded === null) {
    throw new Error(`Unable to decode ${sheet.bounds.width}x${sheet.bounds.height} dot sheet:\n${formatDotSheet(sheet)}`);
  }
  return decoded;
}

/** Renders a `DotSheet` inside its tight bounding box using `#` and `.`. */
export function formatDotSheet(sheet: DotSheet): string {
  const { minX, maxX, minY, maxY } = sheet.bounds;
  const lines: string[] = [];
  for (let y = minY; y <= maxY; y += 1) {
    let line = '';
    for (let x = minX; x <= maxX; x += 1) {
      line += sheet.hasDot(x, y) ? '#' : '.';
    }
    lines.push(line);
  }
  return lines.join('\n');
}
