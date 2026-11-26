import { describe, expect, it } from 'vitest';
import {
  AMPLIFIER_LABELS,
  AmplifierSearchResult,
  CircuitRunResult,
  DEFAULT_MAX_STEPS_PER_AMP,
  DEFAULT_MAX_TRACE_FRAMES,
  INITIAL_THRUSTER_INPUT,
  LEADERBOARD_SIZE,
  StageTelemetry,
} from './circuitModels';

function makeStages(finalOutputs: readonly bigint[], steps = 4): readonly StageTelemetry[] {
  return AMPLIFIER_LABELS.map(
    (label, index) =>
      new StageTelemetry(
        label,
        BigInt(index),
        [BigInt(index * 10)],
        index === 4 ? finalOutputs : [BigInt(index + 1)],
        steps + index,
        'halted',
      ),
  );
}

describe('circuitModels', () => {
  it('exposes frozen circuit constants', () => {
    expect(AMPLIFIER_LABELS).toEqual(['A', 'B', 'C', 'D', 'E']);
    expect(Object.isFrozen(AMPLIFIER_LABELS)).toBe(true);
    expect(INITIAL_THRUSTER_INPUT).toBe(0n);
    expect(DEFAULT_MAX_STEPS_PER_AMP).toBe(100_000);
    expect(DEFAULT_MAX_TRACE_FRAMES).toBe(120);
    expect(LEADERBOARD_SIZE).toBe(5);
  });

  it('constructs frozen StageTelemetry and derives lastEmittedSignal', () => {
    const empty = new StageTelemetry('A', 0n, [], [], 0, 'waiting-input');
    expect(empty.lastEmittedSignal).toBeNull();
    expect(Object.isFrozen(empty)).toBe(true);
    expect(Object.isFrozen(empty.receivedSignals)).toBe(true);
    expect(Object.isFrozen(empty.emittedSignals)).toBe(true);

    const populated = new StageTelemetry('B', 1n, [0n], [5n, -12n], 7, 'halted');
    expect(populated.lastEmittedSignal).toBe(-12n);
  });

  it('rejects invalid StageTelemetry stepCount', () => {
    expect(() => new StageTelemetry('A', 0n, [], [], -1, 'halted')).toThrow(RangeError);
    expect(() => new StageTelemetry('A', 0n, [], [], 1.5, 'halted')).toThrow(RangeError);
  });

  it('validates CircuitRunResult invariants and computes derived getters', () => {
    const phases = [0n, 1n, 2n, 3n, 4n];
    const run = new CircuitRunResult(phases, makeStages([10n, 43210n]), 2);
    expect(run.thrusterSignal).toBe(43210n);
    expect(run.totalSteps).toBe(4 + 5 + 6 + 7 + 8);
    expect(Object.isFrozen(run)).toBe(true);
    expect(Object.isFrozen(run.phases)).toBe(true);
    expect(Object.isFrozen(run.stages)).toBe(true);

    expect(() => new CircuitRunResult([0n], makeStages([1n]), 1)).toThrow(RangeError);
    expect(() => new CircuitRunResult(phases, makeStages([1n]).slice(0, 4), 1)).toThrow(RangeError);
    expect(() => new CircuitRunResult(phases, makeStages([]), 1)).toThrow(Error);
    expect(() => new CircuitRunResult(phases, makeStages([1n]), 0)).toThrow(RangeError);
  });

  it('computes bestRun with negative signals and earliest tie-breaking, and slices topRuns', () => {
    expect(() => new AmplifierSearchResult([])).toThrow(RangeError);

    const r0 = new CircuitRunResult([0n, 1n, 2n, 3n, 4n], makeStages([-50n]), 1);
    const r1 = new CircuitRunResult([1n, 0n, 2n, 3n, 4n], makeStages([-10n]), 1);
    const r2 = new CircuitRunResult([2n, 0n, 1n, 3n, 4n], makeStages([-10n]), 1);
    const r3 = new CircuitRunResult([3n, 0n, 1n, 2n, 4n], makeStages([-30n]), 1);
    const result = new AmplifierSearchResult([r0, r1, r2, r3]);

    expect(result.bestRun).toBe(r1);
    expect(() => result.topRuns(0)).toThrow(RangeError);
    expect(() => result.topRuns(1.5)).toThrow(RangeError);

    const top3 = result.topRuns(3);
    expect(top3.map((e) => e.permutationIndex)).toEqual([1, 2, 3]);
    expect(Object.isFrozen(top3)).toBe(true);
    expect(Object.isFrozen(top3[0])).toBe(true);
  });
});
