import { describe, expect, it } from 'vitest';
import { applyFold, applyFolds, FoldOutcome } from './folder';
import { DotSheet, FoldInstruction } from './models';

describe('folder', () => {
  it('folds along y and x axes, tracking stationary, reflected, and merged dots', () => {
    const sheet = new DotSheet([
      { x: 0, y: 1 },
      { x: 0, y: 5 },
      { x: 1, y: 4 },
      { x: 4, y: 1 },
    ]);

    const first = applyFold(sheet, new FoldInstruction('y', 3));
    expect(first).toBeInstanceOf(FoldOutcome);
    expect(first.fold.axis).toBe('y');
    expect(first.stationaryDots).toEqual([
      { x: 0, y: 1 },
      { x: 4, y: 1 },
    ]);
    expect(first.reflectedDots).toEqual([
      { x: 1, y: 2 },
      { x: 0, y: 1 },
    ]);
    expect(first.mergedDots).toEqual([{ x: 0, y: 1 }]);
    expect(first.overlapCount).toBe(1);
    expect(first.sheet.dotCount).toBe(3);

    const second = applyFold(first.sheet, new FoldInstruction('x', 2));
    expect(second.stationaryDots).toEqual([
      { x: 0, y: 1 },
      { x: 1, y: 2 },
    ]);
    expect(second.reflectedDots).toEqual([{ x: 0, y: 1 }]);
    expect(second.overlapCount).toBe(1);
    expect(second.sheet.dots).toEqual([
      { x: 0, y: 1 },
      { x: 1, y: 2 },
    ]);
  });

  it('rejects dots on the crease or reflected past zero', () => {
    const onCrease = new DotSheet([{ x: 3, y: 2 }]);
    expect(() => applyFold(onCrease, new FoldInstruction('x', 3))).toThrow(RangeError);

    const pastZero = new DotSheet([{ x: 0, y: 7 }]);
    expect(() => applyFold(pastZero, new FoldInstruction('y', 3))).toThrow(RangeError);
  });

  it('applies a validated count of folds sequentially', () => {
    const sheet = new DotSheet([
      { x: 0, y: 0 },
      { x: 4, y: 4 },
    ]);
    const folds = [new FoldInstruction('y', 2), new FoldInstruction('x', 2)];

    expect(applyFolds(sheet, folds, 0)).toBe(sheet);
    expect(applyFolds(sheet, folds, 1).dots).toEqual([{ x: 0, y: 0 }, { x: 4, y: 0 }]);
    expect(applyFolds(sheet, folds, 2).dots).toEqual([{ x: 0, y: 0 }]);

    expect(() => applyFolds(sheet, folds, -1)).toThrow(RangeError);
    expect(() => applyFolds(sheet, folds, 3)).toThrow(RangeError);
    expect(() => applyFolds(sheet, folds, 1.5)).toThrow(RangeError);
  });
});
