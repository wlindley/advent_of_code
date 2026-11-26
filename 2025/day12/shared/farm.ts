import { PolyominoShape, type CellCoord } from './polyomino';

function assertPosInt(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 1) throw new RangeError(`${label} must be >= 1, got ${value}`);
}

/** Rectangular under-tree region with target dimensions and per-shape counts. */
export class TreeRegion {
  readonly width: number;
  readonly height: number;
  readonly counts: readonly number[];

  constructor(width: number, height: number, counts: readonly number[]) {
    assertPosInt(width, 'width');
    assertPosInt(height, 'height');
    if (counts.length === 0) throw new RangeError('counts must not be empty');
    for (const c of counts) {
      if (!Number.isSafeInteger(c) || c < 0) throw new RangeError(`invalid count ${c}`);
    }
    this.width = width;
    this.height = height;
    this.counts = Object.freeze([...counts]);
    Object.freeze(this);
  }

  get area(): number { return this.width * this.height; }
  get totalPieces(): number { return this.counts.reduce((sum, n) => sum + n, 0); }
}

/** Validated Christmas Tree Farm puzzle instance with indexed shapes and regions. */
export class TreeFarm {
  readonly shapes: readonly PolyominoShape[];
  readonly regions: readonly TreeRegion[];

  constructor(shapes: readonly PolyominoShape[], regions: readonly TreeRegion[]) {
    if (shapes.length === 0) throw new RangeError('TreeFarm requires at least one shape');
    if (regions.length === 0) throw new RangeError('TreeFarm requires at least one region');
    shapes.forEach((s, i) => {
      if (s.id !== i) throw new Error(`Expected shape id ${i}, got ${s.id}`);
    });
    for (const r of regions) {
      if (r.counts.length !== shapes.length) throw new Error(`Region counts length != ${shapes.length}`);
    }
    this.shapes = Object.freeze([...shapes]);
    this.regions = Object.freeze([...regions]);
    Object.freeze(this);
  }
}

/** Parses `<id>:` polyomino blocks followed by `<W>x<H>: <c_0> ...` region lines. */
export function parseTreeFarm(raw: string): TreeFarm {
  const shapes: PolyominoShape[] = [];
  const regions: TreeRegion[] = [];
  let currentId: number | null = null;
  let rows: string[] = [];

  const flushShape = (): void => {
    if (currentId === null) return;
    if (rows.length === 0) throw new Error(`Shape ${currentId} has no grid rows`);
    const width = rows[0]!.length;
    const cells: CellCoord[] = [];
    rows.forEach((row, r) => {
      if (row.length !== width) throw new Error(`Shape ${currentId} jagged at row ${r}`);
      for (let c = 0; c < width; c++) {
        const ch = row[c]!;
        if (ch === '#') cells.push({ row: r, col: c });
        else if (ch !== '.') throw new Error(`Invalid char '${ch}' in shape ${currentId}`);
      }
    });
    shapes.push(new PolyominoShape(currentId, cells));
    currentId = null;
    rows = [];
  };

  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === '') { flushShape(); continue; }
    const sm = /^(\d+):$/.exec(line);
    if (sm) {
      flushShape();
      if (regions.length > 0) throw new Error('Shape block after region lines');
      currentId = Number(sm[1]);
      continue;
    }
    const rm = /^(\d+)x(\d+):\s*(\d+(?:\s+\d+)*)$/.exec(line);
    if (rm) {
      flushShape();
      regions.push(new TreeRegion(Number(rm[1]), Number(rm[2]), rm[3]!.split(/\s+/).map(Number)));
      continue;
    }
    if (currentId !== null) { rows.push(line); continue; }
    throw new Error(`Invalid line: "${line}"`);
  }

  flushShape();
  return new TreeFarm(shapes, regions);
}
