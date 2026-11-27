import { describe, expect, it } from 'vitest';
import { compareDots, DotBounds, DotSheet, FoldInstruction, OrigamiManual } from './models';

describe('models', () => {
  it('computes DotBounds width and height and validates ordering', () => {
    const bounds = new DotBounds(2, 6, 1, 4);
    expect(bounds.width).toBe(5);
    expect(bounds.height).toBe(4);
    expect(() => new DotBounds(5, 4, 0, 1)).toThrow(RangeError);
    expect(() => new DotBounds(0, 1, 3, 2)).toThrow(RangeError);
    expect(() => new DotBounds(1.5, 2, 0, 1)).toThrow(RangeError);
  });

  it('validates FoldInstruction axis and positive integer value', () => {
    const fold = new FoldInstruction('x', 7);
    expect(fold.axis).toBe('x');
    expect(fold.value).toBe(7);
    expect(() => new FoldInstruction('z' as 'x', 5)).toThrow(Error);
    expect(() => new FoldInstruction('y', 0)).toThrow(RangeError);
    expect(() => new FoldInstruction('y', 2.5)).toThrow(RangeError);
  });

  it('sorts, deduplicates, computes bounds, and binary-searches DotSheet', () => {
    expect(compareDots({ x: 3, y: 1 }, { x: 1, y: 2 })).toBeLessThan(0);
    expect(compareDots({ x: 3, y: 1 }, { x: 1, y: 1 })).toBeGreaterThan(0);
    expect(compareDots({ x: 2, y: 1 }, { x: 2, y: 1 })).toBe(0);

    const sheet = new DotSheet([
      { x: 4, y: 2 },
      { x: 1, y: 0 },
      { x: 4, y: 2 },
      { x: 0, y: 2 },
    ]);

    expect(sheet.dotCount).toBe(3);
    expect(sheet.dots).toEqual([
      { x: 1, y: 0 },
      { x: 0, y: 2 },
      { x: 4, y: 2 },
    ]);
    expect(sheet.bounds.minX).toBe(0);
    expect(sheet.bounds.maxX).toBe(4);
    expect(sheet.bounds.minY).toBe(0);
    expect(sheet.bounds.maxY).toBe(2);
    expect(sheet.bounds.width).toBe(5);
    expect(sheet.bounds.height).toBe(3);

    expect(sheet.hasDot(1, 0)).toBe(true);
    expect(sheet.hasDot(0, 2)).toBe(true);
    expect(sheet.hasDot(4, 2)).toBe(true);
    expect(sheet.hasDot(2, 2)).toBe(false);
    expect(sheet.hasDot(-1, 0)).toBe(false);
    expect(sheet.hasDot(99, 99)).toBe(false);
  });

  it('rejects empty or invalid DotSheet inputs', () => {
    expect(() => new DotSheet([])).toThrow(Error);
    expect(() => new DotSheet([{ x: -1, y: 0 }])).toThrow(RangeError);
    expect(() => new DotSheet([{ x: 0, y: -1 }])).toThrow(RangeError);
    expect(() => new DotSheet([{ x: 1.5, y: 0 }])).toThrow(RangeError);
  });

  it('builds OrigamiManual and rejects empty folds', () => {
    const sheet = new DotSheet([{ x: 0, y: 0 }]);
    const folds = [new FoldInstruction('y', 1), new FoldInstruction('x', 2)];
    const manual = new OrigamiManual(sheet, folds);
    expect(manual.initialSheet).toBe(sheet);
    expect(manual.foldCount).toBe(2);
    expect(manual.folds).toHaveLength(2);
    expect(() => new OrigamiManual(sheet, [])).toThrow(Error);
  });
});
