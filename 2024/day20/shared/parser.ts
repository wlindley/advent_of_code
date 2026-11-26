import { GridPoint, Racetrack } from './model';

function splitGridLines(raw: string): readonly string[] {
  const normalized = raw.replace(/\r\n/g, '\n').replace(/\n+$/, '');
  if (normalized.length === 0) {
    throw new Error('Racetrack input cannot be empty');
  }
  const lines = normalized.split('\n');
  const cols = lines[0]!.length;
  if (cols === 0) {
    throw new Error('Racetrack row 0 cannot be empty');
  }
  for (let r = 1; r < lines.length; r += 1) {
    if (lines[r]!.length !== cols) {
      throw new Error(`Racetrack row ${r} has length ${lines[r]!.length}, expected ${cols}`);
    }
  }
  return lines;
}

/** Parses an ASCII racetrack (`#`, `.`, `S`, `E`) into an immutable `Racetrack`. */
export function parseRacetrack(raw: string): Racetrack {
  const lines = splitGridLines(raw);
  const rows = lines.length;
  const cols = lines[0]!.length;
  const wallMask = new Uint8Array(rows * cols);
  let start: GridPoint | null = null;
  let end: GridPoint | null = null;

  for (let r = 0; r < rows; r += 1) {
    const line = lines[r]!;
    for (let c = 0; c < cols; c += 1) {
      const ch = line[c]!;
      if (ch === '#') {
        wallMask[r * cols + c] = 1;
      } else if (ch === 'S') {
        if (start !== null) throw new Error('Duplicate start S in racetrack');
        start = new GridPoint(r, c);
      } else if (ch === 'E') {
        if (end !== null) throw new Error('Duplicate end E in racetrack');
        end = new GridPoint(r, c);
      } else if (ch !== '.') {
        throw new Error(`Invalid racetrack character '${ch}' at (${r}, ${c})`);
      }
    }
  }

  if (start === null) throw new Error('Missing start S in racetrack');
  if (end === null) throw new Error('Missing end E in racetrack');
  return new Racetrack(rows, cols, start, end, wallMask);
}
