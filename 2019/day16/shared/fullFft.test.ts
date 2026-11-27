import { describe, expect, it } from 'vitest';
import { DEFAULT_PHASES, parseSignal, patternWeight, Signal } from './signal';
import { runFullFft, stepFftPhase } from './fullFft';

/** Independent O(N^2) direct dot-product oracle for cross-checking prefix-sum FFT. */
function naiveFft(signal: Signal, phases: number): string {
  let current = Array.from(signal.copyToBuffer());
  for (let p = 0; p < phases; p += 1) {
    const next = new Array<number>(current.length);
    for (let row = 0; row < current.length; row += 1) {
      let sum = 0;
      for (let col = 0; col < current.length; col += 1) {
        sum += current[col]! * patternWeight(row, col);
      }
      next[row] = Math.abs(sum) % 10;
    }
    current = next;
  }
  return current.join('');
}

describe('fullFft', () => {
  it('matches phases 0 through 4 for the 8-digit example', () => {
    const signal = parseSignal('12345678');
    expect(runFullFft(signal, 0).toString()).toBe('12345678');
    expect(runFullFft(signal, 1).toString()).toBe('48226158');
    expect(runFullFft(signal, 2).toString()).toBe('34040438');
    expect(runFullFft(signal, 3).toString()).toBe('03415518');
    expect(runFullFft(signal, 4).toString()).toBe('01029498');
  });

  it('matches all three official 100-phase Part 1 examples', () => {
    const cases: ReadonlyArray<readonly [string, string]> = [
      ['80871224585914546619083218645595', '24176176'],
      ['19617804207202209144916044189917', '73745418'],
      ['69317163492948606335995924319873', '52432133'],
    ];
    for (const [raw, expectedPrefix] of cases) {
      const result = runFullFft(parseSignal(raw), DEFAULT_PHASES);
      expect(result.sliceString(0, 8)).toBe(expectedPrefix);
    }
  });

  it('agrees with the naive O(N^2) dot-product oracle on odd, even, prime, and negative-sum inputs', () => {
    const samples = ['9', '19', '109', '1090', '0099', '9081726', '51728394012', '8374619203847'];
    for (const raw of samples) {
      const signal = parseSignal(raw);
      for (const phases of [1, 3, 5]) {
        expect(runFullFft(signal, phases).toString()).toBe(naiveFft(signal, phases));
      }
    }
  });

  it('validates phase counts and stepFftPhase buffer lengths', () => {
    const signal = parseSignal('1234');
    expect(() => runFullFft(signal, -1)).toThrow(RangeError);
    expect(() => runFullFft(signal, 1.5)).toThrow(RangeError);

    expect(() => stepFftPhase(new Uint8Array(0), new Uint8Array(0), new Int32Array(1))).toThrow(RangeError);
    expect(() => stepFftPhase(new Uint8Array(4), new Uint8Array(3), new Int32Array(5))).toThrow(RangeError);
    expect(() => stepFftPhase(new Uint8Array(4), new Uint8Array(4), new Int32Array(4))).toThrow(RangeError);
  });
});
