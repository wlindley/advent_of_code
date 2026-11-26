import { describe, expect, it } from 'vitest';
import { XmasStream } from './stream';
import {
  computeSignalViewport,
  DEFAULT_VIEWPORT_SLOTS,
  SignalBar,
  SignalViewport,
} from './viewport';

describe('SignalViewport and SignalBar', () => {
  it('freezes value objects and resolves slotOf() within [startIndex, endIndex)', () => {
    const bar = new SignalBar(5, 16n, 0.5);
    expect(Object.isFrozen(bar)).toBe(true);
    const vp = new SignalViewport(5, [bar, new SignalBar(6, 32n, 1)], 5);
    expect(Object.isFrozen(vp)).toBe(true);
    expect(Object.isFrozen(vp.bars)).toBe(true);
    expect(vp.barCount).toBe(2);
    expect(vp.endIndex).toBe(7);
    expect(vp.slotOf(4)).toBeNull();
    expect(vp.slotOf(5)).toBe(0);
    expect(vp.slotOf(6)).toBe(1);
    expect(vp.slotOf(7)).toBeNull();
  });
});

describe('computeSignalViewport', () => {
  it('returns all bars with log-normalized heights when stream fits in maxSlots', () => {
    expect(DEFAULT_VIEWPORT_SLOTS).toBe(48);
    const stream = new XmasStream([1n, 2n, 4n, 1n << 60n]);
    const vp = computeSignalViewport(stream, 1, 3, DEFAULT_VIEWPORT_SLOTS);
    expect(vp.startIndex).toBe(0);
    expect(vp.barCount).toBe(4);
    expect(vp.bars[0]!.normalizedHeight).toBeCloseTo(1 / 61, 6);
    expect(vp.bars[3]!.normalizedHeight).toBe(1);
    expect(vp.maxLog2).toBe(60);
  });

  it('centers viewport around focus span and clamps cleanly at left/right boundaries and empty focus', () => {
    const stream = new XmasStream(Array.from({ length: 100 }, (_, i) => BigInt(i + 1)));

    const left = computeSignalViewport(stream, 0, 5, 48);
    expect(left.startIndex).toBe(0);
    expect(left.endIndex).toBe(48);

    const mid = computeSignalViewport(stream, 40, 66, 48);
    expect(mid.startIndex).toBe(29);
    expect(mid.endIndex).toBe(77);
    expect(mid.slotOf(40)).toBe(11);

    const right = computeSignalViewport(stream, 95, 95, 48);
    expect(right.startIndex).toBe(52);
    expect(right.endIndex).toBe(100);
  });

  it('validates focus bounds and maxSlots', () => {
    const stream = new XmasStream([1n, 2n, 3n]);
    expect(() => computeSignalViewport(stream, 0, 2, 0)).toThrow(RangeError);
    expect(() => computeSignalViewport(stream, -1, 2, 10)).toThrow(RangeError);
    expect(() => computeSignalViewport(stream, 2, 1, 10)).toThrow(RangeError);
    expect(() => computeSignalViewport(stream, 0, 4, 10)).toThrow(RangeError);
  });
});
