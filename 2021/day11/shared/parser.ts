import { Grid2D } from '../../../shared/core';
import { OctopusGrid } from './grid';

function parseEnergyChar(ch: string, row: number, col: number): number {
  if (ch < '0' || ch > '9') {
    throw new RangeError(`Expected digit 0-9 at (${row}, ${col}), got "${ch}"`);
  }
  return ch.charCodeAt(0) - 48;
}

/** Parses rectangular newline-delimited energy digits into a validated `OctopusGrid`. */
export function parseOctopusGrid(raw: string): OctopusGrid {
  return new OctopusGrid(Grid2D.fromLines(raw, parseEnergyChar));
}
