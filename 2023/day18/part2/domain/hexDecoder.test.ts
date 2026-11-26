import { describe, expect, it } from 'vitest';
import { RawDigEntry } from '../../shared';
import {
  decodeHexCode,
  HEX_DIG_PLAN_DECODER,
  HEX_DIRECTION_CODES,
} from './hexDecoder';

describe('HEX_DIRECTION_CODES', () => {
  it('maps 0..3 to R, D, L, U and is frozen', () => {
    expect(Object.isFrozen(HEX_DIRECTION_CODES)).toBe(true);
    expect(HEX_DIRECTION_CODES).toEqual({ '0': 'R', '1': 'D', '2': 'L', '3': 'U' });
  });
});

describe('decodeHexCode', () => {
  it('decodes all four direction codes and returns a frozen object', () => {
    const r = decodeHexCode('70c710');
    expect(Object.isFrozen(r)).toBe(true);
    expect(r).toEqual({ direction: 'R', distance: 461937n });
    expect(decodeHexCode('0dc571')).toEqual({ direction: 'D', distance: 56407n });
    expect(decodeHexCode('8ceee2')).toEqual({ direction: 'L', distance: 577262n });
    expect(decodeHexCode('caa173')).toEqual({ direction: 'U', distance: 829975n });
  });

  it('handles minimum, maximum, and mixed-case 5-digit hex distances', () => {
    expect(decodeHexCode('000010')).toEqual({ direction: 'R', distance: 1n });
    expect(decodeHexCode('fffff3')).toEqual({ direction: 'U', distance: 1048575n });
    expect(decodeHexCode('70C710')).toEqual({ direction: 'R', distance: 461937n });
  });

  it.each([
    ['empty string', ''],
    ['too short', '70c71'],
    ['too long', '70c7100'],
    ['leading hash', '#70c710'],
    ['non-hex char', '70c7g0'],
    ['direction code 4', '70c714'],
    ['direction code 9', '70c719'],
    ['direction code a', '70c71a'],
    ['direction code f', '70c71f'],
  ])('throws SyntaxError for invalid hex code (%s)', (_label, input) => {
    expect(() => decodeHexCode(input)).toThrow(SyntaxError);
  });

  it.each([
    ['all zeroes', '000000'],
    ['zero distance with direction 3', '000003'],
  ])('throws RangeError for zero distance (%s)', (_label, input) => {
    expect(() => decodeHexCode(input)).toThrow(RangeError);
  });
});

describe('HEX_DIG_PLAN_DECODER', () => {
  it('decodes hex direction/distance while preserving normalized entry color', () => {
    expect(Object.isFrozen(HEX_DIG_PLAN_DECODER)).toBe(true);
    const step = HEX_DIG_PLAN_DECODER.decodeStep(new RawDigEntry('U', 3n, '70C710'));
    expect(step.direction).toBe('R');
    expect(step.distance).toBe(461937n);
    expect(step.color).toBe('#70c710');
  });

  it('propagates SyntaxError on invalid direction digit', () => {
    expect(() => HEX_DIG_PLAN_DECODER.decodeStep(new RawDigEntry('R', 1n, '70c714'))).toThrow(
      SyntaxError,
    );
  });

  it('propagates RangeError on zero hex distance', () => {
    expect(() => HEX_DIG_PLAN_DECODER.decodeStep(new RawDigEntry('R', 1n, '000000'))).toThrow(
      RangeError,
    );
  });
});
