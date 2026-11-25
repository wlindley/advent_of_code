import { Grid2D } from '../../../shared/core';

export type WarehouseCell = '.' | '@';

export const MAX_BLOCKING_NEIGHBORS = 4;

export interface WarehouseDegreeMap {
  readonly paddedOccupied: Uint8Array;
  readonly degrees: Uint8Array;
}

/** Immutable warehouse floor grid with branchless padded 8-neighbor degree computation. */
export class WarehouseFloor {
  readonly grid: Grid2D<WarehouseCell>;

  constructor(grid: Grid2D<WarehouseCell>) {
    this.grid = grid;
  }

  get rows(): number {
    return this.grid.rows;
  }

  get cols(): number {
    return this.grid.cols;
  }

  isRoll(row: number, col: number): boolean {
    return this.grid.at(row, col) === '@';
  }

  computeDegreeMap(): WarehouseDegreeMap {
    const rows = this.rows;
    const cols = this.cols;
    const stride = cols + 2;
    // Zero-padded 1-cell border eliminates bounds checks and prevents row wrap-around leakage.
    const paddedOccupied = new Uint8Array((rows + 2) * stride);
    const degrees = new Uint8Array(rows * cols);

    for (let r = 0; r < rows; r += 1) {
      const paddedRow = (r + 1) * stride + 1;
      for (let c = 0; c < cols; c += 1) {
        if (this.grid.at(r, c) === '@') {
          paddedOccupied[paddedRow + c] = 1;
        }
      }
    }

    for (let r = 0; r < rows; r += 1) {
      const paddedRow = (r + 1) * stride + 1;
      const outRow = r * cols;
      for (let c = 0; c < cols; c += 1) {
        const p = paddedRow + c;
        degrees[outRow + c] =
          paddedOccupied[p - stride - 1]! +
          paddedOccupied[p - stride]! +
          paddedOccupied[p - stride + 1]! +
          paddedOccupied[p - 1]! +
          paddedOccupied[p + 1]! +
          paddedOccupied[p + stride - 1]! +
          paddedOccupied[p + stride]! +
          paddedOccupied[p + stride + 1]!;
      }
    }

    return { paddedOccupied, degrees };
  }
}

export function parseWarehouse(raw: string): WarehouseFloor {
  const grid = Grid2D.fromLines<WarehouseCell>(raw, (ch, row, col) => {
    if (ch !== '.' && ch !== '@') {
      throw new Error(`Invalid warehouse cell '${ch}' at row ${row}, col ${col}; expected '.' or '@'`);
    }
    return ch;
  });
  return new WarehouseFloor(grid);
}
