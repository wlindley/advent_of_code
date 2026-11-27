import { describe, expect, it } from 'vitest';
import { parseTiles } from './parser';

function makeTileBlock(id: number, rows: readonly string[]): string {
  return [`Tile ${id}:`, ...rows].join('\n');
}

const TILE_3X3_A = makeTileBlock(10, ['.#.', '..#', '###']);
const TILE_3X3_B = makeTileBlock(20, ['###', '.#.', '...']);
const TILE_3X3_C = makeTileBlock(30, ['..#', '.#.', '#..']);
const TILE_3X3_D = makeTileBlock(40, ['#.#', '.#.', '#.#']);

describe('2020 Day 20 shared/parser', () => {
  it('parses valid CRLF and blank-line padded tile blocks', () => {
    const raw = `\r\n${TILE_3X3_A}\r\n\r\n\r\n${TILE_3X3_B}\r\n\r\n${TILE_3X3_C}\r\n\r\n${TILE_3X3_D}\r\n`;
    const puzzle = parseTiles(raw);
    expect(puzzle.gridSide).toBe(2);
    expect(puzzle.tileSize).toBe(3);
    expect(puzzle.tiles.length).toBe(4);
    expect(puzzle.tiles[0]!.id).toBe(10);
    expect(puzzle.tiles[0]!.bitmap.at(0, 1)).toBe(1);
    expect(puzzle.tiles[0]!.bitmap.at(0, 0)).toBe(0);
  });

  it('rejects empty input and non-square tile counts', () => {
    expect(() => parseTiles('   \r\n  ')).toThrow();
    expect(() => parseTiles(`${TILE_3X3_A}\n\n${TILE_3X3_B}`)).toThrow();
  });

  it('rejects malformed headers, non-positive IDs, and duplicate tile IDs', () => {
    expect(() => parseTiles(makeTileBlock(0, ['.#.', '..#', '###']))).toThrow();
    expect(() => parseTiles('Header 10:\n.#.\n..#\n###')).toThrow();
    expect(() => parseTiles('Tile 99999999999999999999:\n.#.\n..#\n###')).toThrow();
    expect(() => parseTiles(`${TILE_3X3_A}\n\n${TILE_3X3_A}`)).toThrow();
  });

  it('rejects out-of-range sizes, mismatched tile dimensions, non-square rows, and invalid pixels', () => {
    expect(() => parseTiles(makeTileBlock(1, ['..', '##']))).toThrow();
    const row31 = '.'.repeat(31);
    expect(() => parseTiles(makeTileBlock(1, Array.from({ length: 31 }, () => row31)))).toThrow();
    const tile4x4 = makeTileBlock(50, ['....', '....', '....', '....']);
    expect(() =>
      parseTiles(`${TILE_3X3_A}\n\n${TILE_3X3_B}\n\n${TILE_3X3_C}\n\n${tile4x4}`),
    ).toThrow();
    expect(() => parseTiles(makeTileBlock(1, ['.#.', '..', '###']))).toThrow();
    expect(() => parseTiles(makeTileBlock(1, ['.#.', '.x.', '###']))).toThrow();
  });
});
