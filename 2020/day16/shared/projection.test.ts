import { describe, expect, it } from 'vitest';
import {
  DEPARTURE_PRODUCT_POLICY,
  ERROR_RATE_POLICY,
} from './policies';
import { normalizeBigInt, projectPeelingMatrix, projectSpectrum } from './projection';
import { TicketTranslationSolver } from './solver';

const SPECTRUM_DOC = [
  'a: 10-20 or 30-40',
  'b: 15-25',
  '',
  'your ticket:',
  '12,18',
  '',
  'nearby tickets:',
  '5,9007199254740999',
  '20,15',
].join('\n');

const PEELING_DOC = [
  'departure location: 0-1 or 4-19',
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

describe('normalizeBigInt', () => {
  it('handles zero span, valid scaling, large bigints, and negative span guard', () => {
    expect(normalizeBigInt(5n, 5n, 0n)).toBe(0.5);
    expect(normalizeBigInt(50n, 0n, 100n)).toBe(0.5);
    expect(normalizeBigInt(10n ** 24n, 0n, 2n * 10n ** 24n)).toBe(0.5);
    expect(() => normalizeBigInt(1n, 0n, -1n)).toThrow(RangeError);
  });
});

describe('projectSpectrum', () => {
  it('spans both valid bands and outlier ticket values inside [0, 1]', () => {
    const solver = new TicketTranslationSolver(ERROR_RATE_POLICY);
    const frames = solver.trace(solver.parse(SPECTRUM_DOC));
    const proj0 = projectSpectrum(frames[0]!);
    expect(proj0.minLabel).toBe('5');
    expect(proj0.maxLabel).toBe('9007199254740999');
    expect(proj0.bands).toHaveLength(2);
    expect(proj0.markers).toHaveLength(2);
    expect(proj0.markers[0]?.isInvalid).toBe(true);
    expect(proj0.markers[0]?.frac).toBe(0);
    expect(proj0.markers[1]?.isInvalid).toBe(true);
    expect(proj0.markers[1]?.frac).toBe(1);
    expect(Object.isFrozen(proj0)).toBe(true);

    const proj1 = projectSpectrum(frames[1]!);
    expect(proj1.minLabel).toBe('10');
    expect(proj1.maxLabel).toBe('40');
    expect(proj1.markers.every((m) => !m.isInvalid)).toBe(true);
    expect(proj1.bands[0]?.startFrac).toBe(0);
    expect(proj1.bands[1]?.endFrac).toBe(1);
  });

  it('handles degenerate single-point domain (span 0n)', () => {
    const solver = new TicketTranslationSolver(ERROR_RATE_POLICY);
    const frames = solver.trace(solver.parse('only: 7-7\n\nyour ticket:\n7\n\nnearby tickets:\n7'));
    const proj = projectSpectrum(frames[0]!);
    expect(proj.bands[0]?.startFrac).toBe(0.5);
    expect(proj.markers[0]?.frac).toBe(0.5);
  });
});

describe('projectPeelingMatrix', () => {
  it('distinguishes active-lock, locked, candidate, and eliminated cells across rounds', () => {
    const solver = new TicketTranslationSolver(DEPARTURE_PRODUCT_POLICY);
    const frames = solver.trace(solver.parse(PEELING_DOC));

    // Round 1: seat locks column 2 (active-lock); departure location & row still candidates
    const round1 = projectPeelingMatrix(frames[1]!);
    expect(round1.fieldCount).toBe(3);
    expect(round1.rows[0]?.isDeparture).toBe(true);
    expect(round1.rows[0]?.lockedColumn).toBeNull();
    expect(round1.rows[0]?.degree).toBe(1);
    expect(round1.rows[0]?.cells).toEqual(['eliminated', 'candidate', 'eliminated']);
    expect(round1.rows[2]?.lockedColumn).toBe(2);
    expect(round1.rows[2]?.cells).toEqual(['eliminated', 'eliminated', 'active-lock']);

    // Round 2: seat is prior 'locked', departure location is 'active-lock' on col 1
    const round2 = projectPeelingMatrix(frames[2]!);
    expect(round2.rows[0]?.cells).toEqual(['eliminated', 'active-lock', 'eliminated']);
    expect(round2.rows[2]?.cells).toEqual(['eliminated', 'eliminated', 'locked']);
    expect(Object.isFrozen(round2)).toBe(true);
    expect(Object.isFrozen(round2.rows[0])).toBe(true);
  });
});
