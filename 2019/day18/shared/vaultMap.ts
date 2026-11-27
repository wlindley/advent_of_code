import { DIRS_8, Grid2D } from '../../../shared/core';

/** Integer grid coordinate inside a vault map. */
export interface GridPoint {
  readonly row: number;
  readonly col: number;
}

/** Key metadata with compact node ID (`0..keyCount-1`) and 26-bit mask. */
export interface VaultKey {
  readonly id: number;
  readonly letter: string;
  readonly bit: number;
  readonly pos: GridPoint;
}

/** Immutable parsed Day 18 vault grid with fast private typed-array lookups. */
export class VaultMap {
  readonly grid: Grid2D<string>;
  readonly keys: readonly VaultKey[];
  readonly entrances: readonly GridPoint[];
  private readonly isWallArr: Uint8Array;
  private readonly keyIdArr: Int8Array;
  private readonly doorBitArr: Int32Array;

  constructor(
    grid: Grid2D<string>,
    keys: readonly VaultKey[],
    entrances: readonly GridPoint[],
    isWallArr: Uint8Array,
    keyIdArr: Int8Array,
    doorBitArr: Int32Array,
  ) {
    this.grid = grid;
    this.keys = Object.freeze(keys.map((k) => Object.freeze({ ...k, pos: Object.freeze(k.pos) })));
    this.entrances = Object.freeze(entrances.map((e) => Object.freeze(e)));
    this.isWallArr = isWallArr;
    this.keyIdArr = keyIdArr;
    this.doorBitArr = doorBitArr;
    Object.freeze(this);
  }

  get rows(): number {
    return this.grid.rows;
  }

  get cols(): number {
    return this.grid.cols;
  }

  get nodeCount(): number {
    return this.keys.length + this.entrances.length;
  }

  get allKeysMask(): number {
    let mask = 0;
    for (const key of this.keys) mask |= key.bit;
    return mask;
  }

  cellOf(row: number, col: number): number {
    return row * this.grid.cols + col;
  }

  pointOf(cell: number): GridPoint {
    return { row: Math.floor(cell / this.grid.cols), col: cell % this.grid.cols };
  }

  isWallCell(cell: number): boolean {
    return this.isWallArr[cell] === 1;
  }

  keyIdAtCell(cell: number): number {
    return this.keyIdArr[cell]!;
  }

  doorBitAtCell(cell: number): number {
    return this.doorBitArr[cell]!;
  }

  keyBitById(keyId: number): number {
    return this.keys[keyId]!.bit;
  }

  nodePos(nodeId: number): GridPoint {
    return nodeId < this.keys.length
      ? this.keys[nodeId]!.pos
      : this.entrances[nodeId - this.keys.length]!;
  }

  nodeCell(nodeId: number): number {
    const pos = this.nodePos(nodeId);
    return this.cellOf(pos.row, pos.col);
  }
}

function isValidVaultChar(ch: string): boolean {
  if (ch === '#' || ch === '.' || ch === '@') return true;
  const code = ch.charCodeAt(0);
  return (code >= 97 && code <= 122) || (code >= 65 && code <= 90);
}

function validateVaultChar(ch: string, row: number, col: number): string {
  if (!isValidVaultChar(ch)) {
    throw new Error(`Invalid vault character '${ch}' at (${row}, ${col})`);
  }
  return ch;
}

function assignSortedKeys(rawKeys: { letter: string; pos: GridPoint; cell: number }[], keyIdArr: Int8Array): VaultKey[] {
  rawKeys.sort((a, b) => a.letter.localeCompare(b.letter));
  return rawKeys.map((entry, id) => {
    keyIdArr[entry.cell] = id;
    return { id, letter: entry.letter, bit: 1 << (entry.letter.charCodeAt(0) - 97), pos: entry.pos };
  });
}

function buildVaultMap(grid: Grid2D<string>): VaultMap {
  const total = grid.size;
  const isWallArr = new Uint8Array(total);
  const keyIdArr = new Int8Array(total).fill(-1);
  const doorBitArr = new Int32Array(total);
  const entrances: GridPoint[] = [];
  const rawKeys: { letter: string; pos: GridPoint; cell: number }[] = [];
  const seenKeys = new Set<string>();

  for (let row = 0; row < grid.rows; row += 1) {
    for (let col = 0; col < grid.cols; col += 1) {
      const ch = grid.at(row, col);
      const cell = row * grid.cols + col;
      if (ch === '#') isWallArr[cell] = 1;
      else if (ch === '@') entrances.push({ row, col });
      else if (ch >= 'a') {
        if (seenKeys.has(ch)) throw new Error(`Duplicate key '${ch}' at (${row}, ${col})`);
        seenKeys.add(ch);
        rawKeys.push({ letter: ch, pos: { row, col }, cell });
      } else if (ch >= 'A') doorBitArr[cell] = 1 << (ch.charCodeAt(0) - 65);
    }
  }
  if (entrances.length === 0) throw new Error('Vault map must contain at least one entrance (@)');
  if (entrances.length > 4) throw new Error(`Vault map supports at most 4 entrances, got ${entrances.length}`);
  return new VaultMap(grid, assignSortedKeys(rawKeys, keyIdArr), entrances, isWallArr, keyIdArr, doorBitArr);
}

/** Parses and validates an ASCII Day 18 vault map. */
export function parseVaultMap(raw: string): VaultMap {
  const grid = Grid2D.fromLines(raw.trim(), validateVaultChar);
  return buildVaultMap(grid);
}

const QUAD_PATCH = ['@#@', '###', '@#@'] as const;

/** Replaces a single open-neighborhood `@` center with the 4-robot `@#@/###/@#@` split. */
export function splitVaultForQuadRobots(map: VaultMap): VaultMap {
  if (map.entrances.length !== 1) throw new Error('Quad-robot split requires a single entrance (@)');
  const center = map.entrances[0]!;
  if (center.row < 1 || center.row > map.rows - 2 || center.col < 1 || center.col > map.cols - 2) {
    throw new Error('Entrance must be strictly interior for quad-robot split');
  }
  for (const [dr, dc] of DIRS_8) {
    if (map.grid.at(center.row + dr, center.col + dc) !== '.') {
      throw new Error('Quad-robot split requires 8 open neighbors around the entrance');
    }
  }
  const cells: string[] = [];
  for (let row = 0; row < map.rows; row += 1) {
    for (let col = 0; col < map.cols; col += 1) cells.push(map.grid.at(row, col));
  }
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      cells[(center.row + dr) * map.cols + (center.col + dc)] = QUAD_PATCH[dr + 1]![dc + 1]!;
    }
  }
  return buildVaultMap(new Grid2D(map.rows, map.cols, cells));
}
