import { describe, expect, it } from 'vitest';
import { parseIntcodeProgram } from '../../shared/intcode';
import { FEEDBACK_LOOP_MODE, SERIES_CIRCUIT_MODE } from './circuitModes';

const PART1_EX1 = '3,15,3,16,1002,16,10,16,1,16,15,15,4,15,99,0,0';
const PART2_EX1 =
  '3,26,1001,26,-4,26,3,27,1002,27,2,27,1,27,26,27,4,27,1001,28,-1,28,1005,28,6,99,0,0,5';
const PART2_EX2 =
  '3,52,1001,52,-5,52,3,53,1,52,56,54,1007,54,5,55,1005,55,26,1001,54,-5,54,1105,1,12,1,53,54,53,1008,54,0,55,1001,55,1,55,2,53,55,53,4,53,1001,56,-1,56,1005,56,6,99,0,0,0,0,10';

describe('circuitModes', () => {
  it('evaluates series circuit mode on Part 1 Example 1', () => {
    expect(SERIES_CIRCUIT_MODE.id).toBe('series');
    expect(SERIES_CIRCUIT_MODE.hasFeedbackLoop).toBe(false);
    expect(SERIES_CIRCUIT_MODE.phaseSettings).toEqual([0n, 1n, 2n, 3n, 4n]);

    const result = SERIES_CIRCUIT_MODE.evaluate(
      parseIntcodeProgram(PART1_EX1),
      [4n, 3n, 2n, 1n, 0n],
      1000,
    );
    expect(result.thrusterSignal).toBe(43210n);
    expect(result.rounds).toBe(1);
    expect(result.stages.every((s) => s.status === 'halted')).toBe(true);
  });

  it('rejects wrong phase tuple length in both modes', () => {
    const program = parseIntcodeProgram(PART1_EX1);
    expect(() => SERIES_CIRCUIT_MODE.evaluate(program, [0n, 1n], 1000)).toThrow(RangeError);
    expect(() => FEEDBACK_LOOP_MODE.evaluate(program, [5n, 6n], 1000)).toThrow(RangeError);
  });

  it('throws when a series stage pauses waiting for extra input or produces no output', () => {
    // Reads phase, then tries to read 2 extra inputs (second never arrives).
    const waitingProgram = parseIntcodeProgram('3,10,3,10,3,10,4,10,99,0,0');
    expect(() =>
      SERIES_CIRCUIT_MODE.evaluate(waitingProgram, [0n, 1n, 2n, 3n, 4n], 1000),
    ).toThrow(/paused/);

    // Reads phase and signal, halts immediately without emitting output.
    const silentProgram = parseIntcodeProgram('3,5,3,5,99,0');
    expect(() =>
      SERIES_CIRCUIT_MODE.evaluate(silentProgram, [0n, 1n, 2n, 3n, 4n], 1000),
    ).toThrow(/no output/);
  });

  it('evaluates feedback loop mode on official Part 2 examples', () => {
    expect(FEEDBACK_LOOP_MODE.id).toBe('feedback');
    expect(FEEDBACK_LOOP_MODE.hasFeedbackLoop).toBe(true);
    expect(FEEDBACK_LOOP_MODE.phaseSettings).toEqual([5n, 6n, 7n, 8n, 9n]);

    const r1 = FEEDBACK_LOOP_MODE.evaluate(
      parseIntcodeProgram(PART2_EX1),
      [9n, 8n, 7n, 6n, 5n],
      10_000,
    );
    expect(r1.thrusterSignal).toBe(139629729n);
    expect(r1.rounds).toBeGreaterThan(1);

    const r2 = FEEDBACK_LOOP_MODE.evaluate(
      parseIntcodeProgram(PART2_EX2),
      [9n, 7n, 8n, 5n, 6n],
      10_000,
    );
    expect(r2.thrusterSignal).toBe(18216n);
  });

  it('detects feedback deadlock when stages wait for input without producing signals', () => {
    // Each stage reads phase, reads one signal (A gets 0n, B..E wait), then tries another read without outputting.
    const deadlocking = parseIntcodeProgram('3,5,3,5,3,5,99,0');
    expect(() =>
      FEEDBACK_LOOP_MODE.evaluate(deadlocking, [5n, 6n, 7n, 8n, 9n], 1000),
    ).toThrow(/deadlock/i);
  });
});
