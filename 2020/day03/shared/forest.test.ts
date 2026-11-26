import { describe, expect, it } from 'vitest';
import { Grid2D } from '../../../shared/core';
import { ForestMap, parseForestMap } from './forest';

const SAMPLE_GRID = ['..##.......', '#...#...#..', '.#....#..#.'].join('\n');

describe('parseForestMap and ForestMap', () => {
  it('parses valid rectangular tree and open cells into a frozen ForestMap', () => {
    const forest = parseForestMap(`${SAMPLE_GRID}\n\n`);
    expect(forest).toBeInstanceOf(ForestMap);
    expect(Object.isFrozen(forest)).toBe(true);
    expect(forest.rows).toBe(3);
    expect(forest.cols).toBe(11);
    expect(forest.hasTreeAt(0, 0)).toBe(false);
    expect(forest.hasTreeAt(0, 2)).toBe(true);
    expect(forest.hasTreeAt(1, 0)).toBe(true);
    expect(forest.hasTreeAt(2, 1)).toBe(true);
  });

  it('wraps horizontal coordinates seamlessly across repeated forest tiles', () => {
    const forest = parseForestMap(SAMPLE_GRID);
    expect(forest.wrapCol(0)).toBe(0);
    expect(forest.wrapCol(11)).toBe(0);
    expect(forest.wrapCol(13)).toBe(2);
    expect(forest.wrapCol(-1)).toBe(10);
    expect(forest.hasTreeAt(0, 13)).toBe(true);
    expect(forest.hasTreeAt(0, 24)).toBe(true);
    expect(forest.hasTreeAt(1, -3)).toBe(true);
    expect(forest.hasTreeAt(2, 12)).toBe(true);
  });

  it('rejects empty, ragged, or unknown-character inputs', () => {
    expect(() => parseForestMap('')).toThrow(Error);
    expect(() => parseForestMap('\n\n')).toThrow(Error);
    expect(() => parseForestMap('..#\n.#')).toThrow(Error);
    expect(() => parseForestMap('..#\n.X.')).toThrow(SyntaxError);
    expect(() => parseForestMap('..#\n. .')).toThrow(SyntaxError);
  });

  it('rejects out-of-bounds rows and non-integer coordinates', () => {
    const forest = new ForestMap(new Grid2D(1, 2, [false, true]));
    expect(forest.hasTreeAt(0, 1)).toBe(true);
    expect(forest.hasTreeAt(0, 3)).toBe(true);
    expect(() => forest.hasTreeAt(-1, 0)).toThrow(RangeError);
    expect(() => forest.hasTreeAt(1, 0)).toThrow(RangeError);
    expect(() => forest.hasTreeAt(0.5, 0)).toThrow(RangeError);
    expect(() => forest.hasTreeAt(0, 1.5)).toThrow(RangeError);
    expect(() => forest.wrapCol(NaN)).toThrow(RangeError);
  });
});
