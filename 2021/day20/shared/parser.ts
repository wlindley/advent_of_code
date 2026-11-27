import { EnhancementAlgorithm, TrenchImage, type TrenchMapInput } from './types';

function encodeRow(row: string, target: Uint8Array, offset: number, label: string): void {
  for (let i = 0; i < row.length; i += 1) {
    const ch = row[i]!;
    if (ch === '#') {
      target[offset + i] = 1;
    } else if (ch === '.') {
      target[offset + i] = 0;
    } else {
      throw new Error(`Invalid character "${ch}" in ${label}`);
    }
  }
}

function parseAlgorithm(section: string): EnhancementAlgorithm {
  const joined = section
    .split('\n')
    .map((line) => line.trim())
    .join('');
  const bits = new Uint8Array(joined.length);
  encodeRow(joined, bits, 0, 'enhancement algorithm');
  return new EnhancementAlgorithm(bits);
}

function parseImage(section: string): TrenchImage {
  const rows = section.split('\n').map((line) => line.trim());
  const width = rows[0]!.length;
  if (width === 0) {
    throw new Error('Image grid must not contain empty rows');
  }
  const pixels = new Uint8Array(rows.length * width);
  for (let r = 0; r < rows.length; r += 1) {
    const row = rows[r]!;
    if (row.length !== width) {
      throw new Error(`Image row ${r} has length ${row.length}, expected ${width}`);
    }
    encodeRow(row, pixels, r * width, `image row ${r}`);
  }
  return new TrenchImage(rows.length, width, pixels, 0);
}

/** Parses Day 20 raw text into a validated enhancement algorithm and initial trench image. */
export function parseTrenchMap(raw: string): TrenchMapInput {
  const normalized = raw.replace(/\r\n/g, '\n').trim();
  const sections = normalized.split(/\n{2,}/);
  if (sections.length !== 2) {
    throw new Error(`Expected 2 sections separated by a blank line, got ${sections.length}`);
  }
  return {
    algorithm: parseAlgorithm(sections[0]!),
    image: parseImage(sections[1]!),
  };
}
