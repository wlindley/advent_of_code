export const NEVER_CORRUPTED = 0x7fffffff;
export const UNVISITED = -1;

export interface ByteCoord {
  readonly x: number;
  readonly y: number;
}

export interface RamRunConfig {
  readonly gridSize: number;
  readonly fallenCount: number;
}

export const EXAMPLE_RAM_RUN_CONFIG: RamRunConfig = Object.freeze({
  gridSize: 7,
  fallenCount: 12,
});

export const DEFAULT_RAM_RUN_CONFIG: RamRunConfig = Object.freeze({
  gridSize: 71,
  fallenCount: 1024,
});

/** Validates that `value` is a non-negative safe integer. */
export function assertNonNegativeInt(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer, got ${value}`);
  }
}

function validateGridSize(gridSize: number): void {
  if (!Number.isSafeInteger(gridSize) || gridSize < 1) {
    throw new RangeError(`gridSize must be a positive integer, got ${gridSize}`);
  }
}

/** Immutable memory coordinate grid recording each cell's earliest byte corruption index. */
export class MemorySpace {
  readonly gridSize: number;
  readonly bytes: readonly ByteCoord[];
  private readonly firstFallIndex: Int32Array;

  constructor(gridSize: number, bytes: readonly ByteCoord[]) {
    validateGridSize(gridSize);
    this.gridSize = gridSize;
    const firstFallIndex = new Int32Array(gridSize * gridSize).fill(NEVER_CORRUPTED);
    const copiedBytes: ByteCoord[] = [];

    for (let i = 0; i < bytes.length; i += 1) {
      const byte = bytes[i]!;
      const idx = this.cellIndex(byte.x, byte.y);
      copiedBytes.push(Object.freeze({ x: byte.x, y: byte.y }));
      // Keep only the earliest fall timestamp when a coordinate appears multiple times.
      if (firstFallIndex[idx] === NEVER_CORRUPTED) {
        firstFallIndex[idx] = i;
      }
    }

    this.bytes = Object.freeze(copiedBytes);
    this.firstFallIndex = firstFallIndex;
    Object.freeze(this);
  }

  get cellCount(): number {
    return this.gridSize * this.gridSize;
  }

  get byteCount(): number {
    return this.bytes.length;
  }

  inBounds(x: number, y: number): boolean {
    return (
      Number.isInteger(x) &&
      Number.isInteger(y) &&
      x >= 0 &&
      x < this.gridSize &&
      y >= 0 &&
      y < this.gridSize
    );
  }

  cellIndex(x: number, y: number): number {
    if (!this.inBounds(x, y)) {
      throw new RangeError(`Coordinate (${x}, ${y}) out of bounds for ${this.gridSize}x${this.gridSize}`);
    }
    return y * this.gridSize + x;
  }

  coordOf(index: number): ByteCoord {
    if (!Number.isInteger(index) || index < 0 || index >= this.cellCount) {
      throw new RangeError(`Cell index ${index} out of bounds for ${this.cellCount} cells`);
    }
    const x = index % this.gridSize;
    const y = (index - x) / this.gridSize;
    return Object.freeze({ x, y });
  }

  firstFallAt(x: number, y: number): number {
    return this.firstFallIndex[this.cellIndex(x, y)]!;
  }

  isCorruptedAt(x: number, y: number, fallenCount: number): boolean {
    assertNonNegativeInt(fallenCount, 'fallenCount');
    const fall = this.firstFallAt(x, y);
    return fall !== NEVER_CORRUPTED && fall < fallenCount;
  }

  copyFirstFallIndices(): Int32Array {
    return this.firstFallIndex.slice();
  }
}
