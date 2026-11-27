import { describe, expect, it } from 'vitest';
import { AsteroidPoint } from './geometry';
import {
  computeGridLayout,
  computeVisibilityColorBand,
  pointCenter,
} from './vizLayout';

describe('computeGridLayout and pointCenter', () => {
  it('computes bounded SVG dimensions and cell centers for small and large grids', () => {
    const small = computeGridLayout(5, 5);
    expect(Object.isFrozen(small)).toBe(true);
    expect(small.cellSize).toBe(34);
    expect(small.svgWidth).toBe(small.padding * 2 + 5 * 34);
    expect(small.svgHeight).toBe(small.padding * 2 + 5 * 34);
    expect(small.asteroidRadius).toBeGreaterThanOrEqual(3);

    const large = computeGridLayout(60, 40);
    expect(large.cellSize).toBe(10);
    expect(large.svgWidth).toBe(large.padding * 2 + 600);
    expect(large.svgHeight).toBe(large.padding * 2 + 400);

    const center = pointCenter(new AsteroidPoint(2, 1), small);
    expect(Object.isFrozen(center)).toBe(true);
    expect(center).toEqual({
      x: small.padding + 2.5 * small.cellSize,
      y: small.padding + 1.5 * small.cellSize,
    });
  });

  it('rejects non-positive or non-integer grid dimensions', () => {
    expect(() => computeGridLayout(0, 5)).toThrow(RangeError);
    expect(() => computeGridLayout(5, 0)).toThrow(RangeError);
    expect(() => computeGridLayout(2.5, 5)).toThrow(RangeError);
  });
});

describe('computeVisibilityColorBand', () => {
  it('handles best station, equal min/max range, and high/mid/low visibility bands', () => {
    expect(computeVisibilityColorBand(8, 2, 8, true)).toBe('var(--gold)');
    expect(computeVisibilityColorBand(4, 4, 4, false)).toBe('var(--accent)');
    expect(computeVisibilityColorBand(8, 0, 10, false)).toBe('var(--ok)');
    expect(computeVisibilityColorBand(5, 0, 10, false)).toBe('var(--accent)');
    expect(computeVisibilityColorBand(1, 0, 10, false)).toBe('var(--muted)');
  });
});
