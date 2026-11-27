import { describe, expect, it } from 'vitest';
import {
  PocketCycleTraceFrame,
  PocketSliceSnapshot,
  type LatticeEnvelope,
} from './trace';

const SAMPLE_BOUNDS: LatticeEnvelope = {
  xMin: -1,
  xMax: 1,
  yMin: -1,
  yMax: 1,
  zMin: -1,
  zMax: 1,
  wMin: -1,
  wMax: 1,
};

describe('PocketSliceSnapshot', () => {
  it('stores coordinates, defensively copies cells, freezes wrapper, and computes counts', () => {
    const raw = new Uint8Array([0, 1, 2, 3, 2, 1]);
    const snap = new PocketSliceSnapshot(-1, 0, -2, 3, 3, 2, raw);
    raw[0] = 3;
    raw[1] = 0;

    expect(Object.isFrozen(snap)).toBe(true);
    expect(snap.z).toBe(-1);
    expect(snap.w).toBe(0);
    expect(snap.xMin).toBe(-2);
    expect(snap.yMin).toBe(3);
    expect(snap.width).toBe(3);
    expect(snap.height).toBe(2);

    expect(snap.stateAt(0, 0)).toBe(0);
    expect(snap.stateAt(1, 0)).toBe(1);
    expect(snap.stateAt(2, 0)).toBe(2);
    expect(snap.stateAt(0, 1)).toBe(3);
    expect(snap.survivingCount).toBe(2);
    expect(snap.bornCount).toBe(2);
    expect(snap.dyingCount).toBe(1);
    expect(snap.activeCount).toBe(4);
  });

  it('rejects invalid dimensions and out-of-bounds stateAt coordinates', () => {
    expect(() => new PocketSliceSnapshot(0, 0, 0, 0, 0, 1, new Uint8Array(0))).toThrow(RangeError);
    expect(() => new PocketSliceSnapshot(0, 0, 0, 0, 1.5, 2, new Uint8Array(3))).toThrow(RangeError);
    expect(() => new PocketSliceSnapshot(0, 0, 0, 0, 1, 0, new Uint8Array(0))).toThrow(RangeError);
    expect(() => new PocketSliceSnapshot(0, 0, 0, 0, 2, 1.5, new Uint8Array(3))).toThrow(RangeError);
    expect(() => new PocketSliceSnapshot(0, 0, 0, 0, 2, 2, new Uint8Array(3))).toThrow(RangeError);

    const snap = new PocketSliceSnapshot(0, 0, 0, 0, 2, 2, new Uint8Array([0, 1, 2, 3]));
    expect(() => snap.stateAt(-1, 0)).toThrow(RangeError);
    expect(() => snap.stateAt(2, 0)).toThrow(RangeError);
    expect(() => snap.stateAt(0.5, 0)).toThrow(RangeError);
    expect(() => snap.stateAt(0, -1)).toThrow(RangeError);
    expect(() => snap.stateAt(0, 2)).toThrow(RangeError);
    expect(() => snap.stateAt(0, 0.5)).toThrow(RangeError);
  });
});

describe('PocketCycleTraceFrame', () => {
  it('freezes slices/bounds, aggregates counts, sorts wValues, and filters slicesForW', () => {
    const s1 = new PocketSliceSnapshot(0, 1, -1, -1, 2, 1, new Uint8Array([1, 2]));
    const s2 = new PocketSliceSnapshot(-1, -1, -1, -1, 2, 1, new Uint8Array([3, 0]));
    const s3 = new PocketSliceSnapshot(1, 1, -1, -1, 2, 1, new Uint8Array([2, 3]));
    const inputSlices = [s1, s2, s3];

    const frame = new PocketCycleTraceFrame(2, 6, 4, SAMPLE_BOUNDS, inputSlices);
    inputSlices.pop();

    expect(Object.isFrozen(frame)).toBe(true);
    expect(Object.isFrozen(frame.bounds)).toBe(true);
    expect(Object.isFrozen(frame.slices)).toBe(true);
    expect(frame.cycle).toBe(2);
    expect(frame.totalCycles).toBe(6);
    expect(frame.dimensions).toBe(4);
    expect(frame.slices).toHaveLength(3);
    expect(frame.survivingCount).toBe(1);
    expect(frame.bornCount).toBe(2);
    expect(frame.dyingCount).toBe(2);
    expect(frame.activeCount).toBe(3);
    expect(frame.wValues).toEqual([-1, 1]);
    expect(frame.slicesForW(1)).toEqual([s1, s3]);
    expect(frame.slicesForW(-1)).toEqual([s2]);
    expect(frame.slicesForW(0)).toEqual([]);
  });
});
