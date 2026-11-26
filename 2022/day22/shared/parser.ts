import { MonkeyBoard } from './board';
import { Tile, type PathStep } from './types';

export interface MonkeyMapInput {
  readonly board: MonkeyBoard;
  readonly path: readonly PathStep[];
}

function parseBoardCell(ch: string, row: number, col: number): Tile {
  if (ch === ' ') return Tile.Void;
  if (ch === '.') return Tile.Open;
  if (ch === '#') return Tile.Wall;
  throw new Error(`Invalid board character '${ch}' at row ${row}, col ${col}`);
}

function parseBoard(section: string): MonkeyBoard {
  const lines = section.split('\n');
  let width = 0;
  for (const line of lines) {
    if (line.length > width) width = line.length;
  }
  const cells = new Uint8Array(lines.length * width);
  for (let row = 0; row < lines.length; row += 1) {
    const line = lines[row]!;
    let hasPlayable = false;
    for (let col = 0; col < line.length; col += 1) {
      const tile = parseBoardCell(line[col]!, row, col);
      cells[row * width + col] = tile;
      if (tile !== Tile.Void) hasPlayable = true;
    }
    if (!hasPlayable) throw new Error(`Board row ${row} has no playable tiles`);
  }
  return new MonkeyBoard(lines.length, width, cells);
}

function parsePath(section: string): readonly PathStep[] {
  const steps: PathStep[] = [];
  let i = 0;
  while (i < section.length) {
    const ch = section[i]!;
    if (ch === 'L' || ch === 'R') {
      steps.push(Object.freeze({ kind: 'turn', turn: ch }));
      i += 1;
    } else if (ch >= '0' && ch <= '9') {
      let end = i + 1;
      while (end < section.length && section[end]! >= '0' && section[end]! <= '9') end += 1;
      const distance = Number(section.slice(i, end));
      if (!Number.isSafeInteger(distance)) {
        throw new RangeError(`Unsafe integer move distance: ${section.slice(i, end)}`);
      }
      steps.push(Object.freeze({ kind: 'move', distance }));
      i = end;
    } else {
      throw new Error(`Invalid path character '${ch}' at index ${i}`);
    }
  }
  return Object.freeze(steps);
}

/** Parses raw AoC Day 22 input without trimming leading board spaces. */
export function parseMonkeyMap(raw: string): MonkeyMapInput {
  // Never trim/trimStart: leading spaces on row 0 encode board geometry.
  const normalized = raw.replace(/\r\n/g, '\n').replace(/\n+$/, '');
  const sections = normalized.split('\n\n');
  if (sections.length < 2) {
    throw new Error('Missing blank-line section or empty path');
  }
  if (sections.length > 2) {
    throw new Error('Unexpected extra blank-line section in input');
  }
  return Object.freeze({
    board: parseBoard(sections[0]!),
    path: parsePath(sections[1]!),
  });
}
