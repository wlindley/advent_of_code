import { describe, expect, it } from 'vitest';
import { XmasStream } from './stream';
import {
  DEFAULT_MAX_TRACE_STEPS,
  PreambleScanFrame,
  tracePreambleScan,
  traceWeaknessAttack,
  WeaknessScanFrame,
} from './trace';
import { WeaknessWindowStep } from './weakness';
import { WindowCheckStep } from './window';

const OFFICIAL_W5 = new XmasStream([
  35n, 20n, 15n, 25n, 47n, 40n, 62n, 55n, 65n, 95n,
  102n, 117n, 150n, 182n, 127n, 219n, 299n, 277n, 309n, 576n,
]);

describe('trace frame value objects', () => {
  it('freezes PreambleScanFrame and exposes derived getters', () => {
    const validCheck = new WindowCheckStep(5, 0, null);
    const frame = new PreambleScanFrame(1, 3, validCheck);
    expect(Object.isFrozen(frame)).toBe(true);
    expect(frame.phase).toBe('preamble');
    expect(frame.isInvalid).toBe(true);
    expect(frame.windowLength).toBe(5);
    expect(() => new PreambleScanFrame(0, 3, validCheck)).toThrow(RangeError);
    expect(() => new PreambleScanFrame(4, 3, validCheck)).toThrow(RangeError);
    expect(() => new PreambleScanFrame(1.5, 3, validCheck)).toThrow(RangeError);
  });

  it('freezes WeaknessScanFrame and exposes isFound', () => {
    const probe = new WeaknessWindowStep(0, 2, 10n);
    const searching = new WeaknessScanFrame(1, 3, 5, probe, null);
    expect(Object.isFrozen(searching)).toBe(true);
    expect(searching.phase).toBe('weakness');
    expect(searching.isFound).toBe(false);
    expect(() => new WeaknessScanFrame(1, 3, -1, probe, null)).toThrow(RangeError);
  });
});

describe('tracePreambleScan and traceWeaknessAttack', () => {
  it('traces full preamble scan up to first invalid number and supports downsampling', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(240);
    const full = tracePreambleScan(OFFICIAL_W5, 5, DEFAULT_MAX_TRACE_STEPS);
    expect(full).toHaveLength(10);
    expect(full[0]!.step).toBe(1);
    expect(full[0]!.isInvalid).toBe(false);
    expect(full[9]!.step).toBe(10);
    expect(full[9]!.isInvalid).toBe(true);
    expect(full[9]!.check.targetIndex).toBe(14);

    const sampled = tracePreambleScan(OFFICIAL_W5, 5, 4);
    expect(sampled).toHaveLength(4);
    expect(sampled[0]!.step).toBe(1);
    expect(sampled[3]!.isInvalid).toBe(true);

    const single = tracePreambleScan(OFFICIAL_W5, 5, 1);
    expect(single).toHaveLength(1);
    expect(single[0]!.isInvalid).toBe(true);
  });

  it('traces two-phase weakness attack including downsampling and maxSteps=1', () => {
    const full = traceWeaknessAttack(OFFICIAL_W5, 5, DEFAULT_MAX_TRACE_STEPS);
    expect(full).toHaveLength(16);
    const preambleFrames = full.filter((f) => f.phase === 'preamble');
    const weaknessFrames = full.filter((f) => f.phase === 'weakness');
    expect(preambleFrames).toHaveLength(10);
    expect(weaknessFrames).toHaveLength(6);
    expect(weaknessFrames[0]!.isFound).toBe(false);
    const last = weaknessFrames[5]!;
    expect(last.isFound).toBe(true);
    expect(last.weakness?.encryptionWeakness(OFFICIAL_W5)).toBe(62n);

    const budgeted = traceWeaknessAttack(OFFICIAL_W5, 5, 6);
    expect(budgeted).toHaveLength(6);
    expect(budgeted[0]!.phase).toBe('preamble');
    const lastBudgeted = budgeted[5]!;
    expect(lastBudgeted.phase).toBe('weakness');
    if (lastBudgeted.phase === 'weakness') {
      expect(lastBudgeted.isFound).toBe(true);
    }

    const single = traceWeaknessAttack(OFFICIAL_W5, 5, 1);
    expect(single).toHaveLength(1);
    expect(single[0]!.phase).toBe('weakness');
    if (single[0]!.phase === 'weakness') {
      expect(single[0]!.isFound).toBe(true);
      expect(single[0]!.weakness?.encryptionWeakness(OFFICIAL_W5)).toBe(62n);
    }
  });

  it('rejects invalid maxSteps, all-valid streams, and streams without weakness match', () => {
    expect(() => tracePreambleScan(OFFICIAL_W5, 5, 0)).toThrow(RangeError);
    expect(() => traceWeaknessAttack(new XmasStream([1n, 2n, 3n, 5n]), 2, 10)).toThrow('No invalid number found');
    expect(() => traceWeaknessAttack(new XmasStream([1n, 2n, 100n]), 2, 10)).toThrow('No contiguous range');
    expect(() => traceWeaknessAttack(new XmasStream([1n, 2n, 50n, 3n]), 2, 10)).toThrow('No contiguous range');
  });
});
