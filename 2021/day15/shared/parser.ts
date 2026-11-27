import { RiskGrid } from './cavern';

function parseLineInto(line: string, rowIdx: number, cols: number, out: Uint8Array): void {
  const offset = rowIdx * cols;
  for (let c = 0; c < cols; c += 1) {
    const risk = line.charCodeAt(c) - 48;
    if (risk < 1 || risk > 9) {
      throw new RangeError(`Invalid risk digit '${line[c]!}' at row ${rowIdx}, col ${c}`);
    }
    out[offset + c] = risk;
  }
}

/** Parses a rectangular grid of 1..9 risk digits into an immutable `RiskGrid`. */
export function parseRiskGrid(raw: string): RiskGrid {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new Error('Cavern input must not be empty');
  }
  const lines = trimmed.split(/\r?\n/);
  const rows = lines.length;
  const cols = lines[0]!.trim().length;
  const cells = new Uint8Array(rows * cols);

  for (let r = 0; r < rows; r += 1) {
    const line = lines[r]!.trim();
    if (line.length === 0) {
      throw new Error(`Unexpected blank line at row ${r}`);
    }
    if (line.length !== cols) {
      throw new Error(`Ragged row ${r}: expected ${cols} columns, got ${line.length}`);
    }
    parseLineInto(line, r, cols, cells);
  }
  return new RiskGrid(rows, cols, cells);
}
