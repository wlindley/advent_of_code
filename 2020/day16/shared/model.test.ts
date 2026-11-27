import { describe, expect, it } from 'vitest';
import { ClosedInterval } from '../../../shared/core';
import { FieldRule, parseTicketDocument, Ticket, TicketDocument } from './model';

const SAMPLE_DOC = [
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

describe('FieldRule', () => {
  it('stores frozen ranges and checks value membership', () => {
    const rule = new FieldRule('class', [new ClosedInterval(1n, 3n), new ClosedInterval(5n, 7n)]);
    expect(rule.name).toBe('class');
    expect(Object.isFrozen(rule)).toBe(true);
    expect(Object.isFrozen(rule.ranges)).toBe(true);
    expect(rule.matches(0n)).toBe(false);
    expect(rule.matches(3n)).toBe(true);
    expect(rule.matches(4n)).toBe(false);
    expect(rule.matches(6n)).toBe(true);
  });

  it('rejects empty name or empty ranges', () => {
    expect(() => new FieldRule('   ', [new ClosedInterval(1n, 2n)])).toThrow();
    expect(() => new FieldRule('class', [])).toThrow();
  });
});

describe('Ticket', () => {
  it('stores frozen bigint values and computes fieldCount dynamically', () => {
    const ticket = new Ticket([0n, 7n, 9_007_199_254_740_995n]);
    expect(ticket.fieldCount).toBe(3);
    expect(Object.isFrozen(ticket)).toBe(true);
    expect(Object.isFrozen(ticket.values)).toBe(true);
  });

  it('rejects empty tickets and negative values', () => {
    expect(() => new Ticket([])).toThrow();
    expect(() => new Ticket([1n, -1n])).toThrow(RangeError);
  });
});

describe('TicketDocument', () => {
  it('freezes collections and derives fieldCount and validUnion dynamically', () => {
    const r1 = new FieldRule('a', [new ClosedInterval(1n, 3n)]);
    const r2 = new FieldRule('b', [new ClosedInterval(4n, 6n)]);
    const doc = new TicketDocument([r1, r2], new Ticket([1n, 5n]), [new Ticket([2n, 6n])]);
    expect(doc.fieldCount).toBe(2);
    expect(doc.validUnion.intervals).toHaveLength(1);
    expect(doc.validUnion.contains(3n)).toBe(true);
    expect(doc.validUnion.contains(7n)).toBe(false);
    expect(Object.isFrozen(doc)).toBe(true);
    expect(Object.isFrozen(doc.rules)).toBe(true);
    expect(Object.isFrozen(doc.nearbyTickets)).toBe(true);
  });

  it('validates rule uniqueness, non-empty nearby tickets, and matching widths', () => {
    const r1 = new FieldRule('dup', [new ClosedInterval(1n, 3n)]);
    const r2 = new FieldRule('dup', [new ClosedInterval(5n, 7n)]);
    const r3 = new FieldRule('other', [new ClosedInterval(5n, 7n)]);
    expect(() => new TicketDocument([], new Ticket([1n]), [new Ticket([1n])])).toThrow();
    expect(() => new TicketDocument([r1, r2], new Ticket([1n, 5n]), [new Ticket([1n, 5n])])).toThrow();
    expect(() => new TicketDocument([r1, r3], new Ticket([1n, 5n]), [])).toThrow();
    expect(() => new TicketDocument([r1, r3], new Ticket([1n]), [new Ticket([1n, 5n])])).toThrow();
    expect(() => new TicketDocument([r1, r3], new Ticket([1n, 5n]), [new Ticket([1n])])).toThrow();
  });
});

describe('parseTicketDocument', () => {
  it('parses standard 3-section CRLF or LF documents including large bigint values', () => {
    const crlf = SAMPLE_DOC.replace(/\n/g, '\r\n');
    const doc = parseTicketDocument(crlf);
    expect(doc.fieldCount).toBe(3);
    expect(doc.yourTicket.values).toEqual([7n, 1n, 14n]);
    expect(doc.nearbyTickets).toHaveLength(4);
    expect(doc.nearbyTickets[2]?.values).toEqual([55n, 2n, 20n]);
  });

  it('rejects empty input and malformed section structure', () => {
    expect(() => parseTicketDocument('   ')).toThrow();
    expect(() => parseTicketDocument('a: 1-2\n\nyour ticket:\n1')).toThrow();
  });

  it('rejects malformed rules and range bounds', () => {
    expect(() => parseTicketDocument('badrule\n\nyour ticket:\n1\n\nnearby tickets:\n1')).toThrow();
    expect(() => parseTicketDocument('a: 1-2 or bad\n\nyour ticket:\n1\n\nnearby tickets:\n1')).toThrow();
    expect(() => parseTicketDocument('a: 5-2\n\nyour ticket:\n1\n\nnearby tickets:\n1')).toThrow(RangeError);
  });

  it('rejects malformed headers and non-numeric ticket cells', () => {
    expect(() => parseTicketDocument('a: 1-2\n\nmy ticket:\n1\n\nnearby tickets:\n1')).toThrow();
    expect(() => parseTicketDocument('a: 1-2\n\nyour ticket:\n1\n2\n\nnearby tickets:\n1')).toThrow();
    expect(() => parseTicketDocument('a: 1-2\n\nyour ticket:\n1\n\nother tickets:\n1')).toThrow();
    expect(() => parseTicketDocument('a: 1-2\n\nyour ticket:\n1\n\nnearby tickets:')).toThrow();
    expect(() => parseTicketDocument('a: 1-2\n\nyour ticket:\n1,x\n\nnearby tickets:\n1,2')).toThrow();
  });
});
