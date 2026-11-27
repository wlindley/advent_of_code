import { DIRS_4 } from '../../../shared/core';

export type PortalSide = 'outer' | 'inner';

export interface GridPoint { readonly row: number; readonly col: number; }

export interface PortalNode {
  readonly id: number;
  readonly label: string;
  readonly row: number;
  readonly col: number;
  readonly side: PortalSide;
  readonly pairId: number;
  readonly labelRow: number;
  readonly labelCol: number;
}

interface MazeBounds { readonly minRow: number; readonly maxRow: number; readonly minCol: number; readonly maxCol: number; }

type PortalDraft = { -readonly [K in keyof PortalNode]: PortalNode[K] };

const isUpper = (code: number): boolean => code >= 65 && code <= 90;
const isValidCode = (code: number): boolean => code === 32 || code === 35 || code === 46 || isUpper(code);

function trimBlankLines(raw: string): readonly string[] {
  const rawLines = raw.split(/\r?\n/);
  let start = 0;
  while (start < rawLines.length && rawLines[start]!.trim().length === 0) start += 1;
  let end = rawLines.length - 1;
  while (end >= start && rawLines[end]!.trim().length === 0) end -= 1;
  if (start > end) throw new Error('Donut maze input cannot be empty');
  return rawLines.slice(start, end + 1);
}

function buildAsciiGrid(lines: readonly string[]): { rows: number; cols: number; grid: Uint8Array; bounds: MazeBounds } {
  const rows = lines.length;
  let cols = 0;
  for (const line of lines) if (line.length > cols) cols = line.length;
  const grid = new Uint8Array(rows * cols).fill(32);
  let [minRow, maxRow, minCol, maxCol] = [rows, -1, cols, -1];
  for (let r = 0; r < rows; r += 1) {
    const line = lines[r]!;
    for (let c = 0; c < line.length; c += 1) {
      const code = line.charCodeAt(c);
      if (!isValidCode(code)) throw new Error(`Invalid character '${line[c]!}' at (${r}, ${c})`);
      grid[r * cols + c] = code;
      if (code === 35 || code === 46) {
        if (r < minRow) minRow = r;
        if (r > maxRow) maxRow = r;
        if (c < minCol) minCol = c;
        if (c > maxCol) maxCol = c;
      }
    }
  }
  if (maxRow < 0) throw new Error('Maze must contain at least one wall or corridor');
  return { rows, cols, grid, bounds: { minRow, maxRow, minCol, maxCol } };
}

function extractPortals(rows: number, cols: number, grid: Uint8Array, bounds: MazeBounds): PortalDraft[] {
  const drafts: PortalDraft[] = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (grid[r * cols + c] !== 46) continue;
      for (const [dr, dc] of DIRS_4) {
        const [r1, c1] = [r + dr, c + dc];
        if (r1 < 0 || r1 >= rows || c1 < 0 || c1 >= cols || !isUpper(grid[r1 * cols + c1]!)) continue;
        const [r2, c2] = [r + 2 * dr, c + 2 * dc];
        if (r2 < 0 || r2 >= rows || c2 < 0 || c2 >= cols || !isUpper(grid[r2 * cols + c2]!)) {
          throw new Error(`Truncated portal label adjacent to '.' at (${r}, ${c})`);
        }
        const [ch1, ch2] = [String.fromCharCode(grid[r1 * cols + c1]!), String.fromCharCode(grid[r2 * cols + c2]!)];
        const label = dr < 0 || dc < 0 ? ch2 + ch1 : ch1 + ch2;
        const side: PortalSide = r1 < bounds.minRow || r1 > bounds.maxRow || c1 < bounds.minCol || c1 > bounds.maxCol ? 'outer' : 'inner';
        drafts.push({ id: drafts.length, label, row: r, col: c, side, pairId: -1, labelRow: r1, labelCol: c1 });
      }
    }
  }
  return drafts;
}

function linkPortals(drafts: PortalDraft[]): { portals: readonly PortalNode[]; startId: number; goalId: number } {
  const byLabel = new Map<string, number[]>();
  for (const p of drafts) {
    const list = byLabel.get(p.label);
    if (list) list.push(p.id);
    else byLabel.set(p.label, [p.id]);
  }
  const aa = byLabel.get('AA');
  if (!aa || aa.length !== 1) throw new Error('Maze must contain exactly one AA portal');
  const zz = byLabel.get('ZZ');
  if (!zz || zz.length !== 1) throw new Error('Maze must contain exactly one ZZ portal');
  for (const [label, ids] of byLabel) {
    if (label === 'AA' || label === 'ZZ') continue;
    if (ids.length !== 2) throw new Error(`Portal ${label} must appear exactly twice, found ${ids.length}`);
    drafts[ids[0]!]!.pairId = ids[1]!;
    drafts[ids[1]!]!.pairId = ids[0]!;
  }
  return { portals: Object.freeze(drafts.map((d) => Object.freeze({ ...d }))), startId: aa[0]!, goalId: zz[0]! };
}

/** Immutable parsed Donut Maze with private unfrozen ASCII grid and paired portal metadata. */
export class DonutMaze {
  readonly rows: number;
  readonly cols: number;
  private readonly grid: Uint8Array;
  readonly portals: readonly PortalNode[];
  readonly startId: number;
  readonly goalId: number;

  constructor(rows: number, cols: number, grid: Uint8Array, portals: readonly PortalNode[], startId: number, goalId: number) {
    this.rows = rows;
    this.cols = cols;
    this.grid = grid;
    this.portals = portals;
    this.startId = startId;
    this.goalId = goalId;
    Object.freeze(this);
  }

  inBounds(row: number, col: number): boolean {
    return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
  }

  codeAt(row: number, col: number): number {
    if (!this.inBounds(row, col)) throw new RangeError(`Coordinates (${row}, ${col}) out of bounds for ${this.rows}x${this.cols}`);
    return this.grid[row * this.cols + col]!;
  }

  charAt(row: number, col: number): string {
    return String.fromCharCode(this.codeAt(row, col));
  }

  isOpen(row: number, col: number): boolean {
    return this.inBounds(row, col) && this.grid[row * this.cols + col] === 46;
  }
}

export function parseDonutMaze(raw: string): DonutMaze {
  const { rows, cols, grid, bounds } = buildAsciiGrid(trimBlankLines(raw));
  const drafts = extractPortals(rows, cols, grid, bounds);
  const { portals, startId, goalId } = linkPortals(drafts);
  return new DonutMaze(rows, cols, grid, portals, startId, goalId);
}
