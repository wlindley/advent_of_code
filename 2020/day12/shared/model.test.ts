import { describe, expect, it } from 'vitest';
import {
  absBigInt,
  NavigationInstruction,
  parseNavigationInstructions,
  ShipState,
  Vec2,
} from './model';

describe('2020 Day 12 shared model', () => {
  it('computes absBigInt for negative, zero, and positive values', () => {
    expect(absBigInt(-42n)).toBe(42n);
    expect(absBigInt(0n)).toBe(0n);
    expect(absBigInt(17n)).toBe(17n);
    expect(absBigInt(-(10n ** 50n))).toBe(10n ** 50n);
  });

  it('supports Vec2 arithmetic, manhattanNorm, and all 4 clockwise rotations', () => {
    expect(Vec2.ORIGIN.east).toBe(0n);
    expect(Vec2.ORIGIN.north).toBe(0n);
    expect(Vec2.ORIGIN.manhattanNorm).toBe(0n);

    const a = new Vec2(10n, 4n);
    const b = new Vec2(-3n, 2n);
    expect(a.manhattanNorm).toBe(14n);
    expect(b.manhattanNorm).toBe(5n);
    expect(a.add(b)).toEqual(new Vec2(7n, 6n));
    expect(a.scale(3n)).toEqual(new Vec2(30n, 12n));

    expect(a.rotateCw(0)).toEqual(new Vec2(10n, 4n));
    expect(a.rotateCw(1)).toEqual(new Vec2(4n, -10n));
    expect(a.rotateCw(2)).toEqual(new Vec2(-10n, -4n));
    expect(a.rotateCw(3)).toEqual(new Vec2(-4n, 10n));
  });

  it('validates NavigationInstruction invariants and exposes label', () => {
    const inst = new NavigationInstruction('F', 10n);
    expect(inst.action).toBe('F');
    expect(inst.value).toBe(10n);
    expect(inst.label).toBe('F10');

    expect(new NavigationInstruction('L', 90n).label).toBe('L90');
    expect(new NavigationInstruction('R', 360n).label).toBe('R360');
    expect(new NavigationInstruction('N', 45n).label).toBe('N45');

    expect(() => new NavigationInstruction('N', -1n)).toThrow(RangeError);
    expect(() => new NavigationInstruction('L', 45n)).toThrow(RangeError);
    expect(() => new NavigationInstruction('R', 100n)).toThrow(RangeError);
  });

  it('constructs immutable ShipState snapshots and computes manhattanDistance', () => {
    const initial = ShipState.initial(new Vec2(1n, 0n));
    expect(initial.position).toEqual(Vec2.ORIGIN);
    expect(initial.vector).toEqual(new Vec2(1n, 0n));
    expect(initial.manhattanDistance).toBe(0n);

    const moved = initial.withPosition(new Vec2(17n, -8n));
    expect(moved.position).toEqual(new Vec2(17n, -8n));
    expect(moved.vector).toEqual(new Vec2(1n, 0n));
    expect(moved.manhattanDistance).toBe(25n);

    const rotated = moved.withVector(new Vec2(0n, -1n));
    expect(rotated.position).toEqual(new Vec2(17n, -8n));
    expect(rotated.vector).toEqual(new Vec2(0n, -1n));
  });

  it('parses navigation instructions and rejects empty or malformed input', () => {
    const parsed = parseNavigationInstructions('  F10\r\nN3 \n L90\nR180\n');
    expect(parsed.map((i) => i.label)).toEqual(['F10', 'N3', 'L90', 'R180']);

    expect(() => parseNavigationInstructions('')).toThrow(Error);
    expect(() => parseNavigationInstructions('   \n\t ')).toThrow(Error);
    expect(() => parseNavigationInstructions('F10\nX5')).toThrow(Error);
    expect(() => parseNavigationInstructions('F-5')).toThrow(Error);
    expect(() => parseNavigationInstructions('L45')).toThrow(RangeError);
  });
});
