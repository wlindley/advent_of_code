import { describe, expect, it } from 'vitest';
import { EncryptedFile, GROVE_OFFSETS, type MixConfig } from './encryptedFile';
import { mixEncryptedFile } from './mixer';

function naiveMix(values: readonly bigint[], rounds: number, key: bigint): number[] {
  const n = values.length;
  const order = Array.from({ length: n }, (_, i) => i);
  if (n <= 2) return order;
  const period = BigInt(n - 1);
  for (let round = 0; round < rounds; round += 1) {
    for (let id = 0; id < n; id += 1) {
      const rem = (values[id]! * key) % period;
      const steps = Number(rem < 0n ? rem + period : rem);
      if (steps === 0) continue;
      const from = order.indexOf(id);
      order.splice(from, 1);
      const raw = (from + steps) % (n - 1);
      const to = raw === 0 ? n - 1 : raw;
      order.splice(to, 0, id);
    }
  }
  return order;
}

function rotateFromZero(order: readonly number[], zeroId: number): number[] {
  const start = order.indexOf(zeroId);
  return [...order.slice(start), ...order.slice(0, start)];
}

function assertMatchesNaive(values: readonly bigint[], config: MixConfig): void {
  const file = new EncryptedFile(values);
  const actual = mixEncryptedFile(file, config);
  const expectedOrder = naiveMix(values, config.rounds, config.decryptionKey);

  expect(rotateFromZero(actual.order, file.zeroId)).toEqual(rotateFromZero(expectedOrder, file.zeroId));

  const expZero = expectedOrder.indexOf(file.zeroId);
  const expOffsets = GROVE_OFFSETS.map((off) => (expZero + off) % values.length);
  const expVals = expOffsets.map((idx) => values[expectedOrder[idx]!]! * config.decryptionKey);
  expect([actual.coordinates.first, actual.coordinates.second, actual.coordinates.third]).toEqual(expVals);
  expect(actual.coordinates.sum).toBe(expVals[0]! + expVals[1]! + expVals[2]!);
}

describe('mixer oracle equivalence against naive Array.splice simulator', () => {
  it('matches official Part 1 and Part 2 cases', () => {
    const official = [1n, 2n, -3n, 3n, -2n, 0n, 4n];
    assertMatchesNaive(official, { rounds: 1, decryptionKey: 1n });
    assertMatchesNaive(official, { rounds: 10, decryptionKey: 811589153n });
  });

  it('matches edge cases: N=1,2,3, duplicate values, +-(N-1) wraps, negative BigInt keys', () => {
    assertMatchesNaive([0n], { rounds: 3, decryptionKey: -999n });
    assertMatchesNaive([7n, 0n], { rounds: 4, decryptionKey: 811589153n });
    assertMatchesNaive([2n, 0n, -2n], { rounds: 5, decryptionKey: -7n });
    assertMatchesNaive([5n, 5n, -5n, 0n, 5n, -5n, 5n], { rounds: 2, decryptionKey: 1n });
    assertMatchesNaive([6n, -6n, 12n, -12n, 0n, 6n, -6n], { rounds: 3, decryptionKey: -3n });
  });

  it('matches across 20 seeded random arrays with blockSize=3 and default blockSize', () => {
    let seed = 0x12345678;
    const nextInt = (bound: number): number => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed % bound;
    };
    for (let trial = 0; trial < 20; trial += 1) {
      const length = 4 + nextInt(45);
      const values = Array.from({ length }, () => BigInt(nextInt(201) - 100));
      const zeroPos = nextInt(length);
      for (let i = 0; i < length; i += 1) {
        if (values[i] === 0n) values[i] = 1n;
      }
      values[zeroPos] = 0n;
      const rounds = 1 + (trial % 4);
      const key = trial % 2 === 0 ? 811589153n : -17n;
      assertMatchesNaive(values, { rounds, decryptionKey: key, blockSize: 3 });
      assertMatchesNaive(values, { rounds, decryptionKey: key });
    }
  });
});
