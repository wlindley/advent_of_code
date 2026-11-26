import type { ElfCoord } from './types';

function parseLineElves(line: string, row: number, elves: ElfCoord[]): void {
  if (line.length === 0) {
    throw new Error(`Unexpected blank line at row ${row + 1}`);
  }
  for (let col = 0; col < line.length; col += 1) {
    const ch = line[col]!;
    if (ch === '#') {
      elves.push(Object.freeze({ row, col }));
    } else if (ch !== '.') {
      throw new Error(`Invalid character '${ch}' at row ${row + 1}, col ${col + 1}`);
    }
  }
}

/** Parses an Unstable Diffusion ASCII grid into frozen elf coordinates. */
export function parseElves(raw: string): readonly ElfCoord[] {
  const normalized = raw.replace(/\r\n/g, '\n').replace(/\n+$/, '');
  if (normalized.length === 0) {
    throw new Error('Input must contain at least one grid row');
  }
  const lines = normalized.split('\n');
  const elves: ElfCoord[] = [];
  for (let row = 0; row < lines.length; row += 1) {
    parseLineElves(lines[row]!, row, elves);
  }
  if (elves.length === 0) {
    throw new Error('Input grid must contain at least one elf (#)');
  }
  return Object.freeze(elves);
}
