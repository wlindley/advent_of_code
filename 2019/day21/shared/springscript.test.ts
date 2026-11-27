import { describe, expect, it } from 'vitest';
import {
  MAX_SPRINGSCRIPT_INSTRUCTIONS,
  SENSOR_ORDER,
  SpringscriptProgram,
  formatSpringscriptInstruction,
  type SensorWindow,
} from './springscript';

function makeSensors(overrides: Partial<Record<(typeof SENSOR_ORDER)[number], boolean>>): SensorWindow {
  return Object.freeze({
    A: overrides.A ?? true,
    B: overrides.B ?? true,
    C: overrides.C ?? true,
    D: overrides.D ?? true,
    E: overrides.E ?? true,
    F: overrides.F ?? true,
    G: overrides.G ?? true,
    H: overrides.H ?? true,
    I: overrides.I ?? true,
  });
}

describe('springscript', () => {
  it('formats instructions and builds ASCII scripts for WALK and empty programs', () => {
    expect(MAX_SPRINGSCRIPT_INSTRUCTIONS).toBe(15);
    expect(SENSOR_ORDER).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']);
    expect(formatSpringscriptInstruction({ op: 'NOT', x: 'A', y: 'J' })).toBe('NOT A J');

    const emptyWalk = new SpringscriptProgram('WALK', []);
    expect(emptyWalk.length).toBe(0);
    expect(emptyWalk.toAscii()).toBe('WALK\n');

    const walk = new SpringscriptProgram('WALK', [
      { op: 'NOT', x: 'A', y: 'J' },
      { op: 'AND', x: 'D', y: 'J' },
    ]);
    expect(walk.length).toBe(2);
    expect(walk.toAscii()).toBe('NOT A J\nAND D J\nWALK\n');
    expect(Object.isFrozen(walk)).toBe(true);
    expect(Object.isFrozen(walk.instructions)).toBe(true);
  });

  it('rejects > 15 instructions and extended sensors E..I in WALK mode', () => {
    const tooMany = Array.from({ length: 16 }, () => ({ op: 'OR' as const, x: 'A' as const, y: 'T' as const }));
    expect(() => new SpringscriptProgram('RUN', tooMany)).toThrow(RangeError);
    expect(() => new SpringscriptProgram('WALK', [{ op: 'OR', x: 'E', y: 'T' }])).toThrow(RangeError);
    expect(() => new SpringscriptProgram('WALK', [{ op: 'AND', x: 'I', y: 'J' }])).toThrow(RangeError);
  });

  it('evaluates AND, OR, NOT across sensors, T, and J in WALK and RUN modes', () => {
    const walk = new SpringscriptProgram('WALK', [
      { op: 'OR', x: 'A', y: 'J' },
      { op: 'AND', x: 'B', y: 'J' },
      { op: 'AND', x: 'C', y: 'J' },
      { op: 'NOT', x: 'J', y: 'J' },
      { op: 'AND', x: 'D', y: 'J' },
    ]);
    const evalSafeJump = walk.evaluate(makeSensors({ C: false, D: true }));
    expect(evalSafeJump.registerT).toBe(false);
    expect(evalSafeJump.registerJ).toBe(true);
    expect(evalSafeJump.steps.length).toBe(5);
    expect(evalSafeJump.steps[2]?.jAfter).toBe(false);
    expect(evalSafeJump.steps[3]?.jAfter).toBe(true);

    const run = new SpringscriptProgram('RUN', [
      { op: 'NOT', x: 'A', y: 'T' },
      { op: 'OR', x: 'E', y: 'T' },
      { op: 'OR', x: 'T', y: 'J' },
      { op: 'AND', x: 'J', y: 'T' },
    ]);
    const evalRun = run.evaluate(makeSensors({ A: true, E: false }));
    expect(evalRun.registerT).toBe(false);
    expect(evalRun.registerJ).toBe(false);
  });
});
