import type { TumblerInventory, TumblerSchematic } from './schematic';

/** Per-column clearance and collision analysis for a single lock/key pair. */
export class PairFitEvaluation {
  readonly lock: TumblerSchematic;
  readonly key: TumblerSchematic;
  readonly lockIndex: number;
  readonly keyIndex: number;

  constructor(lock: TumblerSchematic, key: TumblerSchematic, lockIndex: number, keyIndex: number) {
    if (lock.kind !== 'lock') throw new Error(`Expected lock schematic, got ${lock.kind}`);
    if (key.kind !== 'key') throw new Error(`Expected key schematic, got ${key.kind}`);
    if (lock.width !== key.width || lock.height !== key.height) {
      throw new RangeError(
        `Dimension mismatch: (${lock.width}x${lock.height}) vs (${key.width}x${key.height})`,
      );
    }
    if (!Number.isInteger(lockIndex) || lockIndex < 0) {
      throw new RangeError(`lockIndex must be a non-negative integer, got ${lockIndex}`);
    }
    if (!Number.isInteger(keyIndex) || keyIndex < 0) {
      throw new RangeError(`keyIndex must be a non-negative integer, got ${keyIndex}`);
    }
    this.lock = lock;
    this.key = key;
    this.lockIndex = lockIndex;
    this.keyIndex = keyIndex;
    Object.freeze(this);
  }

  get maxPinHeight(): number { return this.lock.maxPinHeight; }

  get columnSums(): readonly number[] {
    const sums: number[] = [];
    for (let c = 0; c < this.lock.width; c += 1) {
      sums.push(this.lock.heights[c]! + this.key.heights[c]!);
    }
    return Object.freeze(sums);
  }

  get columnClearances(): readonly number[] {
    const maxPin = this.maxPinHeight;
    const clearances: number[] = [];
    for (let c = 0; c < this.lock.width; c += 1) {
      clearances.push(maxPin - (this.lock.heights[c]! + this.key.heights[c]!));
    }
    return Object.freeze(clearances);
  }

  get collidingColumns(): readonly number[] {
    const maxPin = this.maxPinHeight;
    const cols: number[] = [];
    for (let c = 0; c < this.lock.width; c += 1) {
      if (this.lock.heights[c]! + this.key.heights[c]! > maxPin) cols.push(c);
    }
    return Object.freeze(cols);
  }

  get fits(): boolean { return this.lock.fitsWith(this.key); }
}

/** Evaluates fit and column clearances for the indexed lock/key pair in an inventory. */
export function evaluatePairFit(inventory: TumblerInventory, lockIndex: number, keyIndex: number): PairFitEvaluation {
  if (!Number.isInteger(lockIndex) || lockIndex < 0 || lockIndex >= inventory.locks.length) {
    throw new RangeError(`lockIndex ${lockIndex} out of bounds [0, ${inventory.locks.length - 1}]`);
  }
  if (!Number.isInteger(keyIndex) || keyIndex < 0 || keyIndex >= inventory.keys.length) {
    throw new RangeError(`keyIndex ${keyIndex} out of bounds [0, ${inventory.keys.length - 1}]`);
  }
  return new PairFitEvaluation(inventory.locks[lockIndex]!, inventory.keys[keyIndex]!, lockIndex, keyIndex);
}

/** Counts all unique (lock, key) pairs whose columns fit without overlap. */
export function countFittingPairs(inventory: TumblerInventory): number {
  let count = 0;
  for (const lock of inventory.locks) {
    for (const key of inventory.keys) {
      if (lock.fitsWith(key)) count += 1;
    }
  }
  return count;
}
