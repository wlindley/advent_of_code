import { describe, expect, it } from 'vitest';
import { parseIntcodeProgram } from '../../shared/intcode';
import { AmplifierStage } from './amplifierStage';

describe('AmplifierStage', () => {
  it('pauses on missing signal, resumes when signal arrives, and drains new outputs incrementally', () => {
    // Reads phase, outputs phase*10, reads signal, outputs signal+phase, halts.
    const program = parseIntcodeProgram('3,17,102,10,17,18,4,18,3,19,1,17,19,19,4,19,99,0,0,0');
    const stage = new AmplifierStage('A', 4n, program);

    expect(stage.label).toBe('A');
    expect(stage.phase).toBe(4n);
    expect(stage.status).toBe('running');
    expect(stage.stepCount).toBe(0);
    expect(stage.emittedCount).toBe(0);

    const firstDrain = stage.runAndDrainOutputs(100);
    expect(firstDrain).toEqual([40n]);
    expect(stage.status).toBe('waiting-input');
    expect(stage.emittedCount).toBe(1);

    // Draining again before new output returns empty frozen tuple.
    const emptyDrain = stage.runAndDrainOutputs(100);
    expect(emptyDrain).toEqual([]);
    expect(Object.isFrozen(emptyDrain)).toBe(true);

    stage.enqueueSignal(7n);
    expect(stage.status).toBe('running');

    const secondDrain = stage.runAndDrainOutputs(100);
    expect(secondDrain).toEqual([11n]);
    expect(stage.status).toBe('halted');
    expect(stage.emittedCount).toBe(2);

    const telemetry = stage.toTelemetry();
    expect(telemetry.receivedSignals).toEqual([7n]);
    expect(telemetry.emittedSignals).toEqual([40n, 11n]);
    expect(telemetry.lastEmittedSignal).toBe(11n);
    expect(telemetry.stepCount).toBe(stage.stepCount);
    expect(telemetry.status).toBe('halted');
  });

  it('enforces cumulative lifetime step budget across pause/resume runs', () => {
    const program = parseIntcodeProgram('3,9,3,10,1,9,10,10,4,10,99');
    const stage = new AmplifierStage('B', 2n, program);

    stage.runAndDrainOutputs(5);
    expect(stage.stepCount).toBe(1);
    stage.enqueueSignal(3n);

    expect(() => stage.runAndDrainOutputs(2)).toThrow(RangeError);
  });
});
