import { describe, expect, it } from 'vitest';
import { FactoryMachine, parseMachines } from './index';

const EXAMPLE = [
  '[.##.] (3) (1,3) (2) (2,3) (0,2) (0,1) {3,5,4,7}',
  '[...#.] (0,2,3,4) (2,3) (0,4) (0,1,2) (1,2,3,4) {7,5,12,7,2}',
  '[.###.#] (0,1,2,3,4) (0,3,4) (0,1,2,4,5) (1,2) {10,11,11,5,10,5}',
].join('\n');

describe('parseMachines & FactoryMachine', () => {
  it('parses the 3 official example machines and exposes derived masks', () => {
    const machines = parseMachines(EXAMPLE);
    expect(machines).toHaveLength(3);
    const [m0, m1, m2] = machines as [FactoryMachine, FactoryMachine, FactoryMachine];
    expect([m0.lightCount, m0.buttonCount, m0.targetMask]).toEqual([4, 6, 0b0110n]);
    expect(m0.buttonMasks).toEqual([0b1000n, 0b1010n, 0b0100n, 0b1100n, 0b0101n, 0b0011n]);
    expect(m0.joltageRequirements).toEqual([3, 5, 4, 7]);
    expect([m1.lightCount, m1.buttonCount, m1.targetMask]).toEqual([5, 5, 0b01000n]);
    expect([m2.lightCount, m2.buttonCount, m2.targetMask]).toEqual([6, 4, 0b101110n]);
  });

  it('handles CRLF, blank lines, minimal 1-light/1-button, and duplicate buttons', () => {
    const machines = parseMachines(' \r\n[#] (0) (0) {0}\r\n\n');
    expect(machines).toHaveLength(1);
    const m = machines[0]!;
    expect([m.lightCount, m.buttonCount, m.targetMask]).toEqual([1, 2, 1n]);
    expect(m.buttonMasks).toEqual([1n, 1n]);
    expect([m, m.targetLights, m.buttons, m.buttons[0], m.joltageRequirements].every(Object.isFrozen)).toBe(true);
  });

  it('rejects empty input and malformed lines separately', () => {
    expect(() => parseMachines('  \n\t ')).toThrow(Error);
    expect(() => parseMachines('invalid line')).toThrow(Error);
    expect(() => parseMachines('[] (0) {1}')).toThrow(Error);
    expect(() => parseMachines('[#] {1}')).toThrow(Error);
    expect(() => parseMachines('[#] (0)')).toThrow(Error);
  });

  it('validates FactoryMachine constructor invariants separately', () => {
    expect(() => new FactoryMachine([], [[0]], [])).toThrow(RangeError);
    expect(() => new FactoryMachine([true], [], [1])).toThrow(RangeError);
    expect(() => new FactoryMachine([true, false], [[0]], [1])).toThrow(RangeError);
    expect(() => new FactoryMachine([true], [[0]], [-1])).toThrow(RangeError);
    expect(() => new FactoryMachine([true], [[0]], [1.5])).toThrow(RangeError);
    expect(() => new FactoryMachine([true], [[]], [1])).toThrow(RangeError);
    expect(() => new FactoryMachine([true], [[-1]], [1])).toThrow(RangeError);
    expect(() => new FactoryMachine([true], [[1]], [1])).toThrow(RangeError);
    expect(() => new FactoryMachine([true], [[0.5]], [1])).toThrow(RangeError);
    expect(() => new FactoryMachine([true, false], [[0, 0]], [1, 1])).toThrow(Error);
  });
});
