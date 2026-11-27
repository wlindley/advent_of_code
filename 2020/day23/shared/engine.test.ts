import { describe, expect, it } from 'vitest';
import { simulateCrabCups, simulateCrabCupsTrace } from './engine';
import { parseCupLabels } from './model';
import { STANDARD_CUPS_POLICY, type CrabCupsPolicy } from './policies';
import type { CupRing } from './ring';

const TWENTY_FIVE_CUP_POLICY: CrabCupsPolicy<bigint> = Object.freeze({
  id: 'million-cups',
  label: 'Test 25 Cups',
  moves: 10,
  resolveCupCount: () => 25,
  extractAnswer: (ring: CupRing) => ring.productAfterOne(),
});

describe('2020 Day 23 engine', () => {
  it('simulates standard Crab Cups to final answer', () => {
    const spec = parseCupLabels('389125467');
    expect(simulateCrabCups(spec, STANDARD_CUPS_POLICY)).toBe('67384529');
  });

  it('produces full, sampled, and single-step (maxSteps=1) traces', () => {
    const spec = parseCupLabels('389125467');
    const full = simulateCrabCupsTrace(spec, STANDARD_CUPS_POLICY, 120);
    expect(full.length).toBe(101);
    expect(full[0]!.move).toBe(0);
    expect(full[0]!.lastMove).toBeNull();
    expect(full[100]!.move).toBe(100);
    expect(full[100]!.labelsAfterOne).toBe('67384529');

    const sampled = simulateCrabCupsTrace(spec, STANDARD_CUPS_POLICY, 11);
    expect(sampled.length).toBe(11);
    expect(sampled[0]!.move).toBe(0);
    expect(sampled[10]!.move).toBe(100);

    const single = simulateCrabCupsTrace(spec, STANDARD_CUPS_POLICY, 1);
    expect(single.length).toBe(1);
    expect(single[0]!.move).toBe(100);
    expect(single[0]!.lastMove).not.toBeNull();
    expect(single[0]!.isFinal).toBe(true);
  });

  it('traces large rings in ribbon-window mode and rejects invalid maxSteps', () => {
    const spec = parseCupLabels('389125467');
    const frames = simulateCrabCupsTrace(spec, TWENTY_FIVE_CUP_POLICY, 5);
    expect(frames.length).toBe(5);
    expect(frames[0]!.isFullRing).toBe(false);
    expect(frames[4]!.productAfterOne).toBe(simulateCrabCups(spec, TWENTY_FIVE_CUP_POLICY));
    expect(() => simulateCrabCupsTrace(spec, STANDARD_CUPS_POLICY, 0)).toThrow(RangeError);
  });
});
