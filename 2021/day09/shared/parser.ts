import { Grid2D } from '../../../shared/core';
import { Heightmap } from './heightmap';

function parseHeightChar(ch: string, row: number, col: number): number {
  if (ch < '0' || ch > '9') {
    throw new RangeError(`Invalid height character '${ch}' at (${row}, ${col})`);
  }
  return ch.charCodeAt(0) - 48;
}

/** Parses a rectangular digit grid string into a validated `Heightmap`. */
export function parseHeightmap(raw: string): Heightmap {
  return new Heightmap(Grid2D.fromLines(raw, parseHeightChar));
}
