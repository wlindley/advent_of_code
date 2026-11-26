import { describe, expect, it } from 'vitest';
import { Brick, BrickSnapshot, parseBrickSnapshot } from './brickSnapshot';

const OFFICIAL_EXAMPLE = [
  '1,0,1~1,2,1',
  '0,0,2~2,0,2',
  '0,2,3~2,2,3',
  '0,0,4~0,2,4',
  '2,0,5~2,2,5',
  '0,1,6~2,1,6',
  '1,1,8~1,1,9',
].join('\n');

describe('Brick', () => {
  it('normalizes reversed endpoints and computes dynamic properties per axis', () => {
    const xBrick = new Brick(0, 3, 1, 2, 1, 1, 2);
    expect(xBrick.xMin).toBe(1);
    expect(xBrick.xMax).toBe(3);
    expect(xBrick.height).toBe(1);
    expect(xBrick.cellCount).toBe(3);
    expect(xBrick.axis).toBe('x');
    expect(Object.isFrozen(xBrick)).toBe(true);

    const yBrick = new Brick(1, 0, 4, 2, 0, 1, 2);
    expect(yBrick.yMin).toBe(1);
    expect(yBrick.yMax).toBe(4);
    expect(yBrick.cellCount).toBe(4);
    expect(yBrick.axis).toBe('y');

    const zBrick = new Brick(2, 1, 1, 5, 1, 1, 3);
    expect(zBrick.zMin).toBe(3);
    expect(zBrick.zMax).toBe(5);
    expect(zBrick.height).toBe(3);
    expect(zBrick.cellCount).toBe(3);
    expect(zBrick.axis).toBe('z');

    const cube = new Brick(3, 2, 3, 1, 2, 3, 1);
    expect(cube.cellCount).toBe(1);
    expect(cube.axis).toBe('cube');
  });

  it('rejects invalid ids, non-integer coordinates, below-ground z, and diagonal bricks', () => {
    expect(() => new Brick(-1, 0, 0, 1, 0, 0, 1)).toThrow(RangeError);
    expect(() => new Brick(1.5, 0, 0, 1, 0, 0, 1)).toThrow(RangeError);
    expect(() => new Brick(0, 0.5, 0, 1, 0, 0, 1)).toThrow(RangeError);
    expect(() => new Brick(0, 0, 0, 0, 0, 0, 1)).toThrow(RangeError);
    expect(() => new Brick(0, 0, 0, 1, 1, 1, 1)).toThrow(Error);
    expect(() => new Brick(0, 0, 0, 1, 0, 1, 2)).toThrow(Error);
  });
});

describe('BrickSnapshot and parseBrickSnapshot', () => {
  it('parses the 7-brick example, preserves negative x/y, and strips only trailing newlines', () => {
    const snapshot = parseBrickSnapshot(`${OFFICIAL_EXAMPLE}\r\n\n`);
    expect(snapshot.length).toBe(7);
    expect(snapshot.bounds).toEqual({
      xMin: 0,
      xMax: 2,
      yMin: 0,
      yMax: 2,
      zMin: 1,
      zMax: 9,
    });
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.bricks)).toBe(true);
    expect(Object.isFrozen(snapshot.bounds)).toBe(true);

    const negXY = parseBrickSnapshot('-2,0,1~-2,3,1\r\n0,-1,2~1,-1,2\n');
    expect(negXY.bounds).toEqual({
      xMin: -2,
      xMax: 1,
      yMin: -1,
      yMax: 3,
      zMin: 1,
      zMax: 2,
    });
  });

  it('rejects empty snapshots, duplicate ids, malformed lines, and unsafe integers', () => {
    expect(() => new BrickSnapshot([])).toThrow(Error);
    const b0 = new Brick(0, 0, 0, 1, 0, 0, 1);
    const bDup = new Brick(0, 1, 0, 1, 1, 0, 1);
    expect(() => new BrickSnapshot([b0, bDup])).toThrow(Error);
    expect(() => parseBrickSnapshot('')).toThrow(Error);
    expect(() => parseBrickSnapshot('0,0,1~0,0,1\n\n0,1,1~0,1,1')).toThrow(Error);
    expect(() => parseBrickSnapshot('bad-line')).toThrow(Error);
    expect(() => parseBrickSnapshot('9007199254740992,0,1~9007199254740992,0,1')).toThrow(RangeError);
  });
});
