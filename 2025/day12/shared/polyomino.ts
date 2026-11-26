export interface CellCoord {
  readonly row: number;
  readonly col: number;
}

function normalizeCells(cells: readonly CellCoord[]): readonly CellCoord[] {
  let minRow = Infinity;
  let minCol = Infinity;
  for (const c of cells) {
    if (c.row < minRow) minRow = c.row;
    if (c.col < minCol) minCol = c.col;
  }
  return Object.freeze(
    cells
      .map((c) => Object.freeze({ row: c.row - minRow, col: c.col - minCol }))
      .sort((a, b) => a.col - b.col || a.row - b.row),
  );
}

function maxRowPlusOne(cells: readonly CellCoord[]): number {
  let maxRow = 0;
  for (const c of cells) if (c.row > maxRow) maxRow = c.row;
  return maxRow + 1;
}

/** Tight-normalized polyomino orientation sorted column-major for scanline placement. */
export class PolyominoOrientation {
  readonly cells: readonly CellCoord[];

  constructor(cells: readonly CellCoord[]) {
    this.cells = normalizeCells(cells);
    Object.freeze(this);
  }

  get area(): number { return this.cells.length; }
  get anchorRow(): number { return this.cells[0]!.row; }
  get width(): number { return this.cells[this.cells.length - 1]!.col + 1; }
  get height(): number { return maxRowPlusOne(this.cells); }
}

/** Canonical polyomino shape with validated coordinates and D4 symmetry group. */
export class PolyominoShape {
  readonly id: number;
  readonly cells: readonly CellCoord[];

  constructor(id: number, cells: readonly CellCoord[]) {
    if (!Number.isSafeInteger(id) || id < 0) {
      throw new RangeError(`Shape id must be a non-negative integer, got ${id}`);
    }
    if (cells.length === 0) {
      throw new RangeError(`Shape ${id} must contain at least one cell`);
    }
    const seen = new Set<string>();
    for (const c of cells) {
      if (!Number.isSafeInteger(c.row) || !Number.isSafeInteger(c.col)) {
        throw new RangeError(`Shape ${id} has non-integer coordinate (${c.row}, ${c.col})`);
      }
      const key = `${c.row},${c.col}`;
      if (seen.has(key)) throw new Error(`Shape ${id} has duplicate coordinate (${key})`);
      seen.add(key);
    }
    this.id = id;
    this.cells = normalizeCells(cells);
    Object.freeze(this);
  }

  get area(): number { return this.cells.length; }
  get width(): number { return this.cells[this.cells.length - 1]!.col + 1; }
  get height(): number { return maxRowPlusOne(this.cells); }
  get shortSide(): number { return Math.min(this.width, this.height); }
  get longSide(): number { return Math.max(this.width, this.height); }

  get orientations(): readonly PolyominoOrientation[] {
    const unique = new Map<string, PolyominoOrientation>();
    for (const flip of [1, -1] as const) {
      for (let rot = 0; rot < 4; rot++) {
        const transformed = this.cells.map(({ row, col }) => {
          const fc = col * flip;
          if (rot === 0) return { row, col: fc };
          if (rot === 1) return { row: fc, col: -row };
          if (rot === 2) return { row: -row, col: -fc };
          return { row: -fc, col: row };
        });
        const orient = new PolyominoOrientation(transformed);
        const key = orient.cells.map((p) => `${p.row},${p.col}`).join(';');
        if (!unique.has(key)) unique.set(key, orient);
      }
    }
    return Object.freeze([...unique.values()]);
  }

  fitsIn(width: number, height: number): boolean {
    return this.shortSide <= Math.min(width, height) && this.longSide <= Math.max(width, height);
  }

  orientationFitting(boxWidth: number, boxHeight: number): PolyominoOrientation | null {
    return this.orientations.find((o) => o.width <= boxWidth && o.height <= boxHeight) ?? null;
  }
}
