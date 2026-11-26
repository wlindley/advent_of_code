import { describe, expect, it } from 'vitest';
import {
  parseValveNetwork,
  START_VALVE_NAME,
  ValveNetwork,
} from './valveNetwork';

const SAMPLE_INPUT = [
  'Valve AA has flow rate=0; tunnels lead to valves DD, BB',
  'Valve BB has flow rate=13; tunnels lead to valves AA',
  'Valve DD has flow rate=20; tunnel leads to valve AA',
].join('\n');

describe('ValveNetwork & parseValveNetwork', () => {
  it('parses singular and plural tunnel lines and exposes lookup methods', () => {
    const net = parseValveNetwork(SAMPLE_INPUT);
    expect(net.size).toBe(3);
    expect(net.valves.map((v) => v.name)).toEqual(['AA', 'BB', 'DD']);
    expect(net.has(START_VALVE_NAME)).toBe(true);
    expect(net.has('ZZ')).toBe(false);
    expect(net.valve('DD')).toEqual({ name: 'DD', flowRate: 20, tunnels: ['AA'] });
    expect(net.indexOf('BB')).toBe(1);
    expect(Object.isFrozen(net)).toBe(true);
    expect(Object.isFrozen(net.valves)).toBe(true);
    expect(Object.isFrozen(net.valve('AA'))).toBe(true);
    expect(Object.isFrozen(net.valve('AA').tunnels)).toBe(true);
  });

  it('throws on missing valve lookup or indexOf', () => {
    const net = parseValveNetwork(SAMPLE_INPUT);
    expect(() => net.valve('ZZ')).toThrow(/ZZ/);
    expect(() => net.indexOf('ZZ')).toThrow(/ZZ/);
  });

  it('rejects empty input, malformed lines, and missing AA', () => {
    expect(() => parseValveNetwork('  \n ')).toThrow(/empty/i);
    expect(() => parseValveNetwork('Valve AA has bad line')).toThrow(/invalid valve line/i);
    expect(() =>
      parseValveNetwork('Valve BB has flow rate=5; tunnel leads to valve BB'),
    ).toThrow(/AA/);
  });

  it('rejects invalid ValveNetwork definitions directly', () => {
    expect(() => new ValveNetwork([])).toThrow(/at least one/i);
    expect(() => new ValveNetwork([{ name: '', flowRate: 0, tunnels: ['AA'] }])).toThrow(/name/i);
    expect(() =>
      new ValveNetwork([
        { name: 'AA', flowRate: 0, tunnels: ['AA'] },
        { name: 'AA', flowRate: 1, tunnels: ['AA'] },
      ]),
    ).toThrow(/duplicate/i);
    expect(() =>
      new ValveNetwork([{ name: 'AA', flowRate: -1, tunnels: ['AA'] }]),
    ).toThrow(RangeError);
    expect(() =>
      new ValveNetwork([{ name: 'AA', flowRate: 1.5, tunnels: ['AA'] }]),
    ).toThrow(RangeError);
    expect(() =>
      new ValveNetwork([{ name: 'AA', flowRate: 0, tunnels: [] }]),
    ).toThrow(/tunnel/i);
    expect(() =>
      new ValveNetwork([{ name: 'AA', flowRate: 0, tunnels: ['ZZ'] }]),
    ).toThrow(/unknown tunnel/i);
  });
});
