import { describe, expect, it } from 'vitest';
import {
  DisplayEntry,
  OUTPUT_PATTERN_COUNT,
  SIGNAL_PATTERN_COUNT,
} from './entry';
import { CANONICAL_DIGIT_MASKS, SignalPattern } from './segments';

function canonicalSignals(): SignalPattern[] {
  return CANONICAL_DIGIT_MASKS.map((mask) => new SignalPattern(mask));
}

describe('2021 Day 8 DisplayEntry', () => {
  it('freezes signals, outputs, and derived wireFrequencies', () => {
    const signals = canonicalSignals();
    const one = signals[1]!;
    const four = signals[4]!;
    const entry = new DisplayEntry(signals, [one, one, four, one]);

    expect(SIGNAL_PATTERN_COUNT).toBe(10);
    expect(OUTPUT_PATTERN_COUNT).toBe(4);
    expect(Object.isFrozen(entry)).toBe(true);
    expect(Object.isFrozen(entry.signals)).toBe(true);
    expect(Object.isFrozen(entry.outputs)).toBe(true);

    const freqs = entry.wireFrequencies;
    expect(Object.isFrozen(freqs)).toBe(true);
    expect(freqs).toEqual([8, 6, 8, 7, 4, 9, 7]);
  });

  it('finds signal by segment count or returns null when absent', () => {
    const signals = canonicalSignals();
    const entry = new DisplayEntry(signals, [signals[0]!, signals[1]!, signals[2]!, signals[3]!]);

    expect(entry.findSignalBySegmentCount(2)?.mask).toBe(CANONICAL_DIGIT_MASKS[1]);
    expect(entry.findSignalBySegmentCount(4)?.mask).toBe(CANONICAL_DIGIT_MASKS[4]);
    expect(entry.findSignalBySegmentCount(1)).toBeNull();
  });

  it('rejects wrong signal/output counts and duplicate signal patterns', () => {
    const signals = canonicalSignals();
    const validOutputs = [signals[0]!, signals[1]!, signals[2]!, signals[3]!];

    expect(() => new DisplayEntry(signals.slice(0, 9), validOutputs)).toThrow(RangeError);
    expect(() => new DisplayEntry([...signals, signals[0]!], validOutputs)).toThrow(RangeError);

    const dupSignals = [...signals.slice(0, 9), signals[0]!];
    expect(() => new DisplayEntry(dupSignals, validOutputs)).toThrow(Error);

    expect(() => new DisplayEntry(signals, validOutputs.slice(0, 3))).toThrow(RangeError);
    expect(() => new DisplayEntry(signals, [...validOutputs, signals[4]!])).toThrow(RangeError);
  });
});
