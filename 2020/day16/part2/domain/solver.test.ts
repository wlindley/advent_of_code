import { describe, expect, it } from 'vitest';
import type { FieldRule, Ticket, TicketDocument } from '../../shared';
import { solver } from './solver';

const OFFICIAL_EXAMPLE = [
  'class: 0-1 or 4-19\nrow: 0-5 or 8-19\nseat: 0-13 or 16-19',
  'your ticket:\n11,12,13',
  'nearby tickets:\n3,9,18\n15,1,5\n5,14,9',
].join('\n\n');

const DEPARTURE_EXAMPLE = OFFICIAL_EXAMPLE.replace('class:', 'departure class:').replace('row:', 'departure row:');

function valueMatchesRawRule(value: bigint, rule: FieldRule): boolean {
  for (const r of rule.ranges) if (value >= r.start && value <= r.end) return true;
  return false;
}

function filterValidTicketsRaw(doc: TicketDocument): readonly Ticket[] {
  const valid: Ticket[] = [doc.yourTicket];
  for (const ticket of doc.nearbyTickets) {
    let ok = true;
    for (const val of ticket.values) {
      if (!doc.rules.some((rule) => valueMatchesRawRule(val, rule))) { ok = false; break; }
    }
    if (ok) valid.push(ticket);
  }
  return valid;
}

function buildRawCompatMatrix(rules: readonly FieldRule[], tickets: readonly Ticket[]): boolean[][] {
  return rules.map((rule) =>
    Array.from({ length: rules.length }, (_, col) => tickets.every((t) => valueMatchesRawRule(t.values[col]!, rule))),
  );
}

function pickMrvRule(
  compat: readonly (readonly boolean[])[],
  usedRules: readonly boolean[],
  usedCols: readonly boolean[],
): { ruleIdx: number; cols: number[] } {
  let bestRule = -1;
  let bestCols: number[] = [];
  for (let r = 0; r < compat.length; r += 1) {
    if (usedRules[r]) continue;
    const cols: number[] = [];
    for (let c = 0; c < compat[r]!.length; c += 1) if (!usedCols[c] && compat[r]![c]) cols.push(c);
    if (bestRule === -1 || cols.length < bestCols.length) { bestRule = r; bestCols = cols; }
  }
  return { ruleIdx: bestRule, cols: bestCols };
}

function backtrackMatch(
  compat: readonly (readonly boolean[])[],
  usedRules: boolean[],
  usedCols: boolean[],
  current: number[],
  solutions: number[][],
): void {
  if (solutions.length >= 2) return;
  const pick = pickMrvRule(compat, usedRules, usedCols);
  if (pick.ruleIdx === -1) { solutions.push([...current]); return; }
  usedRules[pick.ruleIdx] = true;
  for (const col of pick.cols) {
    usedCols[col] = true;
    current[pick.ruleIdx] = col;
    backtrackMatch(compat, usedRules, usedCols, current, solutions);
    usedCols[col] = false;
    if (solutions.length >= 2) break;
  }
  usedRules[pick.ruleIdx] = false;
}

function oracleDepartureProduct(doc: TicketDocument): bigint {
  const compat = buildRawCompatMatrix(doc.rules, filterValidTicketsRaw(doc));
  const n = doc.rules.length;
  const solutions: number[][] = [];
  backtrackMatch(compat, Array<boolean>(n).fill(false), Array<boolean>(n).fill(false), Array<number>(n).fill(-1), solutions);
  expect(solutions).toHaveLength(1);
  let product = 1n;
  for (let r = 0; r < n; r += 1) {
    if (doc.rules[r]!.name.startsWith('departure')) product *= doc.yourTicket.values[solutions[0]![r]!]!;
  }
  return product;
}

function nextPrng(state: number): number { return (Math.imul(state, 1664525) + 1013904223) >>> 0; }

function shuffleIndices(count: number, seed: number): { order: number[]; nextSeed: number } {
  const order = Array.from({ length: count }, (_, idx) => idx);
  let s = seed >>> 0;
  for (let i = count - 1; i > 0; i -= 1) {
    s = nextPrng(s);
    const j = s % (i + 1);
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  return { order, nextSeed: s };
}

function buildUpperTriangularRules(fieldCount: number, departureCount: number, gapValues: readonly bigint[]): string[] {
  const maxVal = gapValues[fieldCount - 1]! + 9n;
  return gapValues.map((g, r) => `${r < departureCount ? `departure f${r}` : `field f${r}`}: 1-${g - 1n} or ${g + 1n}-${maxVal}`);
}

function buildTriangularTicketLine(
  perm: readonly number[], rowIdx: number, gapValues: readonly bigint[], seed: number,
): { line: string; nextSeed: number } {
  const cells = new Array<bigint>(perm.length);
  let s = seed >>> 0;
  for (let c = 0; c < perm.length; c += 1) {
    s = nextPrng(s);
    cells[perm[c]!] = rowIdx > c ? gapValues[rowIdx]! : BigInt(1 + (s % 8));
  }
  return { line: cells.join(','), nextSeed: s };
}

function generateSeededPuzzle(seed: number, fieldCount: number, departureCount: number): string {
  const gaps = Array.from({ length: fieldCount }, (_, i) => BigInt((i + 1) * 10));
  const { order, nextSeed } = shuffleIndices(fieldCount, seed);
  const rules = buildUpperTriangularRules(fieldCount, departureCount, gaps);
  const yourRow = buildTriangularTicketLine(order, -1, gaps, nextSeed);
  let s = yourRow.nextSeed;
  const nearby: string[] = [];
  for (let row = 0; row < fieldCount; row += 1) {
    const built = buildTriangularTicketLine(order, row, gaps, s);
    s = built.nextSeed;
    nearby.push(built.line);
  }
  const zeroTrap = Array<number>(fieldCount).fill(1).map((v, i) => (i === s % fieldCount ? 0 : v));
  const highTrap = Array<number>(fieldCount).fill(2).map((v, i) => (i === (s >>> 4) % fieldCount ? 999 : v));
  return [...rules, '', 'your ticket:', yourRow.line, '', 'nearby tickets:', ...nearby, zeroTrap.join(','), highTrap.join(',')].join('\n');
}

describe('2020 Day 16 Part 2 solver', () => {
  it('solves the official Part 2 example and locks row=0, class=1, seat=2 in trace', () => {
    const doc = solver.parse(OFFICIAL_EXAMPLE);
    expect(solver.solve(doc)).toBe(1n);
    const trace = solver.trace(doc);
    expect(trace).toHaveLength(4);
    const finalFrame = trace.at(-1)!;
    expect(finalFrame.isFinal).toBe(true);
    const colByName = new Map([...finalFrame.priorAssignments, ...finalFrame.activeLocks].map((a) => [a.ruleName, a.column]));
    expect([colByName.get('row'), colByName.get('class'), colByName.get('seat')]).toEqual([0, 1, 2]);
    expect(finalFrame.yourTicket.values).toEqual([11n, 12n, 13n]);
  });

  it('computes departure product 132n on departure-prefixed example and bounds trace steps', () => {
    const doc = solver.parse(DEPARTURE_EXAMPLE);
    expect(solver.solve(doc)).toBe(132n);
    const fullTrace = solver.trace(doc);
    expect(fullTrace.map((f) => f.departureProduct)).toEqual([1n, 1n, 12n, 132n]);
    expect(fullTrace[3]?.lockedDepartureCount).toBe(2);
    const sampled = solver.trace(doc, { maxSteps: 2 });
    expect(sampled).toHaveLength(2);
    expect(sampled[1]?.departureProduct).toBe(132n);
  });

  it('rejects invalid-0n tickets instead of allowing them to corrupt column matching', () => {
    const doc = solver.parse('departure a: 1-5\ndeparture b: 6-10\n\nyour ticket:\n3,8\n\nnearby tickets:\n0,2\n4,7');
    expect(solver.solve(doc)).toBe(oracleDepartureProduct(doc));
    expect(solver.solve(doc)).toBe(24n);
    expect(solver.trace(doc).at(-1)?.discardedNearbyCount).toBe(1);
  });

  it('preserves exact BigInt precision above 2^53 and 2^63 across 6 departure fields', () => {
    const primes = [100003n, 100019n, 100043n, 100049n, 100057n, 100069n];
    const rules = primes.map((_, r) => `departure p${r}: 1-${(r + 1) * 10 - 1} or ${(r + 1) * 10 + 1}-100100`);
    const nearby = primes.map((_, row) => primes.map((__, c) => (row > c ? (row + 1) * 10 : 1)).join(','));
    const doc = solver.parse([...rules, '', 'your ticket:', primes.join(','), '', 'nearby tickets:', ...nearby].join('\n'));
    const answer = solver.solve(doc);
    expect(answer).toBe(1002402249527878950317213149367n);
    expect(answer & 1n).toBe(1n);
    expect(answer).toBe(oracleDepartureProduct(doc));
  });

  it('matches brute-force MRV oracle across 20 seeded upper-triangular puzzles', () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      const doc = solver.parse(generateSeededPuzzle(seed * 131 + 17, 5 + (seed % 4), 2 + (seed % 3)));
      expect(solver.solve(doc)).toBe(oracleDepartureProduct(doc));
    }
  });

  it('rejects empty input, ambiguous compatibility masks, and non-positive maxSteps', () => {
    expect(() => solver.parse('')).toThrow();
    const ambig = solver.parse('departure a: 1-10\ndeparture b: 1-10\n\nyour ticket:\n2,3\n\nnearby tickets:\n4,5');
    expect(() => solver.solve(ambig)).toThrow();
    expect(() => solver.trace(solver.parse(DEPARTURE_EXAMPLE), { maxSteps: 0 })).toThrow();
  });
});
