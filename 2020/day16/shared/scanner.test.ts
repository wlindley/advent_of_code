import { describe, expect, it } from 'vitest';
import { ClosedInterval } from '../../../shared/core';
import { FieldRule, parseTicketDocument, Ticket } from './model';
import {
  buildCompatibilityMasks,
  FieldResolution,
  PeelingStep,
  resolveFieldMapping,
  scanNearbyTickets,
  scanTicket,
  TicketScanResult,
} from './scanner';

const PART2_EXAMPLE = [
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

describe('TicketScanResult and ticket scanning', () => {
  it('treats a ticket with invalid 0n as invalid despite 0n error sum', () => {
    const doc = parseTicketDocument(
      'a: 1-3\n\nyour ticket:\n1\n\nnearby tickets:\n0\n2',
    );
    const scans = scanNearbyTickets(doc);
    expect(scans).toHaveLength(2);
    expect(scans[0]?.isValid).toBe(false);
    expect(scans[0]?.invalidCount).toBe(1);
    expect(scans[0]?.invalidSum).toBe(0n);
    expect(scans[1]?.isValid).toBe(true);
    expect(Object.isFrozen(scans)).toBe(true);
    expect(Object.isFrozen(scans[0])).toBe(true);
    expect(Object.isFrozen(scans[0]?.invalidIndices)).toBe(true);
  });

  it('sums multiple invalid values on a single ticket and validates indices', () => {
    const doc = parseTicketDocument(
      'a: 10-20\nb: 30-40\n\nyour ticket:\n10,30\n\nnearby tickets:\n5,99',
    );
    const result = scanTicket(doc.nearbyTickets[0]!, doc.validUnion);
    expect(result.invalidIndices).toEqual([0, 1]);
    expect(result.invalidCount).toBe(2);
    expect(result.invalidSum).toBe(104n);
    expect(() => new TicketScanResult(doc.yourTicket, [-1])).toThrow(RangeError);
    expect(() => new TicketScanResult(doc.yourTicket, [2])).toThrow(RangeError);
    expect(() => new TicketScanResult(doc.yourTicket, [0.5])).toThrow(RangeError);
  });
});

describe('buildCompatibilityMasks and resolveFieldMapping', () => {
  it('validates non-empty rules, non-empty tickets, and matching widths', () => {
    const rule = new FieldRule('a', [new ClosedInterval(1n, 5n)]);
    const ticket = new Ticket([1n]);
    expect(() => buildCompatibilityMasks([], [ticket])).toThrow();
    expect(() => buildCompatibilityMasks([rule], [])).toThrow();
    expect(() => buildCompatibilityMasks([rule], [new Ticket([1n, 2n])])).toThrow();
  });

  it('resolves the 3-field example via degree-1 peeling', () => {
    const doc = parseTicketDocument(PART2_EXAMPLE);
    const valid = [...doc.nearbyTickets, doc.yourTicket];
    const resolution = resolveFieldMapping(doc.rules, valid);
    expect(resolution).toBeInstanceOf(FieldResolution);
    expect(resolution.fieldCount).toBe(3);
    expect(resolution.initialMasks).toEqual([0b110n, 0b111n, 0b100n]);
    expect(resolution.steps).toHaveLength(3);
    expect(resolution.steps[0]).toBeInstanceOf(PeelingStep);
    expect(resolution.columnByField.get('row')).toBe(0);
    expect(resolution.columnByField.get('class')).toBe(1);
    expect(resolution.columnByField.get('seat')).toBe(2);
    expect(Object.isFrozen(resolution)).toBe(true);
    expect(Object.isFrozen(resolution.steps[0])).toBe(true);
  });

  it('resolves a 56-field triangular peeling case accurately past 53 bits', () => {
    const n = 56;
    const rules = Array.from({ length: n }, (_, r) =>
      new FieldRule(`f${r}`, [new ClosedInterval(0n, BigInt(r))]),
    );
    const ticket = new Ticket(Array.from({ length: n }, (_, c) => BigInt(n - 1 - c)));
    const resolution = resolveFieldMapping(rules, [ticket]);
    expect(resolution.fieldCount).toBe(n);
    expect(resolution.steps).toHaveLength(n);
    expect(resolution.columnByField.get('f0')).toBe(55);
    expect(resolution.columnByField.get('f55')).toBe(0);
  });

  it('throws when peeling stalls due to ambiguity or column collision', () => {
    const rules = [
      new FieldRule('a', [new ClosedInterval(1n, 10n)]),
      new FieldRule('b', [new ClosedInterval(1n, 10n)]),
    ];
    expect(() => resolveFieldMapping(rules, [new Ticket([2n, 3n])])).toThrow(/stalled/i);

    const colliding = [
      new FieldRule('x', [new ClosedInterval(1n, 2n)]),
      new FieldRule('y', [new ClosedInterval(1n, 2n)]),
    ];
    expect(() => resolveFieldMapping(colliding, [new Ticket([99n, 1n])])).toThrow(/column/i);
  });
});
