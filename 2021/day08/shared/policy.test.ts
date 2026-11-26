import { describe, expect, it } from 'vitest';
import { DisplayEntry } from './entry';
import {
  DECODED_OUTPUT_SUM_POLICY,
  DecodedOutputSumPolicy,
  UNIQUE_DIGITS_POLICY,
  UniqueDigitsPolicy,
} from './policy';
import { CANONICAL_DIGIT_MASKS, SignalPattern } from './segments';
import { decodeDisplayEntry } from './wiring';

function sampleDisplay() {
  const canonical = CANONICAL_DIGIT_MASKS.map((mask) => new SignalPattern(mask));
  const entry = new DisplayEntry(canonical, [
    canonical[0]!,
    canonical[1]!,
    canonical[2]!,
    canonical[4]!,
  ]);
  return decodeDisplayEntry(entry);
}

describe('2021 Day 8 display evaluation policies', () => {
  it('evaluates and highlights unique-segment digits in UniqueDigitsPolicy', () => {
    const display = sampleDisplay();
    expect(UNIQUE_DIGITS_POLICY).toBeInstanceOf(UniqueDigitsPolicy);
    expect(Object.isFrozen(UNIQUE_DIGITS_POLICY)).toBe(true);
    expect(UNIQUE_DIGITS_POLICY.id).toBe('unique-digits');
    expect(UNIQUE_DIGITS_POLICY.label.length).toBeGreaterThan(0);
    expect(UNIQUE_DIGITS_POLICY.contributionLabel.length).toBeGreaterThan(0);
    expect(UNIQUE_DIGITS_POLICY.totalLabel.length).toBeGreaterThan(0);
    expect(UNIQUE_DIGITS_POLICY.evaluate(display)).toBe(2);
    expect(UNIQUE_DIGITS_POLICY.highlightsDigit(display.outputs[0])).toBe(false);
    expect(UNIQUE_DIGITS_POLICY.highlightsDigit(display.outputs[1])).toBe(true);
    expect(UNIQUE_DIGITS_POLICY.highlightsDigit(display.outputs[2])).toBe(false);
    expect(UNIQUE_DIGITS_POLICY.highlightsDigit(display.outputs[3])).toBe(true);
  });

  it('evaluates full 4-digit value and highlights all digits in DecodedOutputSumPolicy', () => {
    const display = sampleDisplay();
    expect(DECODED_OUTPUT_SUM_POLICY).toBeInstanceOf(DecodedOutputSumPolicy);
    expect(Object.isFrozen(DECODED_OUTPUT_SUM_POLICY)).toBe(true);
    expect(DECODED_OUTPUT_SUM_POLICY.id).toBe('decoded-output-sum');
    expect(DECODED_OUTPUT_SUM_POLICY.label.length).toBeGreaterThan(0);
    expect(DECODED_OUTPUT_SUM_POLICY.contributionLabel.length).toBeGreaterThan(0);
    expect(DECODED_OUTPUT_SUM_POLICY.totalLabel.length).toBeGreaterThan(0);
    expect(DECODED_OUTPUT_SUM_POLICY.evaluate(display)).toBe(124);
    expect(DECODED_OUTPUT_SUM_POLICY.highlightsDigit(display.outputs[0])).toBe(true);
    expect(DECODED_OUTPUT_SUM_POLICY.highlightsDigit(display.outputs[1])).toBe(true);
  });
});
