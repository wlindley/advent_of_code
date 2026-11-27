import { describe, expect, it } from 'vitest';
import { runFullFft } from './fullFft';
import {
  DEFAULT_PHASES,
  MESSAGE_LENGTH,
  OFFSET_DIGITS,
  PART2_REPEAT_COUNT,
  parseSignal,
  Signal,
} from './signal';
import {
  buildTailBuffer,
  formatPrefixDigits,
  runTailFft,
  solveOffsetMessage,
  stepTailPhaseInPlace,
  validateTailBounds,
} from './tailFft';

const PASCAL_MOD_5: ReadonlyArray<readonly number[]> = [
  [1, 0, 0, 0, 0],
  [1, 1, 0, 0, 0],
  [1, 2, 1, 0, 0],
  [1, 3, 3, 1, 0],
  [1, 4, 1, 4, 1],
];

function binomialMod5(n: number, r: number): number {
  let acc = 1;
  let nn = n;
  let rr = r;
  while (rr > 0) {
    const nd = nn % 5;
    const rd = rr % 5;
    if (rd > nd) return 0;
    acc = (acc * PASCAL_MOD_5[nd]![rd]!) % 5;
    nn = Math.floor(nn / 5);
    rr = Math.floor(rr / 5);
  }
  return acc;
}

/** Independent Lucas's Theorem + CRT mod 10 binomial convolution oracle. */
function lucasTailOracle(
  signal: Signal,
  repeatCount: number,
  offset: number,
  phases: number,
  messageLength: number,
): string {
  const totalLength = signal.length * repeatCount;
  const tailLen = totalLength - offset;
  const digits = signal.copyToBuffer();
  const baseLen = digits.length;
  let out = '';
  for (let k = 0; k < messageLength; k += 1) {
    let sum = 0;
    for (let j = 0; j < tailLen - k; j += 1) {
      const n = j + phases - 1;
      const r = phases - 1;
      const m2 = (n & r) === r ? 1 : 0;
      const m5 = binomialMod5(n, r);
      const coeffMod10 = (5 * m2 + 6 * m5) % 10;
      sum = (sum + coeffMod10 * digits[(offset + k + j) % baseLen]!) % 10;
    }
    out += String(sum);
  }
  return out;
}

describe('tailFft', () => {
  it('matches all three official Part 2 examples and the Lucas + CRT binomial oracle', () => {
    const cases: ReadonlyArray<readonly [string, string]> = [
      ['03036732577212944063491565474664', '84462026'],
      ['02935109699940807407585447034323', '78725270'],
      ['03081770884921959731165446850517', '53553731'],
    ];
    for (const [raw, expected] of cases) {
      const signal = parseSignal(raw);
      const offset = signal.readOffset(OFFSET_DIGITS);
      const actual = solveOffsetMessage(
        signal,
        PART2_REPEAT_COUNT,
        OFFSET_DIGITS,
        DEFAULT_PHASES,
        MESSAGE_LENGTH,
      );
      expect(actual).toBe(expected);
      expect(actual).toBe(
        lucasTailOracle(signal, PART2_REPEAT_COUNT, offset, DEFAULT_PHASES, MESSAGE_LENGTH),
      );
    }
  });

  it('cross-checks exact midpoint boundary for both even and odd totalLength against runFullFft', () => {
    const evenSignal = parseSignal('123456789012'); // length 12, midpoint 6
    const oddSignal = parseSignal('1234567890123'); // length 13, midpoint 6
    for (const signal of [evenSignal, oddSignal]) {
      const midpoint = Math.floor(signal.length / 2);
      const fullOut = runFullFft(signal, 7);
      expect(runTailFft(signal, 1, midpoint, 7, 4)).toBe(fullOut.sliceString(midpoint, 4));
      expect(runTailFft(signal, 1, midpoint, 0, 4)).toBe(signal.sliceString(midpoint, 4));
    }
  });

  it('builds tail buffer, steps in place, and formats prefix digits', () => {
    const signal = parseSignal('1234');
    const tail = buildTailBuffer(signal, 2, 5);
    expect(Array.from(tail)).toEqual([2, 3, 4]);
    stepTailPhaseInPlace(tail);
    expect(Array.from(tail)).toEqual([9, 7, 4]);
    expect(formatPrefixDigits(tail, 2)).toBe('97');
  });

  it('rejects out-of-range offsets, empty tail buffers, and invalid bounds', () => {
    expect(() => validateTailBounds(10, 4, 2)).toThrow(RangeError);
    expect(() => validateTailBounds(11, 4, 2)).toThrow(RangeError);
    expect(() => validateTailBounds(10, 8, 3)).toThrow(RangeError);
    expect(() => validateTailBounds(0, 0, 1)).toThrow(RangeError);
    expect(() => validateTailBounds(10, -1, 1)).toThrow(RangeError);
    expect(() => validateTailBounds(10, 5, 0)).toThrow(RangeError);

    const signal = parseSignal('123456');
    expect(() => buildTailBuffer(signal, 0, 3)).toThrow(RangeError);
    expect(() => buildTailBuffer(signal, 1, 6)).toThrow(RangeError);
    expect(() => stepTailPhaseInPlace(new Uint8Array(0))).toThrow(RangeError);
    expect(() => formatPrefixDigits(new Uint8Array([1, 2]), 3)).toThrow(RangeError);
    expect(() => runTailFft(signal, 1, 3, -1, 2)).toThrow(RangeError);
  });
});
