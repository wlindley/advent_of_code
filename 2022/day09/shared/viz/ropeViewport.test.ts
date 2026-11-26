import { describe, expect, it } from 'vitest';
import { GridBounds, GridPoint, MotionPlan } from '../motionPlan';
import { traceRopeBridge } from '../simulation';
import { GRIDLINE_MAX_SPAN, RopeViewport, buildCumulativeTailIndex } from './ropeViewport';

describe('RopeViewport', () => {
  it('computes cellSize, showGridlines, and centered Y-up cellCenter projections', () => {
    const bounds = new GridBounds(-1, 3, 0, 2); // 5x3
    const vp = new RopeViewport(bounds, 220, 140, 10);
    expect(Object.isFrozen(vp)).toBe(true);
    // Inner box 200x120 -> 200/5=40, 120/3=40
    expect(vp.cellSize).toBe(40);
    expect(vp.showGridlines).toBe(true);

    const topLeft = vp.cellCenter(new GridPoint(-1, 2));
    expect(Object.isFrozen(topLeft)).toBe(true);
    expect(topLeft).toEqual({ x: 30, y: 30 });

    const bottomRight = vp.cellCenter(new GridPoint(3, 0));
    expect(bottomRight).toEqual({ x: 190, y: 110 });
  });

  it('centers tall grids horizontally and wide grids vertically and toggles gridlines at span limit', () => {
    const wide = new RopeViewport(new GridBounds(0, GRIDLINE_MAX_SPAN, 0, 1), 400, 200, 0);
    expect(wide.showGridlines).toBe(false); // width is 41 > 40
    expect(wide.cellSize).toBeCloseTo(400 / 41);

    const tall = new RopeViewport(new GridBounds(0, 1, 0, GRIDLINE_MAX_SPAN), 400, 200, 0);
    expect(tall.showGridlines).toBe(false); // height is 41 > 40
    expect(tall.cellSize).toBeCloseTo(200 / 41);
  });

  it('rejects non-positive, non-finite, or over-padded dimensions', () => {
    const b = new GridBounds(0, 1, 0, 1);
    expect(() => new RopeViewport(b, 0, 100, 10)).toThrow(RangeError);
    expect(() => new RopeViewport(b, Number.NaN, 100, 10)).toThrow(RangeError);
    expect(() => new RopeViewport(b, 100, -5, 10)).toThrow(RangeError);
    expect(() => new RopeViewport(b, 100, 100, -1)).toThrow(RangeError);
    expect(() => new RopeViewport(b, 100, 100, 50)).toThrow(RangeError);
    expect(() => new RopeViewport(b, 100, 40, 20)).toThrow(RangeError);
  });
});

describe('buildCumulativeTailIndex', () => {
  it('flattens unique tail cells and records monotonic prefix end indices', () => {
    const plan = MotionPlan.parse('R 4\nL 4');
    const frames = traceRopeBridge(plan, 2);
    const index = buildCumulativeTailIndex(frames);

    expect(Object.isFrozen(index)).toBe(true);
    expect(Object.isFrozen(index.cells)).toBe(true);
    expect(Object.isFrozen(index.prefixEnds)).toBe(true);
    expect(index.prefixEnds).toHaveLength(frames.length);
    expect(index.cells).toHaveLength(4);
    expect(index.prefixEnds[0]).toBe(1);
    expect(index.prefixEnds[frames.length - 1]).toBe(4);
  });

  it('handles empty frame lists cleanly', () => {
    const index = buildCumulativeTailIndex([]);
    expect(index.cells).toEqual([]);
    expect(index.prefixEnds).toEqual([]);
  });
});
