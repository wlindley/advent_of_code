import { describe, expect, it } from 'vitest';
import { STANDARD_IMAGE_DIMENSIONS } from '../../shared';
import { solver } from './index';

describe('2019 Day 8 Part 1 domain solver', () => {
  it('parses, solves, and traces standard 25x6 Space Image inputs', () => {
    const layer0 = '0'.repeat(10) + '1'.repeat(20) + '2'.repeat(120);
    const layer1 = '0'.repeat(5) + '1'.repeat(15) + '2'.repeat(130);
    const image = solver.parse(layer0 + layer1);

    expect(image.dimensions.equals(STANDARD_IMAGE_DIMENSIONS)).toBe(true);
    expect(image.layerCount).toBe(2);
    expect(solver.solve(image)).toBe(15 * 130);
    expect(solver.trace(image)).toHaveLength(2);
  });

  it('rejects non-25x6 inputs such as the 12-digit 3x2 example', () => {
    expect(() => solver.parse('123456789012')).toThrow(RangeError);
  });
});
