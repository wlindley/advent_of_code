import { describe, expect, it } from 'vitest';
import { parseJetPattern } from './jetPattern';
import { DEFAULT_TRACE_MAX_STEPS, simulateTower, TRACE_WINDOW_ROWS, traceTower } from './simulate';

const EXAMPLE_INPUT = '>>><<><>><<<>><>>><<<>>><<<><<<>><>><<>>';

describe('simulateTower', () => {
  it('returns height 0 for 0 rocks and rejects negative rock counts', () => {
    const jets = parseJetPattern(EXAMPLE_INPUT);
    expect(simulateTower(jets, 0n)).toEqual({
      targetRocks: 0n,
      towerHeight: 0n,
      simulatedDrops: 0,
      cycle: null,
    });
    expect(() => simulateTower(jets, -1n)).toThrow(RangeError);
  });

  it('solves the official example for 2,022 rocks and 1,000,000,000,000 rocks', () => {
    const jets = parseJetPattern(EXAMPLE_INPUT);
    const part1 = simulateTower(jets, 2022n);
    expect(part1.towerHeight).toBe(3068n);
    expect(part1.cycle).not.toBeNull();
    expect(part1.simulatedDrops).toBeLessThan(200);

    const part2 = simulateTower(jets, 1_000_000_000_000n);
    expect(part2.towerHeight).toBe(1_514_285_714_288n);
  });

  it('handles zero-remainder, positive-remainder, and zero-skip cycle boundaries', () => {
    const jets = parseJetPattern(EXAMPLE_INPUT);
    const baseline = simulateTower(jets, 2022n);
    expect(baseline.cycle).not.toBeNull();
    const cycle = baseline.cycle!;

    const firstRepeatRock = cycle.cycleStartRock + cycle.cycleLength;
    const atRepeat = simulateTower(jets, firstRepeatRock);
    expect(atRepeat.cycle?.skippedCycles).toBe(0n);

    const exactCycleEnd = simulateTower(jets, firstRepeatRock + cycle.cycleLength * 3n);
    expect(exactCycleEnd.cycle?.skippedCycles).toBe(3n);
    expect(exactCycleEnd.towerHeight).toBe(atRepeat.towerHeight + cycle.cycleHeightGain * 3n);

    const withRemainder = simulateTower(jets, firstRepeatRock + cycle.cycleLength * 2n + 3n);
    expect(withRemainder.cycle?.skippedCycles).toBe(2n);
    expect(withRemainder.towerHeight).toBe(
      simulateTower(jets, firstRepeatRock + 3n).towerHeight + cycle.cycleHeightGain * 2n,
    );
  });
});

describe('traceTower', () => {
  it('emits an initial empty-chamber frame for 0 rocks and rejects invalid maxSteps', () => {
    const jets = parseJetPattern(EXAMPLE_INPUT);
    const zeroFrames = traceTower(jets, 0n);
    expect(zeroFrames).toHaveLength(1);
    expect(zeroFrames[0]!.rockNumber).toBe(0n);
    expect(zeroFrames[0]!.towerHeight).toBe(0n);
    expect(zeroFrames[0]!.lastRock).toBeNull();
    expect(zeroFrames[0]!.window.windowRows).toEqual([0x7f]);

    expect(() => traceTower(jets, 10n, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceTower(jets, 10n, { maxSteps: 1.5 })).toThrow(RangeError);
  });

  it('caps sampled frames at maxSteps while preserving initial and final simulation state', () => {
    const jets = parseJetPattern(EXAMPLE_INPUT);
    const defaultFrames = traceTower(jets, 2022n);
    expect(defaultFrames.length).toBeLessThanOrEqual(DEFAULT_TRACE_MAX_STEPS);
    expect(defaultFrames[0]!.rockNumber).toBe(0n);
    expect(defaultFrames[defaultFrames.length - 1]!.towerHeight).toBe(3068n);
    expect(defaultFrames[defaultFrames.length - 1]!.rockNumber).toBe(2022n);

    const capped = traceTower(jets, 2022n, { maxSteps: 12 });
    expect(capped).toHaveLength(12);
    expect(capped[capped.length - 1]!.towerHeight).toBe(3068n);
    expect(capped[capped.length - 1]!.window.windowRows.length).toBeLessThanOrEqual(TRACE_WINDOW_ROWS);
  });
});
