import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MAX_TRACE_STEPS,
  PowerRates,
  analyzePowerConsumption,
  tallyAllColumns,
  tracePowerConsumption,
} from './powerAnalysis';
import { parseDiagnosticReport } from './report';

const EXAMPLE_INPUT = [
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

describe('PowerRates', () => {
  it('freezes fields and computes powerConsumption and padded binary strings dynamically', () => {
    const rates = new PowerRates(22n, 9n, 5);
    expect(Object.isFrozen(rates)).toBe(true);
    expect(rates.gamma).toBe(22n);
    expect(rates.epsilon).toBe(9n);
    expect(rates.bitWidth).toBe(5);
    expect(rates.powerConsumption).toBe(198n);
    expect(rates.gammaBinary).toBe('10110');
    expect(rates.epsilonBinary).toBe('01001');

    const edge = new PowerRates(0n, 31n, 5);
    expect(edge.gammaBinary).toBe('00000');
    expect(edge.epsilonBinary).toBe('11111');
  });

  it('rejects invalid bitWidth and out-of-range gamma/epsilon values', () => {
    expect(() => new PowerRates(0n, 0n, 0)).toThrow(RangeError);
    expect(() => new PowerRates(0n, 0n, -2)).toThrow(RangeError);
    expect(() => new PowerRates(0n, 0n, 1.5)).toThrow(RangeError);
    expect(() => new PowerRates(-1n, 0n, 4)).toThrow(RangeError);
    expect(() => new PowerRates(16n, 0n, 4)).toThrow(RangeError);
    expect(() => new PowerRates(0n, -1n, 4)).toThrow(RangeError);
    expect(() => new PowerRates(0n, 16n, 4)).toThrow(RangeError);
  });
});

describe('tallyAllColumns & analyzePowerConsumption', () => {
  it('tallies all columns and solves the example diagnostic report', () => {
    const report = parseDiagnosticReport(EXAMPLE_INPUT);
    const tallies = tallyAllColumns(report);
    expect(Object.isFrozen(tallies)).toBe(true);
    expect(tallies.map((t) => [t.ones, t.zeros])).toEqual([
      [7, 5],
      [5, 7],
      [8, 4],
      [7, 5],
      [5, 7],
    ]);

    const rates = analyzePowerConsumption(report);
    expect(rates.gamma).toBe(22n);
    expect(rates.epsilon).toBe(9n);
    expect(rates.powerConsumption).toBe(198n);
  });

  it('breaks equal-count ties in favor of 1 for gamma and 0 for epsilon', () => {
    const report = parseDiagnosticReport('10\n01');
    const rates = analyzePowerConsumption(report);
    expect(rates.gamma).toBe(3n);
    expect(rates.epsilon).toBe(0n);
    expect(rates.powerConsumption).toBe(0n);
  });

  it('handles wide (>64 bit) reports with exact BigInt arithmetic', () => {
    const rowA = '1' + '0'.repeat(69);
    const rowB = '1' + '0'.repeat(69);
    const report = parseDiagnosticReport(`${rowA}\n${rowB}`);
    const rates = analyzePowerConsumption(report);
    expect(rates.gamma).toBe(1n << 69n);
    expect(rates.epsilon).toBe((1n << 69n) - 1n);
    expect(rates.powerConsumption).toBe((1n << 69n) * ((1n << 69n) - 1n));
  });
});

describe('tracePowerConsumption', () => {
  it('traces all columns with omitted or empty TraceOptions', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(120);
    const report = parseDiagnosticReport(EXAMPLE_INPUT);

    const omitted = tracePowerConsumption(report);
    expect(Object.isFrozen(omitted)).toBe(true);
    expect(omitted.length).toBe(5);
    expect(omitted[0]?.column).toBe(0);
    expect(omitted[0]?.gammaBit).toBe('1');
    expect(omitted[0]?.epsilonBit).toBe('0');
    expect(omitted[0]?.prefixRates.gammaBinary).toBe('1');
    expect(omitted[1]?.gammaBit).toBe('0');
    expect(omitted[1]?.epsilonBit).toBe('1');
    expect(omitted[4]?.prefixRates.powerConsumption).toBe(198n);

    const emptyOpts = tracePowerConsumption(report, {});
    expect(emptyOpts.length).toBe(5);
    expect(emptyOpts[4]?.prefixRates.powerConsumption).toBe(198n);
  });

  it('samples bounded frames for maxSteps=3 and maxSteps=1 and rejects invalid maxSteps', () => {
    const report = parseDiagnosticReport(EXAMPLE_INPUT);
    const sampled3 = tracePowerConsumption(report, { maxSteps: 3 });
    expect(sampled3.map((f) => f.column)).toEqual([0, 2, 4]);
    expect(sampled3[1]?.prefixRates.gammaBinary).toBe('101');
    expect(sampled3[2]?.prefixRates.powerConsumption).toBe(198n);

    const sampled1 = tracePowerConsumption(report, { maxSteps: 1 });
    expect(sampled1.map((f) => f.column)).toEqual([4]);
    expect(sampled1[0]?.prefixRates.powerConsumption).toBe(198n);

    expect(() => tracePowerConsumption(report, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => tracePowerConsumption(report, { maxSteps: -2 })).toThrow(RangeError);
    expect(() => tracePowerConsumption(report, { maxSteps: 2.5 })).toThrow(RangeError);
  });
});
