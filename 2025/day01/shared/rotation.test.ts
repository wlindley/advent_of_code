import { describe, expect, it } from 'vitest';
import {
  DIAL_SIZE,
  INITIAL_DIAL_POSITION,
  Rotation,
  parseRotations,
} from './index';

describe('Rotation', () => {
  it('constructs a frozen rotation with direction, distance, and label', () => {
    const rot = new Rotation('L', 68);
    expect(rot.direction).toBe('L');
    expect(rot.distance).toBe(68);
    expect(rot.label).toBe('L68');
    expect(Object.isFrozen(rot)).toBe(true);
    expect(DIAL_SIZE).toBe(100);
    expect(INITIAL_DIAL_POSITION).toBe(50);
  });

  it('rejects distances that are not positive safe integers', () => {
    expect(() => new Rotation('R', 0)).toThrow(RangeError);
    expect(() => new Rotation('L', -3)).toThrow(RangeError);
    expect(() => new Rotation('R', 1.5)).toThrow(RangeError);
    expect(() => new Rotation('L', Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
  });

  it('applies left and right rotations modulo DIAL_SIZE', () => {
    expect(new Rotation('L', 68).applyTo(50)).toBe(82);
    expect(new Rotation('R', 48).applyTo(52)).toBe(0);
    expect(new Rotation('L', 5).applyTo(0)).toBe(95);
    expect(new Rotation('R', 1000).applyTo(50)).toBe(50);
    expect(new Rotation('L', 150).applyTo(50)).toBe(0);
  });

  it('rejects invalid dial positions in applyTo', () => {
    const rot = new Rotation('R', 1);
    expect(() => rot.applyTo(-1)).toThrow(RangeError);
    expect(() => rot.applyTo(100)).toThrow(RangeError);
    expect(() => rot.applyTo(12.5)).toThrow(RangeError);
    expect(() => rot.applyTo(Number.NaN)).toThrow(RangeError);
  });

  it('counts zero hits from 0 without counting the starting position', () => {
    for (const [dir, d, expected] of [
      ['L', 1, 0], ['L', 5, 0], ['L', 99, 0], ['R', 1, 0], ['R', 99, 0],
      ['L', 100, 1], ['R', 100, 1], ['L', 200, 2], ['R', 250, 2],
    ] as const) {
      expect(new Rotation(dir, d).countZeroHitsFrom(0)).toBe(expected);
    }
  });

  it('handles firstHit boundaries, multi-turn counts, and MAX_SAFE_INTEGER safety', () => {
    expect(new Rotation('R', 47).countZeroHitsFrom(52)).toBe(0);
    expect(new Rotation('R', 48).countZeroHitsFrom(52)).toBe(1);
    expect(new Rotation('R', 49).countZeroHitsFrom(52)).toBe(1);
    expect(new Rotation('L', 67).countZeroHitsFrom(68)).toBe(0);
    expect(new Rotation('L', 68).countZeroHitsFrom(68)).toBe(1);
    expect(new Rotation('L', 69).countZeroHitsFrom(68)).toBe(1);
    expect(new Rotation('R', 1000).countZeroHitsFrom(50)).toBe(10);
    expect(new Rotation('L', 1000).countZeroHitsFrom(50)).toBe(10);
    expect(new Rotation('R', Number.MAX_SAFE_INTEGER).countZeroHitsFrom(1)).toBe(
      1 + Math.floor((Number.MAX_SAFE_INTEGER - 99) / DIAL_SIZE),
    );
  });

  it('rejects invalid dial positions in countZeroHitsFrom', () => {
    const rot = new Rotation('L', 1);
    for (const bad of [-1, 100, 12.5, Number.NaN]) {
      expect(() => rot.countZeroHitsFrom(bad)).toThrow(RangeError);
    }
  });

  it('matches click-by-click oracle across boundary positions and distances', () => {
    const oracle = (dir: 'L' | 'R', start: number, dist: number): number => {
      let pos = start;
      let hits = 0;
      const step = dir === 'R' ? 1 : -1;
      for (let i = 0; i < dist; i += 1) {
        pos = (pos + step + DIAL_SIZE) % DIAL_SIZE;
        if (pos === 0) hits += 1;
      }
      return hits;
    };
    for (const dir of ['L', 'R'] as const) {
      for (const p of [0, 1, 2, 49, 50, 51, 98, 99]) {
        for (let d = 1; d <= 305; d += 1) {
          expect(new Rotation(dir, d).countZeroHitsFrom(p)).toBe(oracle(dir, p, d));
        }
      }
    }
  });

  it('parses valid tokens and rejects malformed tokens', () => {
    expect(Rotation.parse('L68')).toEqual(new Rotation('L', 68));
    expect(Rotation.parse('R1')).toEqual(new Rotation('R', 1));
    expect(() => Rotation.parse('')).toThrow('Invalid rotation');
    expect(() => Rotation.parse('U10')).toThrow('Invalid rotation');
    expect(() => Rotation.parse('R')).toThrow('Invalid rotation');
    expect(() => Rotation.parse('R-5')).toThrow('Invalid rotation');
    expect(() => Rotation.parse('L0')).toThrow(RangeError);
  });
});

describe('parseRotations', () => {
  it('parses LF and CRLF inputs with outer whitespace', () => {
    const parsed = parseRotations('\n  L10\r\nR25\nL100  \n');
    expect(parsed.map((r) => r.label)).toEqual(['L10', 'R25', 'L100']);
  });

  it('rejects empty or whitespace-only input', () => {
    expect(() => parseRotations('')).toThrow('Input must contain at least one rotation');
    expect(() => parseRotations('  \n\t ')).toThrow('Input must contain at least one rotation');
  });

  it('wraps invalid line errors with 1-based line numbers', () => {
    expect(() => parseRotations('L10\nBAD\nR5')).toThrow('Line 2:');
    expect(() => parseRotations('L10\nR0')).toThrow('Line 2:');
  });
});
