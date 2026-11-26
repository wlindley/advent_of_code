import { describe, expect, it } from 'vitest';
import { MemorySpace, parseMemorySpace } from '../../shared';
import { BlockingByteResult, findBlockingByte, requireBlockingByte } from './blockingByte';

const EXAMPLE_INPUT = [
  '5,4', '4,2', '4,5', '3,0', '2,1',
  '6,3', '2,4', '1,5', '0,6', '3,3',
  '2,6', '5,1', '1,2', '5,5', '2,5',
  '6,5', '1,4', '0,4', '6,4', '1,1',
  '6,1', '1,0', '0,5', '1,6', '2,0',
].join('\n');

describe('BlockingByteResult', () => {
  it('freezes coordinate fields, computes derived getters dynamically, and rejects invalid indices', () => {
    const src = { x: 6, y: 1 };
    const res = new BlockingByteResult(src, 20);
    src.x = 0;

    expect(Object.isFrozen(res)).toBe(true);
    expect(Object.isFrozen(res.byte)).toBe(true);
    expect(res.byte).toEqual({ x: 6, y: 1 });
    expect(res.byteIndex).toBe(20);
    expect(res.fallenCount).toBe(21);
    expect(res.coordinate).toBe('6,1');

    expect(() => new BlockingByteResult({ x: 0, y: 0 }, -1)).toThrow(RangeError);
    expect(() => new BlockingByteResult({ x: 0, y: 0 }, 1.5)).toThrow(RangeError);
  });
});

describe('findBlockingByte & requireBlockingByte', () => {
  it('solves the 7x7 example and handles 1x1 grids', () => {
    const example = parseMemorySpace(EXAMPLE_INPUT, 7);
    const exResult = requireBlockingByte(example);
    expect(exResult.coordinate).toBe('6,1');
    expect(exResult.byteIndex).toBe(20);
    expect(exResult.fallenCount).toBe(21);

    expect(findBlockingByte(new MemorySpace(1, []))).toBeNull();
    expect(requireBlockingByte(new MemorySpace(1, [{ x: 0, y: 0 }])).byteIndex).toBe(0);
    expect(requireBlockingByte(new MemorySpace(1, [{ x: 0, y: 0 }, { x: 0, y: 0 }])).byteIndex).toBe(0);
  });

  it('handles direct endpoint hits, earlier barriers before (0,0), duplicates, and never-blocked grids', () => {
    const startHit = new MemorySpace(3, [{ x: 0, y: 0 }, { x: 1, y: 1 }]);
    expect(requireBlockingByte(startHit).byteIndex).toBe(0);

    const endHit = new MemorySpace(3, [{ x: 1, y: 0 }, { x: 2, y: 2 }]);
    expect(requireBlockingByte(endHit).byteIndex).toBe(1);

    const barrierBeforeStart = new MemorySpace(3, [
      { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 0, y: 0 },
    ]);
    expect(requireBlockingByte(barrierBeforeStart).byteIndex).toBe(2);

    const duplicates = new MemorySpace(3, [
      { x: 1, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 2 },
    ]);
    expect(requireBlockingByte(duplicates).byteIndex).toBe(3);

    expect(findBlockingByte(new MemorySpace(3, []))).toBeNull();
    const partial = new MemorySpace(3, [{ x: 1, y: 0 }, { x: 1, y: 1 }]);
    expect(findBlockingByte(partial)).toBeNull();
    expect(() => requireBlockingByte(partial)).toThrow('Exit remains reachable after all bytes fall');
  });
});
