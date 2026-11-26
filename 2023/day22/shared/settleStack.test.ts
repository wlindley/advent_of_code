import { describe, expect, it } from 'vitest';
import { Brick, BrickSnapshot, parseBrickSnapshot } from './brickSnapshot';
import { MAX_FOOTPRINT_AREA, settleBricks, SettledBrick, SettledStack } from './settleStack';

const OFFICIAL_EXAMPLE = [
  '1,0,1~1,2,1',
  '0,0,2~2,0,2',
  '0,2,3~2,2,3',
  '0,0,4~0,2,4',
  '2,0,5~2,2,5',
  '0,1,6~2,1,6',
  '1,1,8~1,1,9',
].join('\n');

describe('SettledBrick and SettledStack', () => {
  it('derives geometry from underlying Brick without stored derived state', () => {
    const brick = new Brick(4, 1, 2, 5, 1, 2, 7);
    const settled = new SettledBrick(0, brick, 2);
    expect(settled.index).toBe(0);
    expect(settled.id).toBe(4);
    expect(settled.xMin).toBe(1);
    expect(settled.xMax).toBe(1);
    expect(settled.yMin).toBe(2);
    expect(settled.yMax).toBe(2);
    expect(settled.zMin).toBe(2);
    expect(settled.zMax).toBe(4);
    expect(settled.initialZMin).toBe(5);
    expect(settled.dropDistance).toBe(3);
    expect(settled.height).toBe(3);
    expect(settled.axis).toBe('z');
    expect(Object.isFrozen(settled)).toBe(true);
  });

  it('validates SettledBrick and SettledStack constructor invariants', () => {
    const brick = new Brick(0, 0, 0, 2, 0, 0, 2);
    expect(() => new SettledBrick(-1, brick, 1)).toThrow(RangeError);
    expect(() => new SettledBrick(0, brick, 0)).toThrow(RangeError);
    expect(() => new SettledBrick(0, brick, 3)).toThrow(RangeError);
    const sb = new SettledBrick(0, brick, 1);
    expect(() => new SettledStack([], [])).toThrow(Error);
    expect(() => new SettledStack([sb], [])).toThrow(Error);
  });
});

describe('settleBricks', () => {
  it('settles the official 7-brick example with exact z-positions, drops, and supports', () => {
    const stack = settleBricks(parseBrickSnapshot(OFFICIAL_EXAMPLE));
    expect(stack.length).toBe(7);
    expect(stack.bricks.map((b) => [b.id, b.zMin, b.zMax, b.dropDistance])).toEqual([
      [0, 1, 1, 0],
      [1, 2, 2, 0],
      [2, 2, 2, 1],
      [3, 3, 3, 1],
      [4, 3, 3, 2],
      [5, 4, 4, 2],
      [6, 5, 6, 3],
    ]);
    expect(stack.supportedBy).toEqual([[], [0], [0], [1, 2], [1, 2], [3, 4], [5]]);
    expect(stack.totalDropDistance).toBe(9);
    expect(stack.bounds).toEqual({
      xMin: 0,
      xMax: 2,
      yMin: 0,
      yMax: 2,
      zMin: 1,
      zMax: 6,
    });
    expect(Object.isFrozen(stack)).toBe(true);
    expect(Object.isFrozen(stack.supportedBy)).toBe(true);
  });

  it('sorts equal-z bricks by id, deduplicates multi-cell supporters, and settles negative x/y', () => {
    const raw = [
      '0,0,1~2,0,1',
      '0,2,1~2,2,1',
      '1,0,5~1,2,5',
      '-2,-1,3~-2,-1,3',
    ].join('\n');
    const stack = settleBricks(parseBrickSnapshot(raw));
    expect(stack.bricks.map((b) => b.id)).toEqual([0, 1, 3, 2]);
    expect(stack.supportedBy[2]).toEqual([]);
    expect(stack.supportedBy[3]).toEqual([0, 1]);

    const sameSupporterTwice = settleBricks(
      parseBrickSnapshot('0,0,1~2,0,1\n0,0,4~2,0,4'),
    );
    expect(sameSupporterTwice.supportedBy[1]).toEqual([0]);
  });

  it('rejects overlapping bricks that would teleport upward and oversized footprints', () => {
    const overlapping = parseBrickSnapshot('0,0,1~0,0,3\n0,0,2~0,0,4');
    expect(() => settleBricks(overlapping)).toThrow(Error);

    const huge = new BrickSnapshot([
      new Brick(0, 0, 0, 1, MAX_FOOTPRINT_AREA, 0, 1),
      new Brick(1, 0, 1, 1, 0, 1, 1),
    ]);
    expect(() => settleBricks(huge)).toThrow(RangeError);
  });
});
