import { GridPoint, type AntinodeProjectionRule, type PairProjection } from '../../shared';

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x;
}

function validateDimensions(rows: number, cols: number): void {
  if (!Number.isInteger(rows) || rows <= 0 || !Number.isInteger(cols) || cols <= 0) {
    throw new RangeError(`Grid dimensions must be positive integers, got ${rows}x${cols}`);
  }
}

function isWithinBounds(row: number, col: number, rows: number, cols: number): boolean {
  return row >= 0 && row < rows && col >= 0 && col < cols;
}

function validateAnchors(a: GridPoint, b: GridPoint, rows: number, cols: number): void {
  if (!isWithinBounds(a.row, a.col, rows, cols) || !isWithinBounds(b.row, b.col, rows, cols)) {
    throw new RangeError(
      `Antinode pair anchors must be within ${rows}x${cols}, got (${a.row}, ${a.col}) and (${b.row}, ${b.col})`,
    );
  }
  if (a.equals(b)) {
    throw new RangeError(`Antinode pair anchors must be distinct, got (${a.row}, ${a.col})`);
  }
}

function traceRay(
  startRow: number,
  startCol: number,
  stepRow: number,
  stepCol: number,
  rows: number,
  cols: number,
): { readonly points: GridPoint[]; readonly terminator: GridPoint } {
  const points: GridPoint[] = [];
  let row = startRow;
  let col = startCol;
  while (isWithinBounds(row, col, rows, cols)) {
    points.push(new GridPoint(row, col));
    row += stepRow;
    col += stepCol;
  }
  return { points, terminator: new GridPoint(row, col) };
}

/** Part 2 projection rule emitting every in-bounds lattice point collinear with a pair. */
export const HARMONIC_LINE_RULE: AntinodeProjectionRule = Object.freeze({
  id: 'harmonic-line',
  label: 'Resonant Harmonics (All Collinear Lattice Nodes)',
  projectPair(a: GridPoint, b: GridPoint, rows: number, cols: number): PairProjection {
    validateDimensions(rows, cols);
    validateAnchors(a, b, rows, cols);
    const dr = b.row - a.row;
    const dc = b.col - a.col;
    const g = gcd(dr, dc);
    const sr = dr / g;
    const sc = dc / g;
    // Subtract from 0 rather than negating so zero steps never produce -0.
    const back = traceRay(a.row - sr, a.col - sc, 0 - sr, 0 - sc, rows, cols);
    const fwd = traceRay(a.row, a.col, sr, sc, rows, cols);
    return Object.freeze({
      inBounds: Object.freeze([...back.points.reverse(), ...fwd.points]),
      outOfBounds: Object.freeze([back.terminator, fwd.terminator]),
    });
  },
});
