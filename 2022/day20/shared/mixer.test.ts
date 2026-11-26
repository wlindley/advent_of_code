import { describe, expect, it } from 'vitest';
import { EncryptedFile } from './encryptedFile';
import { extractGroveCoordinates, mixEncryptedFile, solveGroveCoordinates } from './mixer';

const OFFICIAL_VALUES = [1n, 2n, -3n, 3n, -2n, 0n, 4n] as const;

describe('extractGroveCoordinates', () => {
  it('extracts coordinates at 1000, 2000, 3000 steps past zero', () => {
    const file = new EncryptedFile(OFFICIAL_VALUES);
    // Final order IDs for official example: [0, 1, 2, 6, 5, 3, 4] -> values [1, 2, -3, 4, 0, 3, -2]
    const coords = extractGroveCoordinates([0, 1, 2, 6, 5, 3, 4], file, 1n);
    expect(coords.zeroIndex).toBe(4);
    expect(coords.offsetIndices).toEqual([3, 2, 1]);
    expect(coords.first).toBe(4n);
    expect(coords.second).toBe(-3n);
    expect(coords.third).toBe(2n);
    expect(coords.sum).toBe(3n);
  });

  it('rejects mismatched length, invalid IDs, and missing zeroId', () => {
    const file = new EncryptedFile([5n, 0n, -5n]);
    expect(() => extractGroveCoordinates([0, 1], file, 1n)).toThrow(RangeError);
    expect(() => extractGroveCoordinates([0, -1, 2], file, 1n)).toThrow(RangeError);
    expect(() => extractGroveCoordinates([0, 3, 1], file, 1n)).toThrow(RangeError);
    expect(() => extractGroveCoordinates([0, 1.5, 2], file, 1n)).toThrow(RangeError);
    expect(() => extractGroveCoordinates([0, 2, 0], file, 1n)).toThrow(RangeError);
  });
});

describe('mixEncryptedFile & solveGroveCoordinates', () => {
  it('solves the official Part 1 and Part 2 examples', () => {
    const file = new EncryptedFile(OFFICIAL_VALUES);
    const part1 = mixEncryptedFile(file, { rounds: 1, decryptionKey: 1n });
    expect(Object.isFrozen(part1)).toBe(true);
    expect(part1.coordinates.sum).toBe(3n);
    expect(solveGroveCoordinates(file, { rounds: 1, decryptionKey: 1n })).toBe(3n);

    const part2 = solveGroveCoordinates(file, { rounds: 10, decryptionKey: 811589153n });
    expect(part2).toBe(1623178306n);
  });

  it('validates MixConfig before mixing', () => {
    const file = new EncryptedFile([0n, 1n]);
    expect(() => mixEncryptedFile(file, { rounds: 0, decryptionKey: 1n })).toThrow(RangeError);
    expect(() => solveGroveCoordinates(file, { rounds: 1, decryptionKey: 1n, blockSize: 0 })).toThrow(RangeError);
  });
});
