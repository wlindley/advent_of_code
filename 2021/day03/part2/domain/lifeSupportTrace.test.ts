import { describe, expect, it } from 'vitest';
import { BitTally, DiagnosticReport, parseDiagnosticReport } from '../../shared';
import { RatingSelection } from './ratingFilter';
import {
  DEFAULT_MAX_TRACE_STEPS,
  LaneStepSnapshot,
  MAX_SAMPLE_ROWS,
  traceLifeSupport,
} from './lifeSupportTrace';

const AOC_EXAMPLE = [
  '00100',
  '11110',
  '10110',
  '10111',
  '10101',
  '01111',
  '00111',
  '11100',
  '10000',
  '11001',
  '00010',
  '01010',
].join('\n');

function createSnapshot(
  tally: BitTally | null,
  selectedBit: '0' | '1' | null,
  candidateCount: number,
): LaneStepSnapshot {
  return new LaneStepSnapshot(tally, selectedBit, candidateCount, ['101'], null);
}

describe('LaneStepSnapshot', () => {
  it('computes status and eliminatedCount dynamically and is frozen', () => {
    const active = new LaneStepSnapshot(new BitTally(7, 5), '1', 7, ['11110', '10110'], null);
    expect(active.status).toBe('active');
    expect(active.eliminatedCount).toBe(5);
    expect(Object.isFrozen(active)).toBe(true);

    const locked = new LaneStepSnapshot(
      null,
      null,
      1,
      ['01010'],
      new RatingSelection('01010', 11, 3),
    );
    expect(locked.status).toBe('locked');
    expect(locked.eliminatedCount).toBe(0);
  });

  it('validates tally/selectedBit consistency and positive integer candidateCount', () => {
    expect(() => createSnapshot(new BitTally(1, 1), null, 1)).toThrow(RangeError);
    expect(() => createSnapshot(null, '1', 1)).toThrow(RangeError);
    expect(() => createSnapshot(null, null, 0)).toThrow(RangeError);
    expect(() => createSnapshot(null, null, 1.5)).toThrow(RangeError);
  });
});

describe('traceLifeSupport', () => {
  it('traces AoC example where CO2 locks before O2 and caps sampleRows', () => {
    const report = parseDiagnosticReport(AOC_EXAMPLE);
    const frames = traceLifeSupport(report);
    expect(frames).toHaveLength(6);
    expect(frames[0]!.column).toBeNull();
    expect(frames[0]!.oxygen.sampleRows).toHaveLength(MAX_SAMPLE_ROWS);
    expect(frames[0]!.oxygen.eliminatedCount).toBe(0);

    // Step 3 (column 2): CO2 locks at round 3 while O2 remains active with 3 candidates
    expect(frames[3]!.column).toBe(2);
    expect(frames[3]!.co2.status).toBe('locked');
    expect(frames[3]!.co2.lockedSelection?.rating).toBe(10n);
    expect(frames[3]!.co2.lockedSelection?.roundsApplied).toBe(3);
    expect(frames[3]!.oxygen.status).toBe('active');
    expect(frames[3]!.oxygen.candidateCount).toBe(3);

    // Step 5 (column 4): CO2 preserves original lock; O2 locks at round 5
    expect(frames[5]!.co2.tally).toBeNull();
    expect(frames[5]!.co2.eliminatedCount).toBe(0);
    expect(frames[5]!.co2.lockedSelection?.roundsApplied).toBe(3);
    expect(frames[5]!.oxygen.status).toBe('locked');
    expect(frames[5]!.oxygen.lockedSelection?.rating).toBe(23n);
    expect(frames[5]!.oxygen.lockedSelection?.roundsApplied).toBe(5);
  });

  it('traces reports where O2 locks before CO2 and preserves O2 lock on later frames', () => {
    const report = new DiagnosticReport(['110', '100', '000', '001']);
    const frames = traceLifeSupport(report);
    expect(frames).toHaveLength(4);
    expect(frames[2]!.oxygen.status).toBe('locked');
    expect(frames[2]!.oxygen.lockedSelection?.bits).toBe('110');
    expect(frames[2]!.oxygen.lockedSelection?.roundsApplied).toBe(2);
    expect(frames[2]!.co2.status).toBe('active');
    expect(frames[2]!.co2.candidateCount).toBe(2);

    expect(frames[3]!.oxygen.tally).toBeNull();
    expect(frames[3]!.oxygen.lockedSelection?.roundsApplied).toBe(2);
    expect(frames[3]!.co2.status).toBe('locked');
    expect(frames[3]!.co2.lockedSelection?.bits).toBe('000');
    expect(frames[3]!.co2.lockedSelection?.roundsApplied).toBe(3);
  });

  it('stops early when both lanes lock before the final column', () => {
    const report = new DiagnosticReport(['100', '000']);
    const frames = traceLifeSupport(report);
    expect(frames).toHaveLength(2);
    expect(frames[1]!.oxygen.lockedSelection?.bits).toBe('100');
    expect(frames[1]!.co2.lockedSelection?.bits).toBe('000');
  });

  it('locks on frame 0 with 0 rounds for a single-row report', () => {
    const report = new DiagnosticReport(['101']);
    const frames = traceLifeSupport(report);
    expect(frames).toHaveLength(1);
    expect(frames[0]!.column).toBeNull();
    expect(frames[0]!.oxygen.status).toBe('locked');
    expect(frames[0]!.oxygen.lockedSelection?.roundsApplied).toBe(0);
    expect(frames[0]!.co2.lockedSelection?.roundsApplied).toBe(0);
  });

  it('locks at the final column when duplicate rows remain tied', () => {
    const report = new DiagnosticReport(['10', '10']);
    const frames = traceLifeSupport(report);
    expect(frames).toHaveLength(3);
    expect(frames[2]!.oxygen.lockedSelection?.roundsApplied).toBe(2);
    expect(frames[2]!.co2.lockedSelection?.roundsApplied).toBe(2);
  });

  it('handles omitted options, empty options, maxSteps sampling, and invalid maxSteps', () => {
    const report = parseDiagnosticReport(AOC_EXAMPLE);
    expect(DEFAULT_MAX_TRACE_STEPS).toBeGreaterThan(10);
    expect(traceLifeSupport(report, {})).toHaveLength(6);

    const single = traceLifeSupport(report, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]!.step).toBe(5);

    const sampled = traceLifeSupport(report, { maxSteps: 3 });
    expect(sampled).toHaveLength(3);
    expect(sampled[0]!.step).toBe(0);
    expect(sampled[2]!.step).toBe(5);

    expect(() => traceLifeSupport(report, { maxSteps: 0 })).toThrow(RangeError);
  });
});
