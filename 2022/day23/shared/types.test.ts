import { describe, expect, it } from 'vitest';
import {
  BoundingBox,
  computeBoundingBox,
  DiffusionFrame,
  DIRECTION_LABELS,
  SimulationResult,
} from './types';

describe('Day 23 shared types', () => {
  it('exposes frozen direction labels in N, S, W, E order', () => {
    expect(DIRECTION_LABELS).toEqual(['N', 'S', 'W', 'E']);
    expect(Object.isFrozen(DIRECTION_LABELS)).toBe(true);
  });

  it('computes BoundingBox height, width, and area dynamically and freezes instance', () => {
    const box = new BoundingBox(-2, 3, -1, 4);
    expect(box.height).toBe(6);
    expect(box.width).toBe(6);
    expect(box.area).toBe(36);
    expect(Object.isFrozen(box)).toBe(true);
  });

  it('rejects invalid BoundingBox bounds and non-integer coordinates', () => {
    expect(() => new BoundingBox(1.5, 2, 0, 1)).toThrow(RangeError);
    expect(() => new BoundingBox(0, 2.5, 0, 1)).toThrow(RangeError);
    expect(() => new BoundingBox(0, 2, 0.5, 1)).toThrow(RangeError);
    expect(() => new BoundingBox(0, 2, 0, 1.5)).toThrow(RangeError);
    expect(() => new BoundingBox(3, 2, 0, 1)).toThrow(RangeError);
    expect(() => new BoundingBox(0, 2, 4, 1)).toThrow(RangeError);
  });

  it('computes bounding box from coordinate arrays and rejects empty or mismatched arrays', () => {
    const box = computeBoundingBox(new Int32Array([5, -3, 2]), new Int32Array([-4, 7, 0]));
    expect(box).toEqual(new BoundingBox(-3, 5, -4, 7));
    expect(box.height).toBe(9);
    expect(box.width).toBe(12);
    expect(box.area).toBe(108);

    expect(() => computeBoundingBox([], [])).toThrow(RangeError);
    expect(() => computeBoundingBox([1, 2], [1])).toThrow(RangeError);
  });

  it('creates DiffusionFrame without freezing TypedArrays and computes dynamic getters', () => {
    const rows = new Int32Array([0, 2, 2]);
    const cols = new Int32Array([1, 0, 3]);
    const moved = new Uint8Array([1, 0, 1]);
    const frame = new DiffusionFrame(1, rows, cols, moved, 2);

    expect(Object.isFrozen(frame)).toBe(true);
    expect(Object.isFrozen(frame.elfRows)).toBe(false);
    expect(Object.isFrozen(frame.elfCols)).toBe(false);
    expect(Object.isFrozen(frame.movedFlags)).toBe(false);

    expect(frame.round).toBe(1);
    expect(frame.collisionCount).toBe(2);
    expect(frame.elfCount).toBe(3);
    expect(frame.movedCount).toBe(2);
    expect(frame.bounds).toEqual(new BoundingBox(0, 2, 0, 3));
    expect(frame.emptyGroundCount).toBe(12 - 3);
    expect(frame.isStatic).toBe(false);

    const staticFrame = new DiffusionFrame(4, new Int32Array([0, 3]), new Int32Array([0, 3]), new Uint8Array([0, 0]), 0);
    expect(staticFrame.movedCount).toBe(0);
    expect(staticFrame.isStatic).toBe(true);

    const roundZero = new DiffusionFrame(0, new Int32Array([0]), new Int32Array([0]), new Uint8Array([0]), 0);
    expect(roundZero.isStatic).toBe(false);
  });

  it('rejects invalid DiffusionFrame arguments separately', () => {
    const r = new Int32Array([0, 1]);
    const c = new Int32Array([0, 1]);
    const m = new Uint8Array([0, 1]);
    expect(() => new DiffusionFrame(-1, r, c, m, 0)).toThrow(RangeError);
    expect(() => new DiffusionFrame(1.5, r, c, m, 0)).toThrow(RangeError);
    expect(() => new DiffusionFrame(0, r, c, m, -1)).toThrow(RangeError);
    expect(() => new DiffusionFrame(0, r, c, m, 0.5)).toThrow(RangeError);
    expect(() => new DiffusionFrame(0, new Int32Array([]), new Int32Array([]), new Uint8Array([]), 0)).toThrow(RangeError);
    expect(() => new DiffusionFrame(0, r, new Int32Array([0]), m, 0)).toThrow(RangeError);
    expect(() => new DiffusionFrame(0, r, c, new Uint8Array([0]), 0)).toThrow(RangeError);
  });

  it('constructs SimulationResult with dynamic emptyGroundCount and validates invariants', () => {
    const box = new BoundingBox(0, 4, 0, 5);
    const res = new SimulationResult(10, box, 5, false);
    expect(Object.isFrozen(res)).toBe(true);
    expect(res.roundsCompleted).toBe(10);
    expect(res.finalBounds).toBe(box);
    expect(res.elfCount).toBe(5);
    expect(res.reachedStatic).toBe(false);
    expect(res.emptyGroundCount).toBe(25);

    expect(() => new SimulationResult(-1, box, 5, false)).toThrow(RangeError);
    expect(() => new SimulationResult(1.2, box, 5, false)).toThrow(RangeError);
    expect(() => new SimulationResult(1, box, 0, false)).toThrow(RangeError);
    expect(() => new SimulationResult(1, box, 1.5, false)).toThrow(RangeError);
  });
});
