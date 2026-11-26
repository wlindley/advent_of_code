import { describe, expect, it } from 'vitest';
import { VentBounds } from './types';
import { ViewportTransform } from './viewport';

describe('ViewportTransform', () => {
  it('maps 2D bounds with 1:1 aspect ratio and centered margins', () => {
    const bounds = new VentBounds(0, 10, 0, 5);
    const vp = new ViewportTransform(bounds, 220, 220, 10);
    expect(Object.isFrozen(vp)).toBe(true);
    expect(vp.scale).toBe(20);
    expect(vp.offsetX).toBe(10);
    expect(vp.offsetY).toBe(60);
    expect(vp.toCanvasX(0)).toBe(10);
    expect(vp.toCanvasX(10)).toBe(210);
    expect(vp.toCanvasY(0)).toBe(60);
    expect(vp.toCanvasY(5)).toBe(160);
  });

  it('centers 1x1 single-point bounds and degenerates cleanly for 1D horizontal/vertical lines', () => {
    const point = new ViewportTransform(new VentBounds(7, 7, -3, -3), 100, 80, 10);
    expect(point.scale).toBe(1);
    expect(point.toCanvasX(7)).toBe(50);
    expect(point.toCanvasY(-3)).toBe(40);

    const horiz = new ViewportTransform(new VentBounds(0, 4, 2, 2), 120, 80, 10);
    expect(horiz.scale).toBe(25);
    expect(horiz.toCanvasX(0)).toBe(10);
    expect(horiz.toCanvasX(4)).toBe(110);
    expect(horiz.toCanvasY(2)).toBe(40);

    const vert = new ViewportTransform(new VentBounds(3, 3, 0, 5), 100, 120, 10);
    expect(vert.scale).toBe(20);
    expect(vert.toCanvasX(3)).toBe(50);
    expect(vert.toCanvasY(0)).toBe(10);
    expect(vert.toCanvasY(5)).toBe(110);
  });

  it('rejects invalid canvas dimensions or padding', () => {
    const b = new VentBounds(0, 1, 0, 1);
    expect(() => new ViewportTransform(b, 0, 100, 10)).toThrow(RangeError);
    expect(() => new ViewportTransform(b, 100, -1, 10)).toThrow(RangeError);
    expect(() => new ViewportTransform(b, 100, 100, -1)).toThrow(RangeError);
    expect(() => new ViewportTransform(b, 40, 100, 20)).toThrow(RangeError);
    expect(() => new ViewportTransform(b, 100, 40, 20)).toThrow(RangeError);
  });
});
