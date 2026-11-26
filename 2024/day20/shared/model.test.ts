import { describe, expect, it } from 'vitest';
import {
  Cheat,
  CheatConfig,
  GridPoint,
  PART1_DEFAULT_CONFIG,
  PART1_EXAMPLE_CONFIG,
  PART2_DEFAULT_CONFIG,
  PART2_EXAMPLE_CONFIG,
  Racetrack,
  UNREACHABLE,
} from './model';

describe('CheatConfig & presets', () => {
  it('exposes expected Part 1 and Part 2 presets and freezes instances', () => {
    expect(UNREACHABLE).toBe(-1);
    expect(PART1_DEFAULT_CONFIG).toEqual({ maxDuration: 2, minSaving: 100 });
    expect(PART1_EXAMPLE_CONFIG).toEqual({ maxDuration: 2, minSaving: 2 });
    expect(PART2_DEFAULT_CONFIG).toEqual({ maxDuration: 20, minSaving: 100 });
    expect(PART2_EXAMPLE_CONFIG).toEqual({ maxDuration: 20, minSaving: 50 });
    expect(Object.isFrozen(PART1_DEFAULT_CONFIG)).toBe(true);
  });

  it('rejects invalid maxDuration or minSaving', () => {
    expect(() => new CheatConfig(1, 1)).toThrow(RangeError);
    expect(() => new CheatConfig(2.5, 1)).toThrow(RangeError);
    expect(() => new CheatConfig(2, 0)).toThrow(RangeError);
    expect(() => new CheatConfig(2, 1.5)).toThrow(RangeError);
  });
});

describe('GridPoint & Cheat', () => {
  it('computes Manhattan distance and validates coordinates', () => {
    const a = new GridPoint(1, 2);
    const b = new GridPoint(4, 6);
    expect(a.manhattanTo(b)).toBe(7);
    expect(Object.isFrozen(a)).toBe(true);
    expect(() => new GridPoint(-1, 0)).toThrow(RangeError);
    expect(() => new GridPoint(0, 1.2)).toThrow(RangeError);
  });

  it('computes cheat duration dynamically and enforces invariants', () => {
    const start = new GridPoint(1, 1);
    const end = new GridPoint(2, 2);
    const cheat = new Cheat(start, end, 12);
    expect(cheat.duration).toBe(2);
    expect(cheat.saving).toBe(12);
    expect(Object.isFrozen(cheat)).toBe(true);

    expect(() => new Cheat(start, new GridPoint(1, 2), 4)).toThrow(RangeError);
    expect(() => new Cheat(start, end, 0)).toThrow(RangeError);
  });
});

describe('Racetrack', () => {
  it('provides bounds, indexing, wall checks, and defensive copies', () => {
    const inputMask = new Uint8Array([0, 1, 0, 0]);
    const track = new Racetrack(2, 2, new GridPoint(0, 0), new GridPoint(1, 1), inputMask);
    inputMask[0] = 1;

    expect(Object.isFrozen(track)).toBe(true);
    expect(track.cellCount).toBe(4);
    expect(track.startIndex).toBe(0);
    expect(track.endIndex).toBe(3);
    expect(track.isWall(0, 0)).toBe(false);
    expect(track.isWall(0, 1)).toBe(true);
    expect(track.indexOf(1, 0)).toBe(2);
    expect(track.pointAt(2)).toEqual(new GridPoint(1, 0));
    expect(track.inBounds(0, 0)).toBe(true);
    expect(track.inBounds(-1, 0)).toBe(false);
    expect(track.inBounds(0, 2)).toBe(false);
    expect(track.inBounds(1.5, 0)).toBe(false);

    const copy = track.copyWallMask();
    copy[3] = 1;
    expect(track.isWall(1, 1)).toBe(false);
  });

  it('validates dimensions, mask length, endpoints, and index bounds', () => {
    const open = new Uint8Array(4);
    const s = new GridPoint(0, 0);
    const e = new GridPoint(1, 1);

    expect(() => new Racetrack(0, 2, s, e, new Uint8Array(0))).toThrow(RangeError);
    expect(() => new Racetrack(2, 0, s, e, new Uint8Array(0))).toThrow(RangeError);
    expect(() => new Racetrack(2, 2, s, e, new Uint8Array(3))).toThrow(RangeError);
    expect(() => new Racetrack(2, 2, new GridPoint(2, 0), e, open)).toThrow(RangeError);
    expect(() => new Racetrack(2, 2, s, new GridPoint(0, 2), open)).toThrow(RangeError);
    expect(() => new Racetrack(2, 2, s, e, new Uint8Array([1, 0, 0, 0]))).toThrow(Error);
    expect(() => new Racetrack(2, 2, s, e, new Uint8Array([0, 0, 0, 1]))).toThrow(Error);

    const track = new Racetrack(2, 2, s, e, open);
    expect(() => track.indexOf(2, 0)).toThrow(RangeError);
    expect(() => track.pointAt(-1)).toThrow(RangeError);
    expect(() => track.pointAt(4)).toThrow(RangeError);
    expect(() => track.pointAt(0.5)).toThrow(RangeError);
  });
});
