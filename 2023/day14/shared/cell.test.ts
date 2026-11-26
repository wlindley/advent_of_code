import { describe, expect, it } from 'vitest';
import {
  CELL_CUBE,
  CELL_EMPTY,
  CELL_ROUND,
  TILT_DIRECTIONS,
  encodeCellChar,
} from './cell';

describe('2023/day14/shared/cell', () => {
  it('defines canonical ASCII byte constants and frozen tilt directions', () => {
    expect(CELL_EMPTY).toBe(46);
    expect(CELL_CUBE).toBe(35);
    expect(CELL_ROUND).toBe(79);
    expect(TILT_DIRECTIONS).toEqual(['north', 'west', 'south', 'east']);
    expect(Object.isFrozen(TILT_DIRECTIONS)).toBe(true);
  });

  it('encodes valid platform characters to their ASCII bytes', () => {
    expect(encodeCellChar('.')).toBe(CELL_EMPTY);
    expect(encodeCellChar('#')).toBe(CELL_CUBE);
    expect(encodeCellChar('O')).toBe(CELL_ROUND);
  });

  it.each(['', 'x', 'o', 'OO', ' ', '\n'])('rejects invalid cell character %j', (bad) => {
    expect(() => encodeCellChar(bad)).toThrow(RangeError);
  });
});
