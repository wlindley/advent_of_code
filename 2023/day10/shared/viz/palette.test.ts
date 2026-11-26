import { describe, expect, it } from 'vitest';
import { PALETTE, distanceColor } from './palette';

describe('viz palette', () => {
  it('exposes frozen high-contrast light-mode semantic colors', () => {
    expect(Object.isFrozen(PALETTE)).toBe(true);
    expect(PALETTE.text).toBe('#1f2328');
    expect(PALETTE.surface).toBe('#ffffff');
    expect(PALETTE.accent).toBe('#0969da');
    expect(PALETTE.ok).toBe('#1a7f37');
    expect(PALETTE.gold).toBe('#9a6700');
  });

  it('clamps ratio below 0 and above 1 and interpolates smoothly across 0..1', () => {
    expect(distanceColor(-0.5)).toBe(distanceColor(0));
    expect(distanceColor(0)).toBe('rgb(9, 105, 218)');
    expect(distanceColor(0.25)).toBe('rgb(18, 116, 137)');
    expect(distanceColor(0.5)).toBe('rgb(26, 127, 55)');
    expect(distanceColor(0.75)).toBe('rgb(90, 115, 28)');
    expect(distanceColor(1)).toBe('rgb(154, 103, 0)');
    expect(distanceColor(1.5)).toBe(distanceColor(1));
  });
});
