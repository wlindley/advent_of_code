import { Grid2D } from '../../../shared/core';

export type CellState = '.' | 'L' | '#';

export interface SeatCoord {
  readonly row: number;
  readonly col: number;
}

interface IndexedSeats {
  readonly cellToSeat: Int32Array;
  readonly seats: readonly SeatCoord[];
  readonly initialOccupancy: Uint8Array;
}

const CELL_CHAR_MAP = new Map<string, CellState>([
  ['.', '.'],
  ['L', 'L'],
  ['#', '#'],
]);

function mapSeatingCell(ch: string, row: number, col: number): CellState {
  const cell = CELL_CHAR_MAP.get(ch);
  if (cell === undefined) {
    throw new Error(`Invalid cell character ${JSON.stringify(ch)} at (${row}, ${col})`);
  }
  return cell;
}

function indexSeats(grid: Grid2D<CellState>): IndexedSeats {
  const cellToSeat = new Int32Array(grid.size).fill(-1);
  const seats: SeatCoord[] = [];
  const initialBits: number[] = [];

  for (let row = 0; row < grid.rows; row += 1) {
    for (let col = 0; col < grid.cols; col += 1) {
      const cell = grid.at(row, col);
      if (cell === '.') continue;
      cellToSeat[row * grid.cols + col] = seats.length;
      seats.push(Object.freeze({ row, col }));
      initialBits.push(cell === '#' ? 1 : 0);
    }
  }

  return {
    cellToSeat,
    seats: Object.freeze(seats),
    initialOccupancy: Uint8Array.from(initialBits),
  };
}

/** Immutable ferry seating layout mapping 2D grid cells to compact seat indices. */
export class SeatingLayout {
  readonly grid: Grid2D<CellState>;
  private readonly seats: readonly SeatCoord[];
  private readonly cellToSeat: Int32Array;
  private readonly initialOccupancy: Uint8Array;

  constructor(grid: Grid2D<CellState>) {
    const indexed = indexSeats(grid);
    this.grid = grid;
    this.seats = indexed.seats;
    this.cellToSeat = indexed.cellToSeat;
    this.initialOccupancy = indexed.initialOccupancy;
    Object.freeze(this);
  }

  get rows(): number {
    return this.grid.rows;
  }

  get cols(): number {
    return this.grid.cols;
  }

  get totalCells(): number {
    return this.grid.size;
  }

  get seatCount(): number {
    return this.seats.length;
  }

  get floorCount(): number {
    return this.totalCells - this.seatCount;
  }

  get initialOccupiedCount(): number {
    let total = 0;
    for (let i = 0; i < this.initialOccupancy.length; i += 1) {
      total += this.initialOccupancy[i]!;
    }
    return total;
  }

  seatIndexAt(row: number, col: number): number | null {
    if (!this.grid.inBounds(row, col)) return null;
    const index = this.cellToSeat[row * this.grid.cols + col]!;
    return index >= 0 ? index : null;
  }

  coordOf(seatIndex: number): SeatCoord {
    if (!Number.isInteger(seatIndex) || seatIndex < 0 || seatIndex >= this.seats.length) {
      throw new RangeError(`Seat index ${seatIndex} out of bounds for ${this.seats.length} seats`);
    }
    return this.seats[seatIndex]!;
  }

  copyInitialOccupancy(): Uint8Array {
    return this.initialOccupancy.slice();
  }
}

/** Parses a rectangular ferry seating grid of `.`, `L`, and `#` cells. */
export function parseSeatingLayout(raw: string): SeatingLayout {
  return new SeatingLayout(Grid2D.fromLines(raw, mapSeatingCell));
}
