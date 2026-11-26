import { describe, expect, it } from 'vitest';
import {
  BOARDING_PASS_PATTERN,
  BoardingManifest,
  BoardingPass,
  CABIN_CAPACITY,
  CODE_LENGTH,
  COLUMN_BITS,
  COLUMN_COUNT,
  MAX_SEAT_ID,
  ROW_BITS,
  ROW_COUNT,
  assertValidSeatId,
  decodeSeatId,
  encodeSeatCode,
  parseBoardingManifest,
} from './seat';

describe('seat domain primitives', () => {
  it('exposes standard 128x8 binary boarding constants', () => {
    expect(ROW_BITS).toBe(7);
    expect(COLUMN_BITS).toBe(3);
    expect(CODE_LENGTH).toBe(10);
    expect(ROW_COUNT).toBe(128);
    expect(COLUMN_COUNT).toBe(8);
    expect(CABIN_CAPACITY).toBe(1024);
    expect(MAX_SEAT_ID).toBe(1023);
    expect(BOARDING_PASS_PATTERN.test('FBFBBFFRLR')).toBe(true);
  });

  it('validates seat IDs within [0, 1023]', () => {
    expect(() => assertValidSeatId(0)).not.toThrow();
    expect(() => assertValidSeatId(1023)).not.toThrow();
    expect(() => assertValidSeatId(-1)).toThrow(RangeError);
    expect(() => assertValidSeatId(1024)).toThrow(RangeError);
    expect(() => assertValidSeatId(4.5)).toThrow(RangeError);
  });

  it('decodes and encodes official example passes and boundary IDs', () => {
    expect(decodeSeatId('FBFBBFFRLR')).toBe(357);
    expect(decodeSeatId('BFFFBBFRRR')).toBe(567);
    expect(decodeSeatId('FFFBBBFRRR')).toBe(119);
    expect(decodeSeatId('BBFFBBFRLL')).toBe(820);
    expect(encodeSeatCode(0)).toBe('FFFFFFFLLL');
    expect(encodeSeatCode(1023)).toBe('BBBBBBBRRR');
    expect(encodeSeatCode(357)).toBe('FBFBBFFRLR');
  });

  it('rejects malformed codes and out-of-range IDs during encode/decode', () => {
    expect(() => decodeSeatId('')).toThrow(SyntaxError);
    expect(() => decodeSeatId('FBFBBFFRL')).toThrow(SyntaxError);
    expect(() => decodeSeatId('FBFBBFFRLX')).toThrow(SyntaxError);
    expect(() => encodeSeatCode(-1)).toThrow(RangeError);
    expect(() => encodeSeatCode(1024)).toThrow(RangeError);
  });

  it('constructs frozen BoardingPass value objects with derived row, column, and code', () => {
    const pass = BoardingPass.fromCode('FBFBBFFRLR');
    expect(Object.isFrozen(pass)).toBe(true);
    expect(pass.seatId).toBe(357);
    expect(pass.row).toBe(44);
    expect(pass.column).toBe(5);
    expect(pass.code).toBe('FBFBBFFRLR');
    expect(() => new BoardingPass(2000)).toThrow(RangeError);
  });

  it('parses trimmed non-empty lines into frozen BoardingManifest and rejects empty inputs', () => {
    const manifest = parseBoardingManifest('  BFFFBBFRRR \r\n\n FFFBBBFRRR \n BBFFBBFRLL  \n');
    expect(Object.isFrozen(manifest)).toBe(true);
    expect(Object.isFrozen(manifest.passes)).toBe(true);
    expect(manifest.size).toBe(3);
    expect(manifest.passes.map((p) => p.seatId)).toEqual([567, 119, 820]);

    expect(() => new BoardingManifest([])).toThrow(RangeError);
    expect(() => parseBoardingManifest('   \n\r\n  ')).toThrow(RangeError);
    expect(() => parseBoardingManifest('FBFBBFFRLR\nBADCODE')).toThrow(SyntaxError);
  });
});
