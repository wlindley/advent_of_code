export type SchematicKind = 'lock' | 'key';

/** Immutable pin-height representation of a single lock or key schematic. */
export class TumblerSchematic {
  readonly id: string;
  readonly kind: SchematicKind;
  readonly height: number;
  readonly heights: readonly number[];

  constructor(id: string, kind: SchematicKind, height: number, heights: readonly number[]) {
    if (id.trim().length === 0) throw new RangeError('Schematic id must be non-empty');
    if (!Number.isInteger(height) || height < 2) throw new RangeError(`Invalid height: ${height}`);
    if (heights.length === 0) throw new RangeError('Schematic must have at least one column');
    const maxPin = height - 2;
    for (const h of heights) {
      if (!Number.isInteger(h) || h < 0 || h > maxPin) {
        throw new RangeError(`Pin height ${h} out of range [0, ${maxPin}]`);
      }
    }
    this.id = id;
    this.kind = kind;
    this.height = height;
    this.heights = Object.freeze([...heights]);
    Object.freeze(this);
  }

  get width(): number { return this.heights.length; }
  get maxPinHeight(): number { return this.height - 2; }
  get profileLabel(): string { return this.heights.join(','); }

  /** Returns true iff this schematic fits the opposite-kind schematic with zero column overlap. */
  fitsWith(other: TumblerSchematic): boolean {
    if (this.kind === other.kind) {
      throw new Error(`Cannot test ${this.kind} ${this.id} against same kind ${other.id}`);
    }
    if (this.width !== other.width || this.height !== other.height) {
      throw new RangeError(`Dimension mismatch: (${this.width}x${this.height}) vs (${other.width}x${other.height})`);
    }
    const maxPin = this.maxPinHeight;
    for (let c = 0; c < this.heights.length; c += 1) {
      if (this.heights[c]! + other.heights[c]! > maxPin) return false;
    }
    return true;
  }
}

function assertSchematicsMatch(
  items: readonly TumblerSchematic[], expectedKind: SchematicKind, width: number, height: number,
): void {
  for (const item of items) {
    if (item.kind !== expectedKind) throw new Error(`Expected ${expectedKind}, got ${item.kind} (${item.id})`);
    if (item.width !== width || item.height !== height) {
      throw new RangeError(`Dimension mismatch for ${item.id}: (${item.width}x${item.height}) vs (${width}x${height})`);
    }
  }
}

/** Immutable collection of uniform-dimension locks and keys. */
export class TumblerInventory {
  readonly width: number;
  readonly height: number;
  readonly locks: readonly TumblerSchematic[];
  readonly keys: readonly TumblerSchematic[];

  constructor(width: number, height: number, locks: readonly TumblerSchematic[], keys: readonly TumblerSchematic[]) {
    if (!Number.isInteger(width) || width < 1) throw new RangeError(`Invalid width: ${width}`);
    if (!Number.isInteger(height) || height < 2) throw new RangeError(`Invalid height: ${height}`);
    assertSchematicsMatch(locks, 'lock', width, height);
    assertSchematicsMatch(keys, 'key', width, height);
    this.width = width;
    this.height = height;
    this.locks = Object.freeze([...locks]);
    this.keys = Object.freeze([...keys]);
    Object.freeze(this);
  }

  get maxPinHeight(): number { return this.height - 2; }
  get totalSchematics(): number { return this.locks.length + this.keys.length; }
  get totalPairs(): number { return this.locks.length * this.keys.length; }
}

function classifyBlockKind(topRow: string, bottomRow: string, index: number): SchematicKind {
  if (/^#+$/.test(topRow) && /^\.+$/.test(bottomRow)) return 'lock';
  if (/^\.+$/.test(topRow) && /^#+$/.test(bottomRow)) return 'key';
  throw new Error(`Schematic #${index + 1} must have solid # base and . opposite edge`);
}

function extractPinHeights(rows: readonly string[], kind: SchematicKind, width: number, height: number): number[] {
  const start = kind === 'lock' ? 1 : height - 2;
  const step = kind === 'lock' ? 1 : -1;
  const span = height - 2;
  const heights: number[] = [];
  for (let c = 0; c < width; c += 1) {
    let pinHeight = 0;
    let seenGap = false;
    for (let k = 0; k < span; k += 1) {
      if (rows[start + k * step]![c]! === '#') {
        if (seenGap) throw new Error(`Non-contiguous pin in column ${c}`);
        pinHeight += 1;
      } else {
        seenGap = true;
      }
    }
    heights.push(pinHeight);
  }
  return heights;
}

function parseSingleBlock(block: string, index: number): { kind: SchematicKind; height: number; heights: number[] } {
  const rows = block.split('\n').map((line) => line.trim());
  if (rows.length < 2) throw new Error(`Schematic #${index + 1} must have at least 2 rows`);
  const width = rows[0]!.length;
  for (const row of rows) {
    if (row.length !== width || !/^[#.]+$/.test(row)) throw new Error(`Invalid row in schematic #${index + 1}`);
  }
  const kind = classifyBlockKind(rows[0]!, rows[rows.length - 1]!, index);
  return { kind, height: rows.length, heights: extractPinHeights(rows, kind, width, rows.length) };
}

/** Parses blank-line-separated ASCII schematics into a validated `TumblerInventory`. */
export function parseSchematics(raw: string): TumblerInventory {
  const normalized = raw.replace(/\r\n?/g, '\n').trim();
  if (normalized.length === 0) throw new RangeError('Input contains no schematics');
  const blocks = normalized.split(/\n\s*\n/);
  const first = parseSingleBlock(blocks[0]!, 0);
  const width = first.heights.length;
  const height = first.height;
  const locks: TumblerSchematic[] = [];
  const keys: TumblerSchematic[] = [];
  for (let i = 0; i < blocks.length; i += 1) {
    const parsed = i === 0 ? first : parseSingleBlock(blocks[i]!, i);
    if (parsed.heights.length !== width || parsed.height !== height) {
      throw new RangeError(`Schematic #${i + 1} dimension mismatch`);
    }
    if (parsed.kind === 'lock') locks.push(new TumblerSchematic(`L${locks.length + 1}`, 'lock', height, parsed.heights));
    else keys.push(new TumblerSchematic(`K${keys.length + 1}`, 'key', height, parsed.heights));
  }
  return new TumblerInventory(width, height, locks, keys);
}
