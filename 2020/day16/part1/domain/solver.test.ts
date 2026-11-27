import { describe, expect, it } from 'vitest';
import { scanNearbyTickets, type TicketDocument } from '../../shared';
import { solver } from './solver';

const OFFICIAL_EXAMPLE = [
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

function bruteForceErrorRate(doc: TicketDocument): bigint {
  let sum = 0n;
  for (const ticket of doc.nearbyTickets) {
    for (const val of ticket.values) {
      const fitsAny = doc.rules.some((rule) =>
        rule.ranges.some((range) => val >= range.start && val <= range.end),
      );
      if (!fitsAny) sum += val;
    }
  }
  return sum;
}

function nextPrng(state: number): number {
  return (Math.imul(state, 1664525) + 1013904223) >>> 0;
}

function generateSeededDocument(seed: number): string {
  let s = seed >>> 0;
  const fields = 4;
  const rules: string[] = [];
  for (let r = 0; r < fields; r += 1) {
    s = nextPrng(s);
    const a = 1 + (s % 15);
    const b = a + 3 + ((s >>> 8) % 6);
    s = nextPrng(s);
    const c = b + 2 + (s % 10);
    const d = c + 4 + ((s >>> 8) % 6);
    rules.push(`field${r}: ${a}-${b} or ${c}-${d}`);
  }
  const makeTicket = () => {
    const cells: number[] = [];
    for (let i = 0; i < fields; i += 1) {
      s = nextPrng(s);
      cells.push(s % 60);
    }
    return cells.join(',');
  };
  const nearby = Array.from({ length: 8 }, makeTicket);
  return [...rules, '', 'your ticket:', makeTicket(), '', 'nearby tickets:', ...nearby].join('\n');
}

describe('2020 Day 16 Part 1 solver', () => {
  it('solves the official Part 1 example to 71n', () => {
    const doc = solver.parse(OFFICIAL_EXAMPLE);
    expect(solver.solve(doc)).toBe(71n);
    const trace = solver.trace(doc);
    expect(trace.at(-1)?.runningErrorRate).toBe(71n);
    expect(solver.trace(doc, { maxSteps: 2 })).toHaveLength(2);
  });

  it('catches the invalid-0n trap, multiple invalid values, and ignores yourTicket', () => {
    const input = [
      'a: 5-10',
      'b: 20-30',
      '',
      'your ticket:',
      '999,999',
      '',
      'nearby tickets:',
      '0,5',
      '1,15',
      '6,25',
    ].join('\n');
    const doc = solver.parse(input);
    const scans = scanNearbyTickets(doc);
    expect(scans[0]?.isValid).toBe(false);
    expect(scans[0]?.invalidSum).toBe(0n);
    expect(scans[1]?.invalidCount).toBe(2);
    expect(solver.solve(doc)).toBe(16n);
  });

  it('matches a brute-force oracle across 20 seeded random cases', () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      const doc = solver.parse(generateSeededDocument(seed * 97 + 13));
      expect(solver.solve(doc)).toBe(bruteForceErrorRate(doc));
    }
  });
});
