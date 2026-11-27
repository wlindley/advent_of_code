import { describe, expect, it } from 'vitest';
import { parseCupLabels } from './model';
import {
  MILLION_CUP_COUNT,
  MILLION_CUPS_POLICY,
  MILLION_MOVES,
  STANDARD_CUPS_POLICY,
  STANDARD_MOVES,
} from './policies';
import { CupRing } from './ring';

describe('2020 Day 23 policies', () => {
  it('configures STANDARD_CUPS_POLICY for 100 moves and labelsAfterOne', () => {
    const spec = parseCupLabels('389125467');
    expect(STANDARD_CUPS_POLICY.id).toBe('standard-cups');
    expect(STANDARD_CUPS_POLICY.moves).toBe(STANDARD_MOVES);
    expect(STANDARD_CUPS_POLICY.resolveCupCount(spec)).toBe(9);
    const ring = new CupRing(spec, 9);
    ring.advance(100);
    expect(STANDARD_CUPS_POLICY.extractAnswer(ring)).toBe('67384529');
  });

  it('configures MILLION_CUPS_POLICY for 1M cups, 10M moves, and productAfterOne', () => {
    const spec = parseCupLabels('389125467');
    expect(MILLION_CUPS_POLICY.id).toBe('million-cups');
    expect(MILLION_CUPS_POLICY.moves).toBe(MILLION_MOVES);
    expect(MILLION_CUPS_POLICY.resolveCupCount(spec)).toBe(MILLION_CUP_COUNT);
    const smallRing = new CupRing(spec, 9);
    expect(MILLION_CUPS_POLICY.extractAnswer(smallRing)).toBe(10n);
  });
});
