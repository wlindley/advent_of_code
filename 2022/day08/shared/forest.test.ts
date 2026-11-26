import { describe, expect, it } from 'vitest';
import { DIRS_4 } from '../../../shared/core';
import { CARDINAL_DIR, CARDINAL_DIRS, ForestGrid } from './forest';

const OFFICIAL_EXAMPLE = ['30373', '25512', '65332', '33549', '35390'].join('\n');

describe('ForestGrid & cardinal direction constants', () => {
  it('aligns CARDINAL_DIR and CARDINAL_DIRS with shared DIRS_4', () => {
    expect(CARDINAL_DIR).toEqual({ UP: 0, RIGHT: 1, DOWN: 2, LEFT: 3 });
    expect(Object.isFrozen(CARDINAL_DIR)).toBe(true);
    expect(CARDINAL_DIRS).toEqual([0, 1, 2, 3]);
    expect(Object.isFrozen(CARDINAL_DIRS)).toBe(true);
    expect(DIRS_4[CARDINAL_DIR.UP]).toEqual([-1, 0]);
    expect(DIRS_4[CARDINAL_DIR.RIGHT]).toEqual([0, 1]);
    expect(DIRS_4[CARDINAL_DIR.DOWN]).toEqual([1, 0]);
    expect(DIRS_4[CARDINAL_DIR.LEFT]).toEqual([0, -1]);
  });

  it('parses official 5x5 forest grid and exposes immutable dimensions & heights', () => {
    const forest = ForestGrid.parse(`${OFFICIAL_EXAMPLE}\n`);
    expect(Object.isFrozen(forest)).toBe(true);
    expect(forest.rows).toBe(5);
    expect(forest.cols).toBe(5);
    expect(forest.size).toBe(25);
    expect(forest.heightAt(0, 0)).toBe(3);
    expect(forest.heightAt(1, 1)).toBe(5);
    expect(forest.heightAt(3, 4)).toBe(9);
    expect(forest.heightAt(4, 4)).toBe(0);
    expect(forest.inBounds(0, 0)).toBe(true);
    expect(forest.inBounds(4, 4)).toBe(true);
    expect(forest.inBounds(-1, 0)).toBe(false);
    expect(forest.inBounds(5, 0)).toBe(false);
    expect(forest.inBounds(0, 5)).toBe(false);
    expect(forest.inBounds(1.5, 0)).toBe(false);
  });

  it('parses 1x1 and all-digit heights 0..9', () => {
    const single = ForestGrid.parse('7');
    expect(single.rows).toBe(1);
    expect(single.cols).toBe(1);
    expect(single.size).toBe(1);
    expect(single.heightAt(0, 0)).toBe(7);

    const digits = ForestGrid.parse('0123456789');
    expect(digits.rows).toBe(1);
    expect(digits.cols).toBe(10);
    for (let c = 0; c < 10; c += 1) {
      expect(digits.heightAt(0, c)).toBe(c);
    }
  });

  it('throws RangeError when reading out-of-bounds or non-integer coordinates', () => {
    const forest = ForestGrid.parse(OFFICIAL_EXAMPLE);
    expect(() => forest.heightAt(-1, 0)).toThrow(RangeError);
    expect(() => forest.heightAt(0, -1)).toThrow(RangeError);
    expect(() => forest.heightAt(5, 0)).toThrow(RangeError);
    expect(() => forest.heightAt(0, 5)).toThrow(RangeError);
    expect(() => forest.heightAt(0.5, 0)).toThrow(RangeError);
  });

  it('rejects empty input, ragged rows, and non-digit characters', () => {
    expect(() => ForestGrid.parse('')).toThrow();
    expect(() => ForestGrid.parse('\n\n')).toThrow();
    expect(() => ForestGrid.parse('12\n3')).toThrow();
    expect(() => ForestGrid.parse('12\n3a')).toThrow(/Invalid tree height 'a' at \(1, 1\)/);
    expect(() => ForestGrid.parse(' /')).toThrow(/Invalid tree height ' ' at \(0, 0\)/);
    expect(() => ForestGrid.parse('1:')).toThrow(/Invalid tree height ':' at \(0, 1\)/);
  });
});
