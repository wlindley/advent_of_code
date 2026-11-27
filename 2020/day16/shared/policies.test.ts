import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MAX_TRACE_STEPS,
  DEPARTURE_FIELD_PREFIX,
  DEPARTURE_PRODUCT_POLICY,
  ERROR_RATE_POLICY,
  ErrorScanTraceFrame,
  FieldPeelingTraceFrame,
} from './policies';
import { TicketTranslationSolver } from './solver';

const PART1_EXAMPLE = [
  'class: 1-3 or 5-7',
  'row: 6-11 or 33-44',
  'seat: 13-40 or 45-50',
  '',
  'your ticket:',
  '7,1,14',
  '',
  'nearby tickets:',
  '7,3,47',
  '40,4,50',
  '55,2,20',
  '38,6,12',
].join('\n');

const DEPARTURE_EXAMPLE = [
  'departure location: 0-1 or 4-19',
  'departure station: 0-5 or 8-19',
  'seat: 0-13 or 16-19',
  '',
  'your ticket:',
  '11,12,13',
  '',
  'nearby tickets:',
  '3,9,18',
  '15,1,5',
  '5,14,9',
  '0,100,5',
  '99,99,99',
].join('\n');

describe('ERROR_RATE_POLICY and ErrorScanTraceFrame', () => {
  const solver = new TicketTranslationSolver(ERROR_RATE_POLICY);

  it('solves the official Part 1 example and ignores yourTicket', () => {
    expect(DEPARTURE_FIELD_PREFIX).toBe('departure');
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(80);
    expect(solver.policy.id).toBe('error-rate');
    expect(solver.solve(solver.parse(PART1_EXAMPLE))).toBe(71n);

    const badYour = PART1_EXAMPLE.replace('7,1,14', '999,888,777');
    expect(solver.solve(solver.parse(badYour))).toBe(71n);
  });

  it('emits frozen ErrorScanTraceFrames and respects maxSteps sampling', () => {
    const doc = solver.parse(PART1_EXAMPLE);
    const full = solver.trace(doc);
    expect(full).toHaveLength(4);
    expect(full[0]).toBeInstanceOf(ErrorScanTraceFrame);
    expect(full[0]?.step).toBe(1);
    expect(full[0]?.scannedCount).toBe(1);
    expect(full[0]?.invalidTicketCount).toBe(0);
    expect(full[0]?.runningErrorRate).toBe(0n);
    expect(full[0]?.isFinal).toBe(false);

    const last = full[3]!;
    expect(last.step).toBe(4);
    expect(last.invalidTicketCount).toBe(3);
    expect(last.runningErrorRate).toBe(71n);
    expect(last.isFinal).toBe(true);
    expect(Object.isFrozen(last)).toBe(true);

    const sampled = solver.trace(doc, { maxSteps: 2 });
    expect(sampled).toHaveLength(2);
    expect(sampled[0]?.step).toBe(1);
    expect(sampled[1]?.step).toBe(4);
  });
});

describe('DEPARTURE_PRODUCT_POLICY and FieldPeelingTraceFrame', () => {
  const solver = new TicketTranslationSolver(DEPARTURE_PRODUCT_POLICY);

  it('discards invalid nearby tickets using isValid (including 0n trap) and multiplies departure fields', () => {
    const doc = solver.parse(DEPARTURE_EXAMPLE);
    // row/station -> col 0 (11), location/class -> col 1 (12), seat -> col 2 (13)
    expect(solver.solve(doc)).toBe(11n * 12n);
  });

  it('returns identity 1n when no fields start with departure', () => {
    const doc = solver.parse(PART1_EXAMPLE.replace('55,2,20', '7,3,47').replace('40,4,50', '7,3,47').replace('38,6,12', '7,3,47'));
    const noDep = [
      'class: 0-1 or 4-19',
      'row: 0-5 or 8-19',
      'seat: 0-13 or 16-19',
      '',
      'your ticket:',
      '11,12,13',
      '',
      'nearby tickets:',
      '3,9,18',
      '15,1,5',
      '5,14,9',
    ].join('\n');
    expect(doc.fieldCount).toBe(3);
    expect(solver.solve(solver.parse(noDep))).toBe(1n);
  });

  it('throws if a ticket with invalid 0n is NOT discarded when only 0n is invalid', () => {
    const zeroTrap = [
      'departure a: 1-5',
      'b: 10-20',
      '',
      'your ticket:',
      '2,15',
      '',
      'nearby tickets:',
      '2,15',
      '12,0',
    ].join('\n');
    // Ticket '12,0' has invalidSum === 0n, yet MUST be discarded via isValid; otherwise mask for 'a' would reject col 0!
    expect(solver.solve(solver.parse(zeroTrap))).toBe(2n);
  });

  it('emits frozen FieldPeelingTraceFrames with round, departure counts, and sampling', () => {
    const doc = solver.parse(DEPARTURE_EXAMPLE);
    const frames = solver.trace(doc);
    expect(frames).toHaveLength(4);
    expect(frames[0]).toBeInstanceOf(FieldPeelingTraceFrame);
    expect(frames[0]?.round).toBe(0);
    expect(frames[0]?.isFinal).toBe(false);
    expect(frames[0]?.discardedNearbyCount).toBe(2);
    expect(frames[0]?.lockedDepartureCount).toBe(0);
    expect(frames[0]?.departureProduct).toBe(1n);

    const last = frames[3]!;
    expect(last.round).toBe(3);
    expect(last.isFinal).toBe(true);
    expect(last.lockedDepartureCount).toBe(2);
    expect(last.departureProduct).toBe(132n);
    expect(Object.isFrozen(last)).toBe(true);

    const sampled = solver.trace(doc, { maxSteps: 2 });
    expect(sampled).toHaveLength(2);
    expect(sampled[0]?.round).toBe(0);
    expect(sampled[1]?.round).toBe(3);
  });
});
