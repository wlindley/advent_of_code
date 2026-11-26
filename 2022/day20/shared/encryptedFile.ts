/** Circular offsets from 0 used to read the three grove coordinates. */
export const GROVE_OFFSETS = Object.freeze([1000, 2000, 3000] as const);

/** Configuration controlling round count, decryption key scaling, and optional sqrt block size. */
export interface MixConfig {
  readonly rounds: number;
  readonly decryptionKey: bigint;
  readonly blockSize?: number;
}

/** Validates a MixConfig at domain entry boundaries. */
export function validateMixConfig(config: MixConfig): void {
  if (!Number.isInteger(config.rounds) || config.rounds < 1) {
    throw new RangeError(`rounds must be a positive integer, got ${config.rounds}`);
  }
  if (config.blockSize !== undefined && (!Number.isInteger(config.blockSize) || config.blockSize < 1)) {
    throw new RangeError(`blockSize must be a positive integer, got ${config.blockSize}`);
  }
}

function countZeros(values: readonly bigint[]): number {
  let count = 0;
  for (const value of values) {
    if (value === 0n) count += 1;
  }
  return count;
}

/** Immutable encrypted coordinate list containing at least one entry and a unique 0n marker. */
export class EncryptedFile {
  readonly values: readonly bigint[];

  constructor(values: readonly bigint[]) {
    if (values.length < 1) {
      throw new RangeError('EncryptedFile requires at least one value');
    }
    if (countZeros(values) !== 1) {
      throw new RangeError('EncryptedFile must contain exactly one 0n entry');
    }
    this.values = Object.freeze([...values]);
    Object.freeze(this);
  }

  get length(): number {
    return this.values.length;
  }

  get zeroId(): number {
    return this.values.indexOf(0n);
  }

  scaledValues(decryptionKey: bigint): readonly bigint[] {
    return Object.freeze(this.values.map((value) => value * decryptionKey));
  }
}

/** Immutable extracted grove coordinates and ring indices with dynamically computed sum. */
export class GroveCoordinates {
  readonly first: bigint;
  readonly second: bigint;
  readonly third: bigint;
  readonly zeroIndex: number;
  readonly offsetIndices: readonly [number, number, number];

  constructor(
    first: bigint,
    second: bigint,
    third: bigint,
    zeroIndex: number,
    offsetIndices: readonly [number, number, number],
  ) {
    for (const index of [zeroIndex, ...offsetIndices]) {
      if (!Number.isInteger(index) || index < 0) {
        throw new RangeError(`Ring indices must be non-negative integers, got ${index}`);
      }
    }
    this.first = first;
    this.second = second;
    this.third = third;
    this.zeroIndex = zeroIndex;
    this.offsetIndices = Object.freeze([offsetIndices[0], offsetIndices[1], offsetIndices[2]] as const);
    Object.freeze(this);
  }

  get sum(): bigint {
    return this.first + this.second + this.third;
  }
}
