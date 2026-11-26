import { describe, expect, it } from 'vitest';
import {
  AuditTraceFrame,
  countValidPasswords,
  DEFAULT_MAX_TRACE_STEPS,
  tracePasswordAudit,
} from './audit';
import { PasswordDatabase, PasswordEntry, parsePasswordDatabase } from './passwordEntry';
import { SLED_RENTAL_POLICY, TOBOGGAN_POLICY } from './policy';

const EXAMPLE_INPUT = '1-3 a: abcde\n1-3 b: cdefg\n2-9 c: ccccccccc';

function buildRepeatedDatabase(count: number): PasswordDatabase {
  const entries: PasswordEntry[] = [];
  for (let i = 0; i < count; i += 1) {
    entries.push(i % 2 === 0 ? new PasswordEntry(1, 2, 'a', 'ab') : new PasswordEntry(1, 2, 'a', 'bbb'));
  }
  return new PasswordDatabase(entries);
}

describe('AuditTraceFrame', () => {
  it('exposes frozen stored and dynamically derived audit counters', () => {
    const entry = new PasswordEntry(1, 3, 'a', 'abcde');
    const evaluation = SLED_RENTAL_POLICY.evaluate(entry);
    const frame = new AuditTraceFrame(2, 5, evaluation, 2);

    expect(Object.isFrozen(frame)).toBe(true);
    expect(frame.entryIndex).toBe(2);
    expect(frame.totalEntries).toBe(5);
    expect(frame.evaluation).toBe(evaluation);
    expect(frame.entry).toBe(entry);
    expect(frame.isValid).toBe(true);
    expect(frame.validSoFar).toBe(2);
    expect(frame.checkedSoFar).toBe(3);
    expect(frame.invalidSoFar).toBe(1);
  });

  it('rejects invalid totalEntries or entryIndex', () => {
    const evaluation = SLED_RENTAL_POLICY.evaluate(new PasswordEntry(1, 3, 'a', 'abcde'));
    expect(() => new AuditTraceFrame(0, 0, evaluation, 1)).toThrow(RangeError);
    expect(() => new AuditTraceFrame(0, 1.5, evaluation, 1)).toThrow(RangeError);
    expect(() => new AuditTraceFrame(-1, 2, evaluation, 1)).toThrow(RangeError);
    expect(() => new AuditTraceFrame(2, 2, evaluation, 1)).toThrow(RangeError);
    expect(() => new AuditTraceFrame(0.5, 2, evaluation, 1)).toThrow(RangeError);
  });

  it('rejects validSoFar outside invariant bounds for valid and invalid evaluations', () => {
    const validEval = SLED_RENTAL_POLICY.evaluate(new PasswordEntry(1, 3, 'a', 'abcde'));
    expect(() => new AuditTraceFrame(1, 3, validEval, 0)).toThrow(RangeError);
    expect(() => new AuditTraceFrame(1, 3, validEval, 3)).toThrow(RangeError);
    expect(() => new AuditTraceFrame(1, 3, validEval, 1.5)).toThrow(RangeError);

    const invalidEval = SLED_RENTAL_POLICY.evaluate(new PasswordEntry(1, 3, 'b', 'cdefg'));
    expect(() => new AuditTraceFrame(1, 3, invalidEval, -1)).toThrow(RangeError);
    expect(() => new AuditTraceFrame(1, 3, invalidEval, 2)).toThrow(RangeError);
  });
});

describe('countValidPasswords', () => {
  it('counts valid entries under both sled-rental and toboggan policies', () => {
    const db = parsePasswordDatabase(EXAMPLE_INPUT);
    expect(countValidPasswords(db, SLED_RENTAL_POLICY)).toBe(2);
    expect(countValidPasswords(db, TOBOGGAN_POLICY)).toBe(1);
  });
});

describe('tracePasswordAudit', () => {
  it('returns all frames when database size fits within default maxSteps', () => {
    const db = parsePasswordDatabase(EXAMPLE_INPUT);
    const frames = tracePasswordAudit(db, SLED_RENTAL_POLICY);

    expect(DEFAULT_MAX_TRACE_STEPS).toBe(120);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames).toHaveLength(3);
    expect(frames[0]!.validSoFar).toBe(1);
    expect(frames[1]!.validSoFar).toBe(1);
    expect(frames[2]!.validSoFar).toBe(2);
    expect(frames[2]!.invalidSoFar).toBe(1);
  });

  it('samples uniformly up to maxSteps while preserving cumulative validSoFar and final frame', () => {
    const db = buildRepeatedDatabase(10);
    const frames = tracePasswordAudit(db, SLED_RENTAL_POLICY, 4);

    expect(frames).toHaveLength(4);
    expect(frames[0]!.entryIndex).toBe(0);
    expect(frames.at(-1)!.entryIndex).toBe(9);
    expect(frames.at(-1)!.validSoFar).toBe(5);
    expect(frames.at(-1)!.invalidSoFar).toBe(5);
  });

  it('supports maxSteps = 1 by returning only the final entry with full cumulative total', () => {
    const db = buildRepeatedDatabase(6);
    const frames = tracePasswordAudit(db, TOBOGGAN_POLICY, 1);

    expect(frames).toHaveLength(1);
    expect(frames[0]!.entryIndex).toBe(5);
    expect(frames[0]!.validSoFar).toBe(3);
  });

  it('throws RangeError for non-positive or non-integer maxSteps', () => {
    const db = parsePasswordDatabase(EXAMPLE_INPUT);
    expect(() => tracePasswordAudit(db, SLED_RENTAL_POLICY, 0)).toThrow(RangeError);
    expect(() => tracePasswordAudit(db, SLED_RENTAL_POLICY, 2.5)).toThrow(RangeError);
  });
});
