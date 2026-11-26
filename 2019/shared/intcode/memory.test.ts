import { describe, expect, it } from 'vitest';
import { IntcodeMemory } from './memory';

describe('IntcodeMemory', () => {
  it('initializes defensively, reports dynamic size, and supports BigInt reads and writes', () => {
    const initial = [1n, 9n, 10n, 3n];
    const memory = new IntcodeMemory(initial);
    initial[0] = 99n;

    expect(memory.size).toBe(4);
    expect(memory.read(0n)).toBe(1n);
    memory.write(3n, 42n);
    expect(memory.read(3n)).toBe(42n);
  });

  it('returns frozen defensive snapshots isolated from subsequent writes', () => {
    const memory = new IntcodeMemory([10n, 20n, 30n]);
    const snap = memory.snapshot();
    expect(Object.isFrozen(snap)).toBe(true);
    expect(snap).toEqual([10n, 20n, 30n]);

    memory.write(1n, 999n);
    expect(snap).toEqual([10n, 20n, 30n]);
    expect(memory.snapshot()).toEqual([10n, 999n, 30n]);
  });

  it('rejects empty initialization and out-of-bounds reads or writes', () => {
    expect(() => new IntcodeMemory([])).toThrow(RangeError);
    const memory = new IntcodeMemory([1n, 2n]);
    expect(() => memory.read(-1n)).toThrow(RangeError);
    expect(() => memory.read(2n)).toThrow(RangeError);
    expect(() => memory.read(9007199254740993n)).toThrow(RangeError);
    expect(() => memory.write(-1n, 0n)).toThrow(RangeError);
    expect(() => memory.write(2n, 0n)).toThrow(RangeError);
    expect(() => memory.write(1n << 60n, 0n)).toThrow(RangeError);
  });
});
