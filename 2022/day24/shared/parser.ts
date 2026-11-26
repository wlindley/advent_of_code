import {
  BLIZZARD_DOWN,
  BLIZZARD_LEFT,
  BLIZZARD_RIGHT,
  BLIZZARD_UP,
  BlizzardBasin,
} from './basin';

const CHAR_TO_MASK: Record<string, number> = {
  '.': 0,
  '^': BLIZZARD_UP,
  v: BLIZZARD_DOWN,
  '<': BLIZZARD_LEFT,
  '>': BLIZZARD_RIGHT,
};

function parseWallOpening(line: string, width: number, label: string): number {
  if (line.length !== width) {
    throw new Error(`${label} wall length ${line.length} does not match expected width ${width}`);
  }
  if (line[0] !== '#' || line[width - 1] !== '#') {
    throw new Error(`${label} wall must have '#' corners`);
  }
  let openingCol = -1;
  for (let c = 1; c < width - 1; c += 1) {
    const ch = line[c]!;
    if (ch === '.') {
      if (openingCol !== -1) throw new Error(`${label} wall must have exactly one '.' opening`);
      openingCol = c;
    } else if (ch !== '#') {
      throw new Error(`Invalid character '${ch}' in ${label} wall`);
    }
  }
  if (openingCol === -1) throw new Error(`${label} wall is missing '.' opening`);
  return openingCol;
}

function parseInteriorRow(
  line: string,
  width: number,
  rowIdx: number,
  blizzards: Uint8Array,
  offset: number,
): void {
  if (line.length !== width) {
    throw new Error(`Row ${rowIdx} length ${line.length} does not match expected width ${width}`);
  }
  if (line[0] !== '#' || line[width - 1] !== '#') {
    throw new Error(`Row ${rowIdx} must start and end with '#'`);
  }
  for (let c = 1; c < width - 1; c += 1) {
    const mask = CHAR_TO_MASK[line[c]!];
    if (mask === undefined) {
      throw new Error(`Invalid interior character '${line[c]}' at row ${rowIdx}, col ${c}`);
    }
    blizzards[offset + c - 1] = mask;
  }
}

/** Parses a Blizzard Basin ASCII map into an immutable `BlizzardBasin`. */
export function parseBasin(raw: string): BlizzardBasin {
  const trimmed = raw.replace(/\r\n/g, '\n').trim();
  if (trimmed.length === 0) {
    throw new Error('Blizzard Basin input cannot be empty');
  }
  const lines = trimmed.split('\n');
  const height = lines.length;
  const width = lines[0]!.length;
  if (height < 3 || width < 3) {
    throw new RangeError(`Blizzard Basin must be at least 3x3, got ${height}x${width}`);
  }
  const startCol = parseWallOpening(lines[0]!, width, 'Top');
  const endCol = parseWallOpening(lines[height - 1]!, width, 'Bottom');
  const innerWidth = width - 2;
  const blizzards = new Uint8Array((height - 2) * innerWidth);
  for (let r = 1; r < height - 1; r += 1) {
    parseInteriorRow(lines[r]!, width, r, blizzards, (r - 1) * innerWidth);
  }
  return new BlizzardBasin(height, width, startCol, endCol, blizzards);
}
