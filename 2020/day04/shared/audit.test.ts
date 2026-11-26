import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MAX_TRACE_STEPS,
  PassportTraceFrame,
  countValidPassports,
  tracePassportScan,
} from './audit';
import { parsePassportBatch } from './passport';
import { PRESENCE_POLICY } from './policy';

const SAMPLE_BATCH_RAW = [
  'ecl:gry pid:860033327 eyr:2020 hcl:#fffffd byr:1937 iyr:2017 cid:147 hgt:183cm',
  'iyr:2013 ecl:amb cid:350 eyr:2023 pid:028048884 hcl:#cfa07d byr:1929',
  'hcl:#ae17e1 iyr:2013 eyr:2024 ecl:brn pid:760753108 byr:1931 hgt:179cm',
  'hcl:#cfa07d eyr:2025 pid:166559648 iyr:2011 ecl:brn hgt:59in',
].join('\n\n');

describe('PassportTraceFrame', () => {
  it('exposes stored and dynamically derived scan fields', () => {
    const batch = parsePassportBatch(SAMPLE_BATCH_RAW);
    const validEval = PRESENCE_POLICY.evaluate(batch.records[0]!);
    const invalidEval = PRESENCE_POLICY.evaluate(batch.records[1]!);

    const frame0 = new PassportTraceFrame(0, 4, validEval, 1);
    const frame1 = new PassportTraceFrame(1, 4, invalidEval, 1);

    expect(Object.isFrozen(frame0)).toBe(true);
    expect(frame0.recordIndex).toBe(0);
    expect(frame0.totalRecords).toBe(4);
    expect(frame0.evaluation).toBe(validEval);
    expect(frame0.record).toBe(batch.records[0]);
    expect(frame0.isValid).toBe(true);
    expect(frame0.checkedSoFar).toBe(1);
    expect(frame0.validSoFar).toBe(1);
    expect(frame0.invalidSoFar).toBe(0);

    expect(frame1.isValid).toBe(false);
    expect(frame1.checkedSoFar).toBe(2);
    expect(frame1.validSoFar).toBe(1);
    expect(frame1.invalidSoFar).toBe(1);
  });

  it('rejects out-of-range or inconsistent indices and valid counts', () => {
    const batch = parsePassportBatch(SAMPLE_BATCH_RAW);
    const validEval = PRESENCE_POLICY.evaluate(batch.records[0]!);
    const invalidEval = PRESENCE_POLICY.evaluate(batch.records[1]!);

    expect(() => new PassportTraceFrame(0, 0, validEval, 1)).toThrow(RangeError);
    expect(() => new PassportTraceFrame(0, 1.5, validEval, 1)).toThrow(RangeError);
    expect(() => new PassportTraceFrame(-1, 4, validEval, 1)).toThrow(RangeError);
    expect(() => new PassportTraceFrame(4, 4, validEval, 1)).toThrow(RangeError);
    expect(() => new PassportTraceFrame(0, 4, validEval, 0)).toThrow(RangeError);
    expect(() => new PassportTraceFrame(0, 4, validEval, 2)).toThrow(RangeError);
    expect(() => new PassportTraceFrame(1, 4, invalidEval, 2)).toThrow(RangeError);
    expect(() => new PassportTraceFrame(1, 4, invalidEval, -1)).toThrow(RangeError);
    expect(() => new PassportTraceFrame(1, 4, invalidEval, 0.5)).toThrow(RangeError);
  });
});

describe('countValidPassports and tracePassportScan', () => {
  it('counts valid passports and emits every frame when within maxSteps', () => {
    const batch = parsePassportBatch(SAMPLE_BATCH_RAW);
    expect(countValidPassports(batch, PRESENCE_POLICY)).toBe(2);

    const frames = tracePassportScan(batch, PRESENCE_POLICY);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(120);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames).toHaveLength(4);
    expect(frames.map((f) => f.validSoFar)).toEqual([1, 1, 2, 2]);
    expect(frames.map((f) => f.recordIndex)).toEqual([0, 1, 2, 3]);
  });

  it('downsamples large scans to maxSteps while preserving final cumulative counts', () => {
    const batch = parsePassportBatch(SAMPLE_BATCH_RAW);
    const twoFrames = tracePassportScan(batch, PRESENCE_POLICY, 2);
    expect(twoFrames.map((f) => f.recordIndex)).toEqual([0, 3]);
    expect(twoFrames[1]?.validSoFar).toBe(2);
    expect(twoFrames[1]?.invalidSoFar).toBe(2);

    const oneFrame = tracePassportScan(batch, PRESENCE_POLICY, 1);
    expect(oneFrame).toHaveLength(1);
    expect(oneFrame[0]?.recordIndex).toBe(3);
    expect(oneFrame[0]?.validSoFar).toBe(2);

    expect(() => tracePassportScan(batch, PRESENCE_POLICY, 0)).toThrow(RangeError);
  });
});
