import { CRT_HEIGHT } from '../../shared';

/** Pixel width of a single CRT glyph cell (4 strokes + 1 spacer column). */
export const GLYPH_WIDTH = 5;

/** Number of letter slots across the 40-column CRT screen. */
export const GLYPH_COUNT = 8;

/** Total pixels in a 5x6 glyph cell. */
export const GLYPH_BIT_COUNT = GLYPH_WIDTH * CRT_HEIGHT;

/** Maximum valid 30-bit glyph mask ((1 << 30) - 1). */
export const MAX_GLYPH_MASK = (1 << GLYPH_BIT_COUNT) - 1;

const LETTER_PATTERN = /^[A-Z]$/;

/** Immutable 5x6 bitmap template for an uppercase AoC CRT glyph. */
export interface GlyphTemplate {
  readonly letter: string;
  readonly rows: readonly string[];
}

function glyph(letter: string, rows: readonly string[]): GlyphTemplate {
  return Object.freeze({ letter, rows: Object.freeze([...rows]) });
}

/** Deep-frozen canonical Advent of Code 5x6 uppercase CRT font templates. */
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
  glyph('S', ['.###.', '#....', '#....', '.##..', '...#.', '###..']),
  glyph('U', ['#..#.', '#..#.', '#..#.', '#..#.', '#..#.', '.##..']),
  glyph('Y', ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..']),
  glyph('Z', ['####.', '...#.', '..#..', '.#...', '#....', '####.']),
]);

function assertGlyphMask(mask: number): void {
  if (!Number.isInteger(mask) || mask < 0 || mask > MAX_GLYPH_MASK) {
    throw new RangeError(`Glyph mask must be an integer in [0, ${MAX_GLYPH_MASK}], got ${mask}`);
  }
}

/** Packs 6 rows of 5 `#`/`.` pixels into a 30-bit integer mask (bit `row * 5 + col`). */
export function packGlyphMask(rows: readonly string[]): number {
  if (rows.length !== CRT_HEIGHT) {
    throw new RangeError(`Glyph must have ${CRT_HEIGHT} rows, got ${rows.length}`);
  }
  let mask = 0;
  for (let row = 0; row < CRT_HEIGHT; row += 1) {
    const line = rows[row]!;
    if (line.length !== GLYPH_WIDTH) {
      throw new RangeError(`Glyph row ${row} must have ${GLYPH_WIDTH} columns, got ${line.length}`);
    }
    for (let col = 0; col < GLYPH_WIDTH; col += 1) {
      const ch = line[col]!;
      if (ch === '#') {
        mask |= 1 << (row * GLYPH_WIDTH + col);
      } else if (ch !== '.') {
        throw new Error(`Invalid pixel character ${JSON.stringify(ch)} at row ${row}, col ${col}`);
      }
    }
  }
  return mask;
}

/** Formats a validated 30-bit glyph mask back into 6 newline-joined `#`/`.` rows. */
export function formatGlyphMask(mask: number): string {
  assertGlyphMask(mask);
  const lines: string[] = [];
  for (let row = 0; row < CRT_HEIGHT; row += 1) {
    let line = '';
    for (let col = 0; col < GLYPH_WIDTH; col += 1) {
      const bit = 1 << (row * GLYPH_WIDTH + col);
      line += (mask & bit) !== 0 ? '#' : '.';
    }
    lines.push(line);
  }
  return lines.join('\n');
}

/** Validates and indexes glyph templates into an immutable mask-to-letter lookup map. */
export function buildGlyphLookup(templates: readonly GlyphTemplate[]): ReadonlyMap<number, string> {
  const map = new Map<number, string>();
  for (const template of templates) {
    if (!LETTER_PATTERN.test(template.letter)) {
      throw new Error(`Glyph letter must be A-Z, got ${JSON.stringify(template.letter)}`);
    }
    const mask = packGlyphMask(template.rows);
    if (map.has(mask)) {
      throw new Error(`Duplicate glyph mask ${mask} for letter ${template.letter}`);
    }
    map.set(mask, template.letter);
  }
  return map;
}

const GLYPH_LOOKUP = buildGlyphLookup(CANONICAL_GLYPHS);

/** Decodes a validated 30-bit glyph mask into an uppercase letter, or `null` if unknown. */
export function decodeGlyphMask(mask: number): string | null {
  assertGlyphMask(mask);
  return GLYPH_LOOKUP.get(mask) ?? null;
}
