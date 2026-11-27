import { describe, expect, it } from 'vitest';
import { JUMP_DISTANCE, readSensorWindow, simulateHullCrossing } from './hullSimulator';
import { SpringscriptProgram } from './springscript';

describe('hullSimulator', () => {
  it('reads 9-tile sensor window with implicit safe tiles past hull end', () => {
    expect(JUMP_DISTANCE).toBe(4);
    const window0 = readSensorWindow('#####.#####', 0);
    expect(window0).toEqual({
      A: true,
      B: true,
      C: true,
      D: true,
      E: false,
      F: true,
      G: true,
      H: true,
      I: true,
    });

    const windowEnd = readSensorWindow('##.#', 2);
    expect(windowEnd).toEqual({
      A: true,
      B: true,
      C: true,
      D: true,
      E: true,
      F: true,
      G: true,
      H: true,
      I: true,
    });
  });

  it('rejects malformed hulls and invalid positions', () => {
    expect(() => readSensorWindow('', 0)).toThrow(RangeError);
    expect(() => readSensorWindow('.###', 0)).toThrow(RangeError);
    expect(() => readSensorWindow('##?#', 0)).toThrow(RangeError);
    expect(() => readSensorWindow('####', -1)).toThrow(RangeError);
    expect(() => readSensorWindow('####', 1.5)).toThrow(RangeError);
  });

  it('simulates successful crossing and hole failures', () => {
    const walkRule = new SpringscriptProgram('WALK', [
      { op: 'OR', x: 'A', y: 'J' },
      { op: 'AND', x: 'B', y: 'J' },
      { op: 'AND', x: 'C', y: 'J' },
      { op: 'NOT', x: 'J', y: 'J' },
      { op: 'AND', x: 'D', y: 'J' },
    ]);

    const crossed = simulateHullCrossing('#####.###########', walkRule);
    expect(crossed.crossed).toBe(true);
    expect(crossed.failedAt).toBeNull();
    expect(crossed.ticks[2]?.position).toBe(2);
    expect(crossed.ticks[2]?.nextPosition).toBe(6);
    expect(crossed.ticks[2]?.landedSafe).toBe(true);

    const walkIntoHole = simulateHullCrossing('#####.#####', new SpringscriptProgram('WALK', []));
    expect(walkIntoHole.crossed).toBe(false);
    expect(walkIntoHole.failedAt).toBe(5);
    expect(walkIntoHole.ticks[4]?.landedSafe).toBe(false);

    const jumpIntoHole = simulateHullCrossing(
      '####..####',
      new SpringscriptProgram('WALK', [{ op: 'NOT', x: 'A', y: 'J' }]),
    );
    expect(jumpIntoHole.crossed).toBe(true);

    const badJump = simulateHullCrossing(
      '#####....###',
      new SpringscriptProgram('WALK', [{ op: 'NOT', x: 'C', y: 'J' }]),
    );
    expect(badJump.crossed).toBe(false);
    expect(badJump.failedAt).toBe(6);
  });
});
