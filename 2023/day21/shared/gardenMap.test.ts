import { describe, expect, it } from 'vitest';
import { GardenMap, parseGardenMap } from './gardenMap';

const SAMPLE_5X5 = [
  '.....',
  '.#.#.',
  '..S..',
  '.#.#.',
  '.....',
].join('\n');

describe('GardenMap', () => {
  it('constructs defensively, freezes instance, and exposes dynamic size and bounds checks', () => {
    const rawRocks = new Uint8Array([0, 1, 0, 0]);
    const map = new GardenMap(2, 2, 0, 0, rawRocks);
    rawRocks[1] = 0;

    expect(Object.isFrozen(map)).toBe(true);
    expect(map.size).toBe(4);
    expect(map.inBounds(0, 0)).toBe(true);
    expect(map.inBounds(-1, 0)).toBe(false);
    expect(map.inBounds(0, 2)).toBe(false);
    expect(map.inBounds(0.5, 0)).toBe(false);
    expect(map.isRock(0, 1)).toBe(true);
    expect(map.isRock(0, 0)).toBe(false);
    expect(() => map.isRock(2, 0)).toThrow(RangeError);
  });

  it('validates dimensions, start coordinates, rocks length, and unobstructed start', () => {
    const empty = new Uint8Array(4);
    expect(() => new GardenMap(0, 2, 0, 0, empty)).toThrow(RangeError);
    expect(() => new GardenMap(2, -1, 0, 0, empty)).toThrow(RangeError);
    expect(() => new GardenMap(2.5, 2, 0, 0, empty)).toThrow(RangeError);
    expect(() => new GardenMap(2, 2, -1, 0, empty)).toThrow(RangeError);
    expect(() => new GardenMap(2, 2, 2, 0, empty)).toThrow(RangeError);
    expect(() => new GardenMap(2, 2, 0, 2, empty)).toThrow(RangeError);
    expect(() => new GardenMap(2, 2, 0, 0.5, empty)).toThrow(RangeError);
    expect(() => new GardenMap(2, 2, 0, 0, new Uint8Array(3))).toThrow(RangeError);
    expect(() => new GardenMap(2, 2, 0, 0, new Uint8Array([1, 0, 0, 0]))).toThrow(RangeError);
  });

  it('wraps coordinates cleanly across infinite tile boundaries', () => {
    const map = parseGardenMap('.#\nS.');
    expect(map.isRockWrapped(0, 1)).toBe(true);
    expect(map.isRockWrapped(-2, -1)).toBe(true);
    expect(map.isRockWrapped(-1, 0)).toBe(false);
    expect(map.isRockWrapped(3, 2)).toBe(false);
  });

  it('detects clear cardinal cross, clear outer border, and quadratic periodicity readiness', () => {
    const ready = parseGardenMap(SAMPLE_5X5);
    expect(ready.hasClearCardinalCross()).toBe(true);
    expect(ready.hasClearOuterBorder()).toBe(true);
    expect(ready.isQuadraticPeriodicReady()).toBe(true);

    const blockedCrossRow = parseGardenMap('.....\n.....\n.#S..\n.....\n.....');
    expect(blockedCrossRow.hasClearCardinalCross()).toBe(false);
    expect(blockedCrossRow.isQuadraticPeriodicReady()).toBe(false);

    const blockedCrossCol = parseGardenMap('.....\n..#..\n..S..\n.....\n.....');
    expect(blockedCrossCol.hasClearCardinalCross()).toBe(false);

    const blockedTopBottom = parseGardenMap('.#...\n.....\n..S..\n.....\n.....');
    expect(blockedTopBottom.hasClearOuterBorder()).toBe(false);
    expect(blockedTopBottom.isQuadraticPeriodicReady()).toBe(false);

    const blockedLeftRight = parseGardenMap('.....\n#....\n..S..\n.....\n.....');
    expect(blockedLeftRight.hasClearOuterBorder()).toBe(false);

    const evenWidth = parseGardenMap('....\n.S..\n....\n....');
    expect(evenWidth.isQuadraticPeriodicReady()).toBe(false);

    const nonSquare = parseGardenMap('.....\n..S..\n.....');
    expect(nonSquare.isQuadraticPeriodicReady()).toBe(false);

    const offCenter = parseGardenMap('.....\n.S...\n.....\n.....\n.....');
    expect(offCenter.isQuadraticPeriodicReady()).toBe(false);

    const offCenterCol = parseGardenMap('.....\n.....\n.S...\n.....\n.....');
    expect(offCenterCol.isQuadraticPeriodicReady()).toBe(false);
  });
});

describe('parseGardenMap', () => {
  it('parses CRLF and trailing newlines without trimming leading spaces', () => {
    const map = parseGardenMap('..#\r\n.S.\r\n...\r\n\r\n');
    expect(map.width).toBe(3);
    expect(map.height).toBe(3);
    expect(map.startRow).toBe(1);
    expect(map.startCol).toBe(1);
    expect(map.isRock(0, 2)).toBe(true);
    expect(map.isRock(1, 1)).toBe(false);
  });

  it('rejects empty input, empty rows, jagged rows, invalid chars, missing S, and duplicate S', () => {
    expect(() => parseGardenMap('')).toThrow();
    expect(() => parseGardenMap('\n\n')).toThrow();
    expect(() => parseGardenMap('\n.S.')).toThrow();
    expect(() => parseGardenMap('..S\n..')).toThrow();
    expect(() => parseGardenMap('..S\n..x')).toThrow();
    expect(() => parseGardenMap('...\n.#.')).toThrow();
    expect(() => parseGardenMap('S..\n..S')).toThrow();
    expect(() => parseGardenMap('S.S\n...')).toThrow();
    expect(() => parseGardenMap(' S.\n...')).toThrow();
  });
});
