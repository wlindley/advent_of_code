/** Sentinel block value representing unallocated free disk space. */
export const FREE_BLOCK = -1;

function assertIntMin(value: number, min: number, name: string): void {
  if (!Number.isInteger(value) || value < min) {
    throw new RangeError(`${name} must be an integer >= ${min}, got ${value}`);
  }
}

/** Exact arithmetic-series checksum for a contiguous file extent `[start, start + length)`. */
export function extentChecksum(fileId: number, start: number, length: number): bigint {
  assertIntMin(fileId, 0, 'fileId');
  assertIntMin(start, 0, 'start');
  assertIntMin(length, 0, 'length');
  const len = BigInt(length);
  const s = BigInt(start);
  return BigInt(fileId) * ((len * (2n * s + len - 1n)) / 2n);
}

/** Immutable contiguous allocation of a single file on disk. */
export class FileExtent {
  readonly id: number;
  readonly start: number;
  readonly length: number;

  constructor(id: number, start: number, length: number) {
    assertIntMin(id, 0, 'id');
    assertIntMin(start, 0, 'start');
    assertIntMin(length, 0, 'length');
    this.id = id;
    this.start = start;
    this.length = length;
    Object.freeze(this);
  }

  get end(): number { return this.start + this.length; }
  get checksum(): bigint { return extentChecksum(this.id, this.start, this.length); }
}

/** Immutable contiguous free-space span of at least 1 block. */
export class FreeSpan {
  readonly start: number;
  readonly length: number;

  constructor(start: number, length: number) {
    assertIntMin(start, 0, 'start');
    assertIntMin(length, 1, 'length');
    this.start = start;
    this.length = length;
    Object.freeze(this);
  }

  get end(): number { return this.start + this.length; }
}

function validatePartition(files: readonly FileExtent[], freeSpans: readonly FreeSpan[]): void {
  if (files.length === 0) throw new RangeError('DiskMap requires at least one file extent');
  for (let i = 0; i < files.length; i += 1) {
    if (files[i]!.id !== i) throw new RangeError(`Expected sequential file id ${i}, got ${files[i]!.id}`);
  }
  let fi = 0;
  let si = 0;
  let cursor = 0;
  while (fi < files.length || si < freeSpans.length) {
    const file = files[fi];
    const span = freeSpans[si];
    if (file && file.start === cursor) {
      cursor = file.end;
      fi += 1;
    } else if (span && span.start === cursor) {
      cursor = span.end;
      si += 1;
    } else {
      throw new RangeError(`DiskMap partition broken at block ${cursor}`);
    }
  }
}

/** Immutable partitioned layout of file extents and free spans over `[0, totalBlocks)`. */
export class DiskMap {
  readonly files: readonly FileExtent[];
  readonly freeSpans: readonly FreeSpan[];

  constructor(files: readonly FileExtent[], freeSpans: readonly FreeSpan[]) {
    validatePartition(files, freeSpans);
    this.files = Object.freeze([...files]);
    this.freeSpans = Object.freeze([...freeSpans]);
    Object.freeze(this);
  }

  get fileCount(): number { return this.files.length; }
  get totalFileBlocks(): number { return this.files.reduce((sum, file) => sum + file.length, 0); }
  get totalFreeBlocks(): number { return this.freeSpans.reduce((sum, span) => sum + span.length, 0); }
  get totalBlocks(): number { return this.totalFileBlocks + this.totalFreeBlocks; }
  get initialChecksum(): bigint { return this.files.reduce((sum, file) => sum + file.checksum, 0n); }

  /** Expands the extent layout into a mutable block array (`FREE_BLOCK` for free space). */
  expandToBlocks(): Int32Array {
    const blocks = new Int32Array(this.totalBlocks).fill(FREE_BLOCK);
    for (const file of this.files) blocks.fill(file.id, file.start, file.end);
    return blocks;
  }
}

/** Parses a dense digit disk map into an immutable `DiskMap`. */
export function parseDiskMap(raw: string): DiskMap {
  const trimmed = raw.trim();
  if (!/^[0-9]+$/.test(trimmed)) {
    throw new Error('Disk map must be a non-empty string of ASCII digits');
  }
  const files: FileExtent[] = [];
  const freeSpans: FreeSpan[] = [];
  let cursor = 0;
  let fileId = 0;
  for (let i = 0; i < trimmed.length; i += 1) {
    const digit = trimmed.charCodeAt(i) - 48;
    if (i % 2 === 0) {
      files.push(new FileExtent(fileId, cursor, digit));
      fileId += 1;
    } else if (digit > 0) {
      freeSpans.push(new FreeSpan(cursor, digit));
    }
    cursor += digit;
  }
  return new DiskMap(files, freeSpans);
}
