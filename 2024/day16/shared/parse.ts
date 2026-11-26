import { ReindeerMaze } from './types';

function splitMazeLines(raw: string): readonly string[] {
  const trimmed = raw.replace(/(?:\r?\n)+$/, '');
  if (trimmed.length === 0) {
    throw new Error('Maze input is empty');
  }
  const lines = trimmed.split(/\r?\n/);
  const width = lines[0]!.length;
  for (let r = 0; r < lines.length; r += 1) {
    const line = lines[r]!;
    if (line.length === 0) {
      throw new Error(`Maze contains an empty line at row ${r}`);
    }
    if (line.length !== width) {
      throw new Error(`Row ${r} has width ${line.length}, expected ${width}`);
    }
  }
  return lines;
}

/** Parses an ASCII Reindeer Maze grid (`#`, `.`, `S`, `E`) into an immutable `ReindeerMaze`. */
export function parseReindeerMaze(raw: string): ReindeerMaze {
  const lines = splitMazeLines(raw);
  const height = lines.length;
  const width = lines[0]!.length;
  const walls = new Uint8Array(width * height);
  let startCell = -1;
  let endCell = -1;

  for (let r = 0; r < height; r += 1) {
    const line = lines[r]!;
    for (let c = 0; c < width; c += 1) {
      const idx = r * width + c;
      const ch = line[c]!;
      if (ch === '#') {
        walls[idx] = 1;
      } else if (ch === 'S') {
        if (startCell !== -1) throw new Error('Multiple start tiles S found');
        startCell = idx;
      } else if (ch === 'E') {
        if (endCell !== -1) throw new Error('Multiple end tiles E found');
        endCell = idx;
      } else if (ch !== '.') {
        throw new Error(`Invalid maze character '${ch}' at (${r}, ${c})`);
      }
    }
  }

  if (startCell === -1 || endCell === -1) {
    throw new Error('Maze must contain both start tile S and end tile E');
  }
  return new ReindeerMaze(width, height, walls, startCell, endCell);
}
