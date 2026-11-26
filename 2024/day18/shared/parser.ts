import { type ByteCoord, MemorySpace } from './model';

const BYTE_LINE_PATTERN = /^(\d+),(\d+)$/;

function parseByteLine(line: string, index: number): ByteCoord {
  const match = BYTE_LINE_PATTERN.exec(line);
  if (!match) {
    throw new Error(`Invalid byte coordinate at line ${index + 1}: "${line}"`);
  }
  const x = Number(match[1]!);
  const y = Number(match[2]!);
  if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y)) {
    throw new RangeError(`Byte coordinate out of safe integer range at line ${index + 1}`);
  }
  return Object.freeze({ x, y });
}

/** Parses newline-delimited `x,y` byte coordinates into a frozen coordinate list. */
export function parseByteCoords(raw: string): readonly ByteCoord[] {
  const normalized = raw.replace(/\r\n/g, '\n').replace(/\n+$/, '');
  if (normalized.length === 0) {
    throw new Error('Byte coordinate input cannot be empty');
  }
  return Object.freeze(normalized.split('\n').map(parseByteLine));
}

/** Parses raw `x,y` input directly into a validated `MemorySpace` of side `gridSize`. */
export function parseMemorySpace(raw: string, gridSize: number): MemorySpace {
  return new MemorySpace(gridSize, parseByteCoords(raw));
}
