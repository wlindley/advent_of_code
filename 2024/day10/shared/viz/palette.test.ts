import { describe, expect, it } from 'vitest';
import { IMPASSABLE_HEIGHT, MAX_HEIGHT, MIN_HEIGHT } from '../index';
import { elevationColor, TRAIL_OVERLAY_COLORS } from './palette';

describe('topographic viz palette', () => {
  it('returns distinct CSS colors for impassable (-1) and heights 0..9', () => {
    const colors = new Set<string>();
    for (let h = IMPASSABLE_HEIGHT; h <= MAX_HEIGHT; h += 1) {
      const color = elevationColor(h);
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      colors.add(color);
    }
    expect(colors.size).toBe(MAX_HEIGHT - MIN_HEIGHT + 2);
  });

  it('throws RangeError for out-of-range or non-integer heights', () => {
    expect(() => elevationColor(-2)).toThrow(RangeError);
    expect(() => elevationColor(10)).toThrow(RangeError);
    expect(() => elevationColor(0.5)).toThrow(RangeError);
    expect(() => elevationColor(Number.NaN)).toThrow(RangeError);
  });

  it('exports frozen high-contrast overlay color tokens', () => {
    expect(Object.isFrozen(TRAIL_OVERLAY_COLORS)).toBe(true);
    expect(TRAIL_OVERLAY_COLORS.trailhead).toMatch(/^#/);
    expect(TRAIL_OVERLAY_COLORS.peakFill).toMatch(/^#/);
    expect(TRAIL_OVERLAY_COLORS.reachableStroke).toMatch(/^#/);
  });
});
