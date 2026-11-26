import { describe, expect, it } from 'vitest';
import { DisplayEntry } from './entry';
import {
  CANONICAL_DIGIT_MASKS,
  CANONICAL_MASK_TO_DIGIT,
  SignalPattern,
  UNIQUE_SEGMENT_COUNTS,
  WIRE_INDICES,
  type Digit,
  type WireIndex,
} from './segments';
import {
  CANONICAL_DEDUCTION_RULES,
  DecodedDigit,
  WireMapping,
  decodeDisplayEntry,
  deduceWireMapping,
} from './wiring';

const makeSignals = (tokens: readonly string[]) => tokens.map((t) => SignalPattern.parse(t));
const nextSeed = (s: number) => (Math.imul(s, 1664525) + 1013904223) >>> 0;

function allPermutations7(): number[][] {
  const arr = [0, 1, 2, 3, 4, 5, 6];
  const c = new Array<number>(7).fill(0);
  const perms: number[][] = [[...arr]];
  for (let i = 0; i < 7; ) {
    if (c[i]! < i) {
      const s = i % 2 === 0 ? 0 : c[i]!;
      [arr[i], arr[s]] = [arr[s]!, arr[i]!];
      perms.push([...arr]);
      c[i]! += 1;
      i = 0;
    } else {
      c[i] = 0;
      i += 1;
    }
  }
  return perms;
}

function bruteForceFindMappings(entry: DisplayEntry, perms: readonly number[][]): number[][] {
  return perms.filter((perm) =>
    entry.signals.every((sig) => {
      let translated = 0;
      for (const w of WIRE_INDICES) if ((sig.mask & (1 << w)) !== 0) translated |= 1 << perm[w]!;
      return CANONICAL_MASK_TO_DIGIT.has(translated);
    }),
  );
}

function scrambleMask(canonicalMask: number, inversePerm: readonly number[]): number {
  let scrambled = 0;
  for (const cw of WIRE_INDICES) if ((canonicalMask & (1 << cw)) !== 0) scrambled |= 1 << inversePerm[cw]!;
  return scrambled;
}

describe('2021 Day 8 wiring deduction', () => {
  it('validates WireMapping bijection and translates masks without freezing Uint8Array', () => {
    expect(CANONICAL_DEDUCTION_RULES).toHaveLength(7);
    const id = new WireMapping(new Uint8Array([0, 1, 2, 3, 4, 5, 6]));
    expect(Object.isFrozen(id)).toBe(true);
    expect(id.toCanonical(2)).toBe(2);
    expect(id.decodeMask(CANONICAL_DIGIT_MASKS[7])).toBe(7);
    expect(id.decodeMask(0b0000001)).toBeNull();
    expect(() => new WireMapping(new Uint8Array([0, 1, 2]))).toThrow(RangeError);
    expect(() => new WireMapping(new Uint8Array([0, 1, 2, 3, 4, 5, 7]))).toThrow(RangeError);
    expect(() => new WireMapping(new Uint8Array([0, 1, 2, 3, 4, 5, 5]))).toThrow(RangeError);
  });

  it('decodes the official small example and preserves leading zeros', () => {
    const small = new DisplayEntry(
      makeSignals(['acedgfb', 'cdfbe', 'gcdfa', 'fbcad', 'dab', 'cefabd', 'cdfgeb', 'eafb', 'cagedb', 'ab']),
      makeSignals(['cdfeb', 'fcadb', 'cdfeb', 'cdbaf']),
    );
    const decoded = decodeDisplayEntry(small);
    expect(Object.isFrozen(decoded)).toBe(true);
    expect(decoded.outputValue).toBe(5353);
    expect(decoded.formattedOutput).toBe('5353');
    expect(decoded.uniqueDigitCount).toBe(0);
    expect(decoded.outputs[0]).toBeInstanceOf(DecodedDigit);
    expect(decoded.outputs[0].canonicalMask).toBe(CANONICAL_DIGIT_MASKS[5]);
    expect(decoded.outputs[0].isUniqueSegmentCount).toBe(false);

    const canonical = CANONICAL_DIGIT_MASKS.map((m) => new SignalPattern(m));
    const zeroLead = decodeDisplayEntry(new DisplayEntry(canonical, makeSignals(['abcefg', 'cf', 'acdeg', 'acdfg'])));
    expect(zeroLead.outputValue).toBe(123);
    expect(zeroLead.formattedOutput).toBe('0123');
    expect(zeroLead.uniqueDigitCount).toBe(1);
    expect(zeroLead.outputs[1].isUniqueSegmentCount).toBe(true);
  });

  it('rejects missing 1/4, invalid frequencies, invalid outputs, and forged frequency-sum wirings', () => {
    const c = CANONICAL_DIGIT_MASKS.map((m) => new SignalPattern(m));
    const five = SignalPattern.parse('abcde');
    expect(() => deduceWireMapping(new DisplayEntry([c[0]!, five, ...c.slice(2)], c.slice(0, 4)))).toThrow();
    expect(() => deduceWireMapping(new DisplayEntry([...c.slice(0, 4), five, ...c.slice(5)], c.slice(0, 4)))).toThrow();
    const badFreq = makeSignals(['cf', 'bcdf', 'acf', 'abcdefg', 'abcefg', 'acdeg', 'acdfg', 'abdfg', 'abdefg', 'abcde']);
    expect(() => deduceWireMapping(new DisplayEntry(badFreq, c.slice(0, 4)))).toThrow();

    const forged = new DisplayEntry(
      makeSignals(['abcefg', 'af', 'acdeg', 'acdfg', 'bcdf', 'bcdfg', 'abdefg', 'acf', 'abcdefg', 'abcdfg']),
      makeSignals(['af', 'bcdf', 'acf', 'abcdefg']),
    );
    expect(() => deduceWireMapping(forged)).toThrow();
    expect(bruteForceFindMappings(forged, allPermutations7())).toHaveLength(0);
    expect(() => decodeDisplayEntry(new DisplayEntry(c, [SignalPattern.parse('ab'), c[1]!, c[2]!, c[3]!]))).toThrow();
  });

  it('matches the independent 7! brute-force oracle across 40 seeded scrambled displays', () => {
    const perms = allPermutations7();
    expect(perms).toHaveLength(5040);
    let seed = 20210801;
    for (let trial = 0; trial < 40; trial += 1) {
      const wireToCanonical = [0, 1, 2, 3, 4, 5, 6];
      for (let i = 6; i > 0; i -= 1) {
        seed = nextSeed(seed);
        const j = seed % (i + 1);
        [wireToCanonical[i], wireToCanonical[j]] = [wireToCanonical[j]!, wireToCanonical[i]!];
      }
      const canonicalToWire = [0, 1, 2, 3, 4, 5, 6];
      for (const w of WIRE_INDICES) canonicalToWire[wireToCanonical[w]!] = w;
      const signals = CANONICAL_DIGIT_MASKS.map((m) => new SignalPattern(scrambleMask(m, canonicalToWire)));
      const outDigits: Digit[] = [0, 0, 0, 0].map(() => {
        seed = nextSeed(seed);
        return (seed % 10) as Digit;
      });
      const entry = new DisplayEntry(
        signals,
        outDigits.map((d) => new SignalPattern(scrambleMask(CANONICAL_DIGIT_MASKS[d]!, canonicalToWire))),
      );
      const oracleMatches = bruteForceFindMappings(entry, perms);
      expect(oracleMatches).toHaveLength(1);
      const decoded = decodeDisplayEntry(entry);
      for (const w of WIRE_INDICES) expect(decoded.mapping.toCanonical(w)).toBe(oracleMatches[0]![w] as WireIndex);
      expect(decoded.outputs.map((o) => o.value)).toEqual(outDigits);
      expect(decoded.outputValue).toBe(outDigits[0]! * 1000 + outDigits[1]! * 100 + outDigits[2]! * 10 + outDigits[3]!);
      expect(decoded.uniqueDigitCount).toBe(
        outDigits.filter((d) => UNIQUE_SEGMENT_COUNTS.has(new SignalPattern(CANONICAL_DIGIT_MASKS[d]!).segmentCount)).length,
      );
    }
  });
});
