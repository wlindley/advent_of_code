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
