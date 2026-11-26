import { type CompositeImage, type ImageDimensions, PIXEL_TRANSPARENT, PIXEL_WHITE } from './imageModels';

export const GLYPH_WIDTH = 5, GLYPH_HEIGHT = 6, GLYPH_BIT_COUNT = GLYPH_WIDTH * GLYPH_HEIGHT;
export const MAX_GLYPH_MASK = (1 << GLYPH_BIT_COUNT) - 1;
const LETTER_PATTERN = /^[A-Z]$/;

/** Immutable 5x6 bitmap template for an uppercase AoC Space Image glyph. */
export interface GlyphTemplate {
  readonly letter: string;
  readonly rows: readonly string[];
}

function glyph(letter: string, rows: readonly string[]): GlyphTemplate {
  return Object.freeze({ letter, rows: Object.freeze([...rows]) });
}

/** Deep-frozen canonical AoC 5x6 uppercase font templates (including I and S variants). */
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

function assertGlyphMask(mask: number): void {
  if (!Number.isInteger(mask) || mask < 0 || mask > MAX_GLYPH_MASK) {
    throw new RangeError(`Glyph mask must be an integer in [0, ${MAX_GLYPH_MASK}], got ${mask}`);
  }
}

export function isFontCompatible(dimensions: ImageDimensions): boolean {
  return dimensions.height === GLYPH_HEIGHT && dimensions.width % GLYPH_WIDTH === 0;
}

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

export function formatGlyphMask(mask: number): string {
  assertGlyphMask(mask);
  const lines: string[] = [];
  for (let row = 0; row < GLYPH_HEIGHT; row += 1) {
    let line = '';
    for (let col = 0; col < GLYPH_WIDTH; col += 1) {
      line += (mask & (1 << (row * GLYPH_WIDTH + col))) !== 0 ? '#' : '.';
    }
    lines.push(line);
  }
  return lines.join('\n');
}

export function buildGlyphLookup(templates: readonly GlyphTemplate[]): ReadonlyMap<number, string> {
  const map = new Map<number, string>();
  for (const template of templates) {
    if (!LETTER_PATTERN.test(template.letter)) throw new Error(`Glyph letter must be A-Z, got ${JSON.stringify(template.letter)}`);
    const mask = packGlyphMask(template.rows);
    if (map.has(mask)) throw new Error(`Duplicate glyph mask ${mask} for letter ${template.letter}`);
    map.set(mask, template.letter);
  }
  return map;
}

const CANONICAL_GLYPH_LOOKUP = buildGlyphLookup(CANONICAL_GLYPHS);

export function decodeGlyphMask(mask: number, lookup: ReadonlyMap<number, string>): string | null {
  assertGlyphMask(mask);
  return lookup.get(mask) ?? null;
}

function extractSlotMask(composite: CompositeImage, slot: number): number | null {
  let mask = 0;
  const baseCol = slot * GLYPH_WIDTH;
  for (let row = 0; row < GLYPH_HEIGHT; row += 1) {
    for (let col = 0; col < GLYPH_WIDTH; col += 1) {
      const pixel = composite.pixelAt(row, baseCol + col);
      if (pixel === PIXEL_TRANSPARENT) return null;
      if (pixel === PIXEL_WHITE) mask |= 1 << (row * GLYPH_WIDTH + col);
    }
  }
  return mask;
}

export function decodeCompositeMessage(composite: CompositeImage): string {
  if (!isFontCompatible(composite.dimensions)) {
    throw new RangeError(`Dimensions ${composite.dimensions.width}x${composite.dimensions.height} are not 5x6 font compatible`);
  }
  const slots = composite.dimensions.width / GLYPH_WIDTH;
  let message = '';
  for (let slot = 0; slot < slots; slot += 1) {
    const mask = extractSlotMask(composite, slot);
    if (mask === null) throw new Error(`Slot ${slot} still contains transparent pixels`);
    const letter = decodeGlyphMask(mask, CANONICAL_GLYPH_LOOKUP);
    if (letter === null) throw new Error(`Unrecognized glyph at slot ${slot}:\n${formatGlyphMask(mask)}`);
    message += letter;
  }
  return message;
}

export function tryDecodeComposite(composite: CompositeImage): readonly (string | null)[] | null {
  if (!isFontCompatible(composite.dimensions)) return null;
  const slots = composite.dimensions.width / GLYPH_WIDTH;
  const decoded: (string | null)[] = [];
  for (let slot = 0; slot < slots; slot += 1) {
    const mask = extractSlotMask(composite, slot);
    decoded.push(mask === null ? null : decodeGlyphMask(mask, CANONICAL_GLYPH_LOOKUP));
  }
  return Object.freeze(decoded);
}
