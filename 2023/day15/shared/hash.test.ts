import { describe, expect, it } from 'vitest';
import {
  assertPrintableAscii,
  HASH_BUCKET_COUNT,
  HASH_MASK,
  HASH_MULTIPLIER,
  hashAscii,
  HashCharTransition,
  traceHashCharacters,
} from './index';

describe('hash constants & assertPrintableAscii', () => {
  it('exposes canonical HASH constants', () => {
    expect(HASH_MULTIPLIER).toBe(17);
    expect(HASH_BUCKET_COUNT).toBe(256);
    expect(HASH_MASK).toBe(255);
  });

  it('accepts boundary printable ASCII chars space (0x20) and tilde (0x7e)', () => {
    expect(() => assertPrintableAscii(' ~')).not.toThrow();
    expect(() => assertPrintableAscii('')).not.toThrow();
  });

  it('rejects characters below 0x20 and above 0x7e', () => {
    expect(() => assertPrintableAscii('\x1f')).toThrow(RangeError);
    expect(() => assertPrintableAscii('\n')).toThrow(RangeError);
    expect(() => assertPrintableAscii('\x7f')).toThrow(RangeError);
    expect(() => assertPrintableAscii('ab\u00e9')).toThrow(RangeError);
  });
});

describe('HashCharTransition', () => {
  it('computes dynamic getters without stored derived state and freezes itself', () => {
    const t = new HashCharTransition(0, 'H', 0);
    expect(Object.isFrozen(t)).toBe(true);
    expect(t.index).toBe(0);
    expect(t.char).toBe('H');
    expect(t.before).toBe(0);
    expect(t.ascii).toBe(72);
    expect(t.added).toBe(72);
    expect(t.multiplied).toBe(1224);
    expect(t.after).toBe(200);
  });

  it('rejects negative or non-integer index', () => {
    expect(() => new HashCharTransition(-1, 'H', 0)).toThrow(RangeError);
    expect(() => new HashCharTransition(0.5, 'H', 0)).toThrow(RangeError);
  });

  it('rejects char strings whose length is not 1', () => {
    expect(() => new HashCharTransition(0, '', 0)).toThrow(RangeError);
    expect(() => new HashCharTransition(0, 'AB', 0)).toThrow(RangeError);
  });

  it('rejects non-printable ASCII single char', () => {
    expect(() => new HashCharTransition(0, '\t', 0)).toThrow(RangeError);
    expect(() => new HashCharTransition(0, '\x7f', 0)).toThrow(RangeError);
  });

  it('rejects invalid before bucket values', () => {
    expect(() => new HashCharTransition(0, 'H', -1)).toThrow(RangeError);
    expect(() => new HashCharTransition(0, 'H', 1.5)).toThrow(RangeError);
    expect(() => new HashCharTransition(0, 'H', 256)).toThrow(RangeError);
  });
});

describe('hashAscii & traceHashCharacters', () => {
  it('traces all 4 transitions of HASH to 52', () => {
    const transitions = traceHashCharacters('HASH');
    expect(Object.isFrozen(transitions)).toBe(true);
    expect(transitions.map((t) => [t.char, t.before, t.ascii, t.added, t.multiplied, t.after])).toEqual([
      ['H', 0, 72, 72, 1224, 200],
      ['A', 200, 65, 265, 4505, 153],
      ['S', 153, 83, 236, 4012, 172],
      ['H', 172, 72, 244, 4148, 52],
    ]);
    expect(hashAscii('HASH')).toBe(52);
  });

  it('hashes empty string to 0 and boundary chars accurately', () => {
    expect(hashAscii('')).toBe(0);
    expect(traceHashCharacters('')).toEqual([]);
    expect(hashAscii(' ')).toBe((32 * 17) & 255);
    expect(hashAscii('~')).toBe((126 * 17) & 255);
  });

  it('matches all 11 official example tokens', () => {
    const expected: ReadonlyArray<readonly [string, number]> = [
      ['rn=1', 30],
      ['cm-', 253],
      ['qp=3', 97],
      ['cm=2', 47],
      ['qp-', 14],
      ['pc=4', 180],
      ['ot=9', 9],
      ['ab=5', 197],
      ['pc-', 48],
      ['pc=6', 214],
      ['ot=7', 231],
    ];
    for (const [token, code] of expected) {
      expect(hashAscii(token)).toBe(code);
      const trace = traceHashCharacters(token);
      expect(trace[trace.length - 1]?.after).toBe(code);
    }
  });

  it('rejects non-printable ASCII in hashAscii and traceHashCharacters', () => {
    expect(() => hashAscii('ok\n')).toThrow(RangeError);
    expect(() => traceHashCharacters('ok\x7f')).toThrow(RangeError);
  });
});
