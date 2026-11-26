import { describe, expect, it } from 'vitest';
import {
  BitTally,
  DiagnosticReport,
  LEAST_COMMON_CRITERION,
  MOST_COMMON_CRITERION,
  parseDiagnosticReport,
} from '../../shared';
import {
  LifeSupportRates,
  RatingSelection,
  analyzeLifeSupport,
  findRatingSelection,
  selectFilterBit,
} from './ratingFilter';

const AOC_EXAMPLE = [
  '00100',
  '11110',
  '10110',
  '10111',
  '10101',
  '01111',
  '00111',
  '11100',
  '10000',
  '11001',
  '00010',
  '01010',
].join('\n');

function createSelection(bits: string, rowIndex: number, roundsApplied: number): RatingSelection {
  return new RatingSelection(bits, rowIndex, roundsApplied);
}

describe('selectFilterBit', () => {
  it('forces keeping the sole remaining bit when a column is unanimous', () => {
    expect(selectFilterBit(new BitTally(0, 4), MOST_COMMON_CRITERION)).toBe('0');
    expect(selectFilterBit(new BitTally(0, 4), LEAST_COMMON_CRITERION)).toBe('0');
    expect(selectFilterBit(new BitTally(5, 0), MOST_COMMON_CRITERION)).toBe('1');
    expect(selectFilterBit(new BitTally(5, 0), LEAST_COMMON_CRITERION)).toBe('1');
  });

  it('delegates mixed tallies (including ties) to the given BitCriterion', () => {
    expect(selectFilterBit(new BitTally(3, 3), MOST_COMMON_CRITERION)).toBe('1');
    expect(selectFilterBit(new BitTally(3, 3), LEAST_COMMON_CRITERION)).toBe('0');
    expect(selectFilterBit(new BitTally(2, 5), MOST_COMMON_CRITERION)).toBe('0');
    expect(selectFilterBit(new BitTally(2, 5), LEAST_COMMON_CRITERION)).toBe('1');
  });
});

describe('RatingSelection', () => {
  it('computes bitWidth and bigint rating dynamically and is frozen', () => {
    const sel = new RatingSelection('10111', 3, 5);
    expect(sel.bits).toBe('10111');
    expect(sel.rowIndex).toBe(3);
    expect(sel.roundsApplied).toBe(5);
    expect(sel.bitWidth).toBe(5);
    expect(sel.rating).toBe(23n);
    expect(Object.isFrozen(sel)).toBe(true);
  });

  it('supports wide binary strings beyond 53 bits', () => {
    const wide = '1' + '0'.repeat(63);
    const sel = new RatingSelection(wide, 0, 1);
    expect(sel.bitWidth).toBe(64);
    expect(sel.rating).toBe(1n << 63n);
  });

  it('rejects invalid binary strings, rowIndex, and roundsApplied', () => {
    expect(() => createSelection('', 0, 0)).toThrow(SyntaxError);
    expect(() => createSelection('102', 0, 1)).toThrow(SyntaxError);
    expect(() => createSelection('101', -1, 1)).toThrow(RangeError);
    expect(() => createSelection('101', 1.5, 1)).toThrow(RangeError);
    expect(() => createSelection('101', 0, -1)).toThrow(RangeError);
    expect(() => createSelection('101', 0, 0.5)).toThrow(RangeError);
    expect(() => createSelection('101', 0, 4)).toThrow(RangeError);
  });
});

describe('LifeSupportRates', () => {
  it('computes bitWidth and lifeSupportRating product dynamically and is frozen', () => {
    const rates = new LifeSupportRates(
      new RatingSelection('10111', 3, 5),
      new RatingSelection('01010', 11, 3),
    );
    expect(rates.bitWidth).toBe(5);
    expect(rates.lifeSupportRating).toBe(230n);
    expect(Object.isFrozen(rates)).toBe(true);
  });

  it('rejects mismatched bit widths between oxygen and co2 selections', () => {
    const o2 = new RatingSelection('101', 0, 1);
    const co2 = new RatingSelection('01', 1, 1);
    expect(() => new LifeSupportRates(o2, co2)).toThrow(RangeError);
  });
});

describe('findRatingSelection & analyzeLifeSupport', () => {
  it('solves the AoC 2021 Day 3 Part 2 example', () => {
    const report = parseDiagnosticReport(AOC_EXAMPLE);
    const o2 = findRatingSelection(report, MOST_COMMON_CRITERION);
    const co2 = findRatingSelection(report, LEAST_COMMON_CRITERION);
    expect(o2.bits).toBe('10111');
    expect(o2.rating).toBe(23n);
    expect(o2.roundsApplied).toBe(5);
    expect(co2.bits).toBe('01010');
    expect(co2.rating).toBe(10n);
    expect(co2.roundsApplied).toBe(3);

    const rates = analyzeLifeSupport(report);
    expect(rates.lifeSupportRating).toBe(230n);
  });

  it('locks immediately with 0 rounds on a single-row report', () => {
    const report = new DiagnosticReport(['1010']);
    const rates = analyzeLifeSupport(report);
    expect(rates.oxygen.roundsApplied).toBe(0);
    expect(rates.co2.roundsApplied).toBe(0);
    expect(rates.lifeSupportRating).toBe(100n);
  });

  it('handles duplicate identical rows across all columns without collapsing to zero rows', () => {
    const report = new DiagnosticReport(['10', '10']);
    const rates = analyzeLifeSupport(report);
    expect(rates.oxygen.bits).toBe('10');
    expect(rates.oxygen.rowIndex).toBe(0);
    expect(rates.oxygen.roundsApplied).toBe(2);
    expect(rates.co2.bits).toBe('10');
    expect(rates.co2.rowIndex).toBe(0);
    expect(rates.co2.roundsApplied).toBe(2);
    expect(rates.lifeSupportRating).toBe(4n);
  });
});
