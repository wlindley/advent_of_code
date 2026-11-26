import { describe, expect, it } from 'vitest';
import { BeamWaveFrame } from './beamFrame';
import { createBeamState, DIR_E, DIR_S } from './optics';

describe('BeamWaveFrame', () => {
  it('stores defensive copies and computes energizedCount, maskAt, and isEnergized dynamically', () => {
    const masks = new Uint8Array([2, 0, 4, 6]);
    const entry = createBeamState(0, 0, DIR_E);
    const frontierInput = [createBeamState(1, 1, DIR_S)];
    const frame = new BeamWaveFrame(masks, 2, 2, 1, 3, entry, frontierInput);

    // Mutate caller buffers after construction to verify defensive copies
    masks[1] = 8;
    frontierInput.push(createBeamState(0, 1, DIR_E));

    expect(Object.isFrozen(frame)).toBe(true);
    expect(Object.isFrozen(frame.frontier)).toBe(true);
    expect(frame.height).toBe(2);
    expect(frame.width).toBe(2);
    expect(frame.wave).toBe(1);
    expect(frame.totalWaves).toBe(3);
    expect(frame.entry).toEqual(entry);
    expect(frame.frontier).toEqual([createBeamState(1, 1, DIR_S)]);
    expect(frame.energizedCount).toBe(3);
    expect(frame.maskAt(0, 0)).toBe(2);
    expect(frame.maskAt(0, 1)).toBe(0);
    expect(frame.maskAt(1, 0)).toBe(4);
    expect(frame.maskAt(1, 1)).toBe(6);
    expect(frame.isEnergized(0, 1)).toBe(false);
    expect(frame.isEnergized(1, 1)).toBe(true);
  });

  it('rejects invalid dimensions, mask length, wave bounds, and out-of-bounds cell reads', () => {
    const entry = createBeamState(0, 0, DIR_E);
    const okMasks = new Uint8Array([1, 0]);

    expect(() => new BeamWaveFrame(okMasks, 0, 2, 0, 1, entry, [])).toThrow(RangeError);
    expect(() => new BeamWaveFrame(okMasks, 1.5, 2, 0, 1, entry, [])).toThrow(RangeError);
    expect(() => new BeamWaveFrame(okMasks, 1, 0, 0, 1, entry, [])).toThrow(RangeError);
    expect(() => new BeamWaveFrame(okMasks, 1, 1.5, 0, 1, entry, [])).toThrow(RangeError);
    expect(() => new BeamWaveFrame(new Uint8Array(3), 1, 2, 0, 1, entry, [])).toThrow(RangeError);
    expect(() => new BeamWaveFrame(okMasks, 1, 2, 0, 0, entry, [])).toThrow(RangeError);
    expect(() => new BeamWaveFrame(okMasks, 1, 2, 0, 1.5, entry, [])).toThrow(RangeError);
    expect(() => new BeamWaveFrame(okMasks, 1, 2, -1, 1, entry, [])).toThrow(RangeError);
    expect(() => new BeamWaveFrame(okMasks, 1, 2, 1, 1, entry, [])).toThrow(RangeError);
    expect(() => new BeamWaveFrame(okMasks, 1, 2, 0.5, 2, entry, [])).toThrow(RangeError);

    const frame = new BeamWaveFrame(okMasks, 1, 2, 0, 1, entry, []);
    expect(() => frame.maskAt(-1, 0)).toThrow(RangeError);
    expect(() => frame.maskAt(1, 0)).toThrow(RangeError);
    expect(() => frame.maskAt(0, -1)).toThrow(RangeError);
    expect(() => frame.maskAt(0, 2)).toThrow(RangeError);
    expect(() => frame.maskAt(0.5, 0)).toThrow(RangeError);
    expect(() => frame.isEnergized(0, 2)).toThrow(RangeError);
  });
});
