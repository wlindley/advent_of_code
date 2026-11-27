import { SquareBitmap } from './d4';
import { Tile } from './tile';

const TILE_HEADER_RE = /^Tile (\d+):$/;

/** Parsed camera-array jigsaw puzzle with uniform square tiles. */
export interface JigsawPuzzle {
  readonly tiles: readonly Tile[];
  readonly gridSide: number;
  readonly tileSize: number;
}

function parseTileId(header: string, seenIds: Set<number>): number {
  const match = TILE_HEADER_RE.exec(header);
  if (!match) {
    throw new Error(`Invalid tile header: "${header}"`);
  }
  const id = Number(match[1]);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new Error(`Invalid tile ID: ${match[1]}`);
  }
  if (seenIds.has(id)) {
    throw new Error(`Duplicate tile ID: ${id}`);
  }
  seenIds.add(id);
  return id;
}

function parseBitmapRows(rows: readonly string[], side: number, id: number): SquareBitmap {
  const pixels = new Uint8Array(side * side);
  for (let r = 0; r < side; r += 1) {
    const row = rows[r]!;
    if (row.length !== side) {
      throw new Error(`Tile ${id} row ${r} has length ${row.length}, expected ${side}`);
    }
    const rowOffset = r * side;
    for (let c = 0; c < side; c += 1) {
      const ch = row[c];
      if (ch !== '#' && ch !== '.') {
        throw new Error(`Tile ${id} contains invalid pixel "${ch}"`);
      }
      pixels[rowOffset + c] = ch === '#' ? 1 : 0;
    }
  }
  return new SquareBitmap(side, pixels);
}

function parseTileBlock(
  block: string,
  tileIndex: number,
  expectedSide: number,
  seenIds: Set<number>,
): Tile {
  const lines = block
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const id = parseTileId(lines[0]!, seenIds);
  const rows = lines.slice(1);
  const side = expectedSide === 0 ? rows.length : expectedSide;
  if (side < 3 || side > 30) {
    throw new RangeError(`Tile ${id} size ${side} must be between 3 and 30`);
  }
  if (rows.length !== side) {
    throw new Error(`Tile ${id} has ${rows.length} rows, expected ${side}`);
  }
  return new Tile(tileIndex, id, parseBitmapRows(rows, side, id));
}

/** Parses AoC 2020 Day 20 tile blocks into validated Tile entities. */
export function parseTiles(raw: string): JigsawPuzzle {
  const normalized = raw.replace(/\r\n?/g, '\n').trim();
  if (normalized.length === 0) {
    throw new Error('Input contains no tiles');
  }
  const blocks = normalized.split(/\n\s*\n+/);
  const seenIds = new Set<number>();
  const tiles: Tile[] = [];
  let tileSize = 0;

  for (let i = 0; i < blocks.length; i += 1) {
    const tile = parseTileBlock(blocks[i]!, i, tileSize, seenIds);
    tileSize = tile.bitmap.side;
    tiles.push(tile);
  }

  const gridSide = Math.round(Math.sqrt(tiles.length));
  if (gridSide * gridSide !== tiles.length) {
    throw new Error(`Tile count ${tiles.length} is not a perfect square`);
  }
  return { tiles, gridSide, tileSize };
}
