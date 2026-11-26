import { describe, expect, it } from 'vitest';
import { LogicCircuit, LogicGate, parseCircuit } from './circuit';
import { WireSwap, formatBitWire, parseBitWire } from './types';

describe('Day 24 wire helpers and WireSwap', () => {
  it('formats and parses canonical bit wires', () => {
    expect(formatBitWire('x', 0)).toBe('x00');
    expect(formatBitWire('y', 9)).toBe('y09');
    expect(formatBitWire('z', 45)).toBe('z45');
    expect(formatBitWire('z', 100)).toBe('z100');
    expect(() => formatBitWire('x', -1)).toThrow();
    expect(() => formatBitWire('x', 1.5)).toThrow();

    expect(parseBitWire('x00', 'x')).toBe(0);
    expect(parseBitWire('z12', 'z')).toBe(12);
    expect(parseBitWire('z100', 'z')).toBe(100);
    expect(parseBitWire('y00', 'x')).toBeNull();
    expect(parseBitWire('z0', 'z')).toBeNull();
    expect(parseBitWire('z001', 'z')).toBeNull();
    expect(parseBitWire('zab', 'z')).toBeNull();
  });

  it('canonicalizes WireSwap and rejects invalid pairs', () => {
    const swap = new WireSwap('z05', 'abc');
    expect(swap.first).toBe('abc');
    expect(swap.second).toBe('z05');
    expect(Object.isFrozen(swap)).toBe(true);
    expect(new WireSwap('aaa', 'zzz').first).toBe('aaa');
    expect(() => new WireSwap('z00', 'z00')).toThrow();
    expect(() => new WireSwap('Bad', 'z00')).toThrow();
    expect(() => new WireSwap('z00', '')).toThrow();
  });
});

describe('LogicGate', () => {
  it('canonicalizes inputs lexicographically and evaluates ops', () => {
    const andGate = new LogicGate('AND', 'y00', 'x00', 'z00');
    expect(andGate.in1).toBe('x00');
    expect(andGate.in2).toBe('y00');
    expect(andGate.evaluate(0, 1)).toBe(0);
    expect(andGate.evaluate(1, 1)).toBe(1);
    expect(Object.isFrozen(andGate)).toBe(true);

    const orGate = new LogicGate('OR', 'a', 'b', 'c');
    expect(orGate.in1).toBe('a');
    expect(orGate.in2).toBe('b');
    expect(orGate.evaluate(0, 0)).toBe(0);
    expect(orGate.evaluate(0, 1)).toBe(1);

    const xorGate = new LogicGate('XOR', 'b', 'a', 'c');
    expect(xorGate.evaluate(1, 1)).toBe(0);
    expect(xorGate.evaluate(1, 0)).toBe(1);
  });
});

describe('LogicCircuit and parseCircuit', () => {
  const sample = [
    'x00: 1',
    'x01: 0',
    'y00: 1',
    'y01: 1',
    '',
    'x00 AND y00 -> z00',
    'x01 XOR y01 -> z01',
    'x01 OR y01 -> z02',
  ].join('\n');

  it('parses valid circuits, computes buses, and applies disjoint swaps', () => {
    const circuit = parseCircuit(sample);
    expect(circuit.initialWires.get('x00')).toBe(1);
    expect(circuit.gates).toHaveLength(3);
    expect(circuit.wireNames).toEqual(['x00', 'x01', 'y00', 'y01', 'z00', 'z01', 'z02']);
    expect(circuit.gateByOutput('z01')?.op).toBe('XOR');
    expect(circuit.gateByOutput('missing')).toBeUndefined();
    expect(circuit.busBitWidth('x')).toBe(2);
    expect(circuit.busBitWidth('z')).toBe(3);

    const swapped = circuit.withSwaps([new WireSwap('z01', 'z00')]);
    expect(swapped.gateByOutput('z00')?.op).toBe('XOR');
    expect(swapped.gateByOutput('z01')?.op).toBe('AND');
    expect(swapped.gateByOutput('z02')?.op).toBe('OR');
    expect(() => circuit.withSwaps([new WireSwap('x00', 'z00')])).toThrow();
    expect(() => circuit.withSwaps([new WireSwap('z00', 'z99')])).toThrow();
    expect(() =>
      circuit.withSwaps([new WireSwap('z00', 'z01'), new WireSwap('z00', 'z02')]),
    ).toThrow();
    expect(() =>
      circuit.withSwaps([new WireSwap('z00', 'z01'), new WireSwap('z01', 'z02')]),
    ).toThrow();
  });

  it('allows cyclic gates at parse time, blank lines within sections, and non-bus wires', () => {
    const cyclic = parseCircuit('x00: 1\n\nx00 OR b -> a\na AND x00 -> b');
    expect(cyclic.busBitWidth('z')).toBe(0);
    expect(cyclic.gates).toHaveLength(2);
    const spaced = new LogicCircuit(new Map([['x00', 1]]), [new LogicGate('AND', 'x00', 'x00', 'a')]);
    expect(spaced.wireNames).toEqual(['a', 'x00']);
  });

  it('rejects malformed circuit inputs', () => {
    expect(() => parseCircuit('x00: 1')).toThrow();
    expect(() => parseCircuit('\n\nx00 AND x00 -> z00')).toThrow();
    expect(() => parseCircuit('x00: 1\n\n')).toThrow();
    expect(() => parseCircuit('bad-wire: 1\n\nx00 AND x00 -> z00')).toThrow();
    expect(() => parseCircuit('x00: 2\n\nx00 AND x00 -> z00')).toThrow();
    expect(() => parseCircuit('x00: 1\nx00: 0\n\nx00 AND x00 -> z00')).toThrow();
    expect(() => parseCircuit('x00: 1\n\nx00 NAND x00 -> z00')).toThrow();
    expect(() => parseCircuit('x00: 1\n\nx00 AND x00 -> x00')).toThrow();
    expect(() => parseCircuit('x00: 1\n\nx00 AND x00 -> z00\nx00 OR x00 -> z00')).toThrow();
    expect(() => parseCircuit('x00: 1\n\nx00 AND missing -> z00')).toThrow();
    expect(() => parseCircuit('x00: 1\n\nx00 AND zmissing -> z00')).toThrow();
    expect(() => new LogicCircuit(new Map(), [])).toThrow();
    expect(() => new LogicCircuit(new Map([['x00', 1]]), [])).toThrow();
  });
});
