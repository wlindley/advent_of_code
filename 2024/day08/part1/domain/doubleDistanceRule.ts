import { GridPoint, type AntinodeProjectionRule, type PairProjection } from '../../shared';

function validateDimensions(rows: number, cols: number): void {
  if (!Number.isInteger(rows) || rows <= 0 || !Number.isInteger(cols) || cols <= 0) {
    throw new RangeError(`Grid dimensions must be positive integers, got ${rows}x${cols}`);
  }
}

function isWithinBounds(pt: GridPoint, rows: number, cols: number): boolean {
  return pt.row >= 0 && pt.row < rows && pt.col >= 0 && pt.col < cols;
}

/** Part 1 projection rule emitting the two exterior double-distance antinodes per pair. */
export const DOUBLE_DISTANCE_RULE: AntinodeProjectionRule = Object.freeze({
  id: 'double-distance',
  label: 'Double-Distance Exterior Reflection',
  projectPair(a: GridPoint, b: GridPoint, rows: number, cols: number): PairProjection {
    validateDimensions(rows, cols);
    if (a.equals(b)) {
      throw new RangeError(`Antinode pair anchors must be distinct, got (${a.row}, ${a.col})`);
    }
    const dr = b.row - a.row;
    const dc = b.col - a.col;
    const candidates = [new GridPoint(a.row - dr, a.col - dc), new GridPoint(b.row + dr, b.col + dc)];
    const inBounds: GridPoint[] = [];
    const outOfBounds: GridPoint[] = [];
    for (const pt of candidates) {
      if (isWithinBounds(pt, rows, cols)) inBounds.push(pt);
      else outOfBounds.push(pt);
    }
    return Object.freeze({
      inBounds: Object.freeze(inBounds),
      outOfBounds: Object.freeze(outOfBounds),
    });
  },
});
