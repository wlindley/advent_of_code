import { describe, expect, it } from 'vitest';
import {
  EncryptedFile,
  GROVE_OFFSETS,
  GroveCoordinates,
  type MixConfig,
  validateMixConfig,
} from './encryptedFile';

describe('GROVE_OFFSETS', () => {
  it('defines the three frozen coordinate offsets', () => {
    expect(GROVE_OFFSETS).toEqual([1000, 2000, 3000]);
    expect(Object.isFrozen(GROVE_OFFSETS)).toBe(true);
  });
});

describe('EncryptedFile', () => {
  it('freezes values and computes length and zeroId dynamically', () => {
    const source = [1n, 2n, -3n, 0n, 4n];
    const file = new EncryptedFile(source);
    source[0] = 99n;

    expect(file.values).toEqual([1n, 2n, -3n, 0n, 4n]);
    expect(file.length).toBe(5);
    expect(file.zeroId).toBe(3);
    expect(Object.isFrozen(file)).toBe(true);
    expect(Object.isFrozen(file.values)).toBe(true);
  });

  it('scales values by decryption key without mutating original', () => {
    const file = new EncryptedFile([2n, 0n, -5n]);
    const scaled = file.scaledValues(811589153n);
    expect(scaled).toEqual([1623178306n, 0n, -4057945765n]);
    expect(Object.isFrozen(scaled)).toBe(true);
    expect(file.values).toEqual([2n, 0n, -5n]);
  });

  it('rejects empty value lists', () => {
    expect(() => new EncryptedFile([])).toThrow(RangeError);
  });

  it('rejects files without zero or with multiple zeros', () => {
    expect(() => new EncryptedFile([1n, 2n, 3n])).toThrow(RangeError);
    expect(() => new EncryptedFile([0n, 1n, 0n])).toThrow(RangeError);
  });
});

describe('GroveCoordinates', () => {
  it('freezes fields and computes sum dynamically', () => {
    const coords = new GroveCoordinates(4n, -3n, 2n, 3, [6, 5, 4]);
    expect(coords.sum).toBe(3n);
    expect(coords.zeroIndex).toBe(3);
    expect(coords.offsetIndices).toEqual([6, 5, 4]);
    expect(Object.isFrozen(coords)).toBe(true);
    expect(Object.isFrozen(coords.offsetIndices)).toBe(true);
  });

  it('rejects negative or non-integer zeroIndex and offsetIndices', () => {
    expect(() => new GroveCoordinates(1n, 2n, 3n, -1, [0, 1, 2])).toThrow(RangeError);
    expect(() => new GroveCoordinates(1n, 2n, 3n, 1.5, [0, 1, 2])).toThrow(RangeError);
    expect(() => new GroveCoordinates(1n, 2n, 3n, 0, [0, -2, 2])).toThrow(RangeError);
    expect(() => new GroveCoordinates(1n, 2n, 3n, 0, [0, 1, 2.2])).toThrow(RangeError);
  });
});

describe('validateMixConfig', () => {
  it('accepts valid rounds and optional blockSize', () => {
    const c1: MixConfig = { rounds: 1, decryptionKey: 1n };
    const c2: MixConfig = { rounds: 10, decryptionKey: 811589153n, blockSize: 4 };
    expect(() => validateMixConfig(c1)).not.toThrow();
    expect(() => validateMixConfig(c2)).not.toThrow();
  });

  it('rejects invalid rounds or invalid blockSize', () => {
    expect(() => validateMixConfig({ rounds: 0, decryptionKey: 1n })).toThrow(RangeError);
    expect(() => validateMixConfig({ rounds: 1.5, decryptionKey: 1n })).toThrow(RangeError);
    expect(() => validateMixConfig({ rounds: 1, decryptionKey: 1n, blockSize: 0 })).toThrow(RangeError);
    expect(() => validateMixConfig({ rounds: 1, decryptionKey: 1n, blockSize: 2.5 })).toThrow(RangeError);
  });
});
