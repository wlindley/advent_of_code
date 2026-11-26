import { describe, expect, it } from 'vitest';
import { EncryptedFile } from './encryptedFile';
import {
  buildMixingTrace,
  DEFAULT_TRACE_MAX_STEPS,
  MAX_VISIBLE_SLOTS,
} from './trace';

describe('buildMixingTrace', () => {
  it('captures initial and post-move frames for small files without slot downsampling', () => {
    const file = new EncryptedFile([1n, 2n, -3n, 3n, -2n, 0n, 4n]);
    const frames = buildMixingTrace(file, { rounds: 1, decryptionKey: 1n });

    expect(frames).toHaveLength(8);
    expect(frames[0]!.round).toBe(0);
    expect(frames[0]!.moveCount).toBe(0);
    expect(frames[0]!.lastMove).toBeNull();
    expect(frames[0]!.isSampled).toBe(false);
    expect(frames[0]!.slots).toHaveLength(7);

    const last = frames[frames.length - 1]!;
    expect(last.round).toBe(1);
    expect(last.stepInRound).toBe(7);
    expect(last.moveCount).toBe(7);
    expect(last.totalMoves).toBe(7);
    expect(last.activeId).toBe(6);
    expect(last.activeValue).toBe(4n);
    expect(last.lastMove).toEqual({ fromIndex: 5, toIndex: 3, steps: 4 });
    expect(last.coordinates.sum).toBe(3n);
    expect(last.finalSum).toBe(3n);
    expect(last.slots.find((s) => s.isActive)?.id).toBe(6);
    expect(last.slots.find((s) => s.isZero)?.value).toBe(0n);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(Object.isFrozen(last)).toBe(true);
  });

  it('stores lossless groveOrdinals when multiple offsets hit the same slot', () => {
    const file = new EncryptedFile([0n]);
    const frames = buildMixingTrace(file, { rounds: 1, decryptionKey: 1n });
    expect(frames[1]!.slots[0]!.groveOrdinals).toEqual([1, 2, 3]);
    expect(Object.isFrozen(frames[1]!.slots[0]!.groveOrdinals)).toBe(true);
  });

  it('bounds frame count with maxSteps and preserves endpoints', () => {
    const file = new EncryptedFile([1n, 2n, -3n, 3n, -2n, 0n, 4n]);
    const capped = buildMixingTrace(file, { rounds: 10, decryptionKey: 811589153n }, { maxSteps: 5 });
    expect(capped).toHaveLength(5);
    expect(capped[0]!.moveCount).toBe(0);
    expect(capped[4]!.moveCount).toBe(70);
    expect(capped[4]!.coordinates.sum).toBe(1623178306n);

    const single = buildMixingTrace(file, { rounds: 1, decryptionKey: 1n }, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]!.moveCount).toBe(7);
  });

  it('caps large rings to 64 sorted visible slots while preserving all landmarks', () => {
    const values = Array.from({ length: 100 }, (_, i) => (i === 0 ? 0n : BigInt(i)));
    const file = new EncryptedFile(values);
    const frames = buildMixingTrace(file, { rounds: 2, decryptionKey: 1n });

    expect(frames.length).toBeLessThanOrEqual(DEFAULT_TRACE_MAX_STEPS);
    for (const frame of frames) {
      expect(frame.isSampled).toBe(true);
      expect(frame.slots).toHaveLength(MAX_VISIBLE_SLOTS);
      const indices = frame.slots.map((s) => s.ringIndex);
      for (let i = 1; i < indices.length; i += 1) {
        expect(indices[i]!).toBeGreaterThan(indices[i - 1]!);
      }
      expect(indices).toContain(frame.coordinates.zeroIndex);
      for (const offsetIdx of frame.coordinates.offsetIndices) {
        expect(indices).toContain(offsetIdx);
      }
      if (frame.lastMove !== null) {
        expect(indices).toContain(frame.lastMove.toIndex);
      }
    }
  });

  it('rejects invalid config or maxSteps', () => {
    const file = new EncryptedFile([0n, 1n]);
    expect(() => buildMixingTrace(file, { rounds: 0, decryptionKey: 1n })).toThrow(RangeError);
    expect(() => buildMixingTrace(file, { rounds: 1, decryptionKey: 1n }, { maxSteps: 0 })).toThrow(RangeError);
  });
});
