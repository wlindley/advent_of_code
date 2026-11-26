import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import {
  LogicCircuit,
  LogicGate,
  type WireBit,
  WireSwap,
  evaluateCircuit,
  formatBitWire,
} from '../../shared';
import { PART2_SWAP_COUNT, solvePart2, solver } from './index';

const FOUR_BIT_CORRUPTED = [
  'x00: 1', 'x01: 1', 'x02: 0', 'x03: 1',
  'y00: 1', 'y01: 0', 'y02: 1', 'y03: 1',
  '',
  'x00 XOR y00 -> c00', 'x00 AND y00 -> z00',
  'x01 XOR y01 -> g01', 'x01 AND y01 -> p01', 'p01 XOR c00 -> z01',
  'p01 AND c00 -> h01', 'g01 OR h01 -> c01',
  'x02 XOR y02 -> p02', 'x02 AND y02 -> g02', 'p02 XOR c01 -> c02',
  'p02 AND c01 -> h02', 'g02 OR h02 -> z02',
  'x03 XOR y03 -> p03', 'x03 AND y03 -> g03', 'p03 XOR c02 -> h03',
  'p03 AND c02 -> z03', 'g03 OR h03 -> z04',
].join('\n');

function appendBitGates(gates: LogicGate[], bit: number, bits: number): void {
  const x = formatBitWire('x', bit);
  const y = formatBitWire('y', bit);
  const z = formatBitWire('z', bit);
  if (bit === 0) {
    gates.push(new LogicGate('XOR', x, y, z), new LogicGate('AND', x, y, 'c00'));
    return;
  }
  const tag = String(bit).padStart(2, '0');
  const prevCarry = `c${String(bit - 1).padStart(2, '0')}`;
  const carryOut = bit === bits - 1 ? formatBitWire('z', bits) : `c${tag}`;
  gates.push(
    new LogicGate('XOR', x, y, `p${tag}`),
    new LogicGate('AND', x, y, `g${tag}`),
    new LogicGate('XOR', `p${tag}`, prevCarry, z),
    new LogicGate('AND', `p${tag}`, prevCarry, `h${tag}`),
    new LogicGate('OR', `g${tag}`, `h${tag}`, carryOut),
  );
}

function buildRippleCarryAdder(bits: number): LogicCircuit {
  const wires = new Map<string, WireBit>();
  const gates: LogicGate[] = [];
  for (let bit = 0; bit < bits; bit += 1) {
    wires.set(formatBitWire('x', bit), (bit % 2) as WireBit);
    wires.set(formatBitWire('y', bit), ((bit + 1) % 2) as WireBit);
    appendBitGates(gates, bit, bits);
  }
  return new LogicCircuit(wires, gates);
}

function corruptCircuit(
  circuit: LogicCircuit,
  pairs: readonly (readonly [string, string])[],
): LogicCircuit {
  const swaps = pairs.map(([a, b]) => new WireSwap(a, b));
  return circuit.withSwaps(swaps);
}

function buildBitwiseAndCircuit(bits: number): LogicCircuit {
  const wires = new Map<string, WireBit>();
  const gates: LogicGate[] = [];
  for (let bit = 0; bit < bits; bit += 1) {
    const x = formatBitWire('x', bit);
    const y = formatBitWire('y', bit);
    wires.set(x, 1);
    wires.set(y, (bit % 2) as WireBit);
    gates.push(new LogicGate('AND', x, y, formatBitWire('z', bit)));
  }
  return new LogicCircuit(wires, gates);
}

describe('Day 24 Part 2 solver', () => {
  it('repairs the 4-bit 11 + 13 = 24 corrupted adder', () => {
    expect(PART2_SWAP_COUNT).toBe(4);
    const parsed = solver.parse(FOUR_BIT_CORRUPTED);
    expect(evaluateCircuit(parsed).zValue).toBe(21n);

    const result = executeSolver(solver, FOUR_BIT_CORRUPTED);
    expect(result.answer).toBe('c00,c02,g01,h03,p01,z00,z02,z03');

    const frames = solver.trace!(parsed);
    expect(frames.at(-1)?.zValue).toBe(24n);
  });

  it('repairs 8-bit adders with within-bit and acyclic cross-bit swaps', () => {
    const base = buildRippleCarryAdder(8);
    const withinBit = corruptCircuit(base, [
      ['z00', 'c00'], ['p02', 'g02'], ['h04', 'z04'], ['g06', 'c06'],
    ]);
    expect(solvePart2(withinBit)).toBe('c00,c06,g02,g06,h04,p02,z00,z04');

    const crossBit = corruptCircuit(base, [
      ['z03', 'z05'], ['p01', 'g01'], ['h04', 'z04'], ['z07', 'h07'],
    ]);
    expect(solvePart2(crossBit)).toBe('g01,h04,h07,p01,z03,z04,z05,z07');
  });

  it('repairs cyclic corruption and doubly-corrupted bit slices', () => {
    const base = buildRippleCarryAdder(8);
    const cyclic = corruptCircuit(base, [
      ['c01', 'c02'], ['z00', 'c00'], ['p04', 'g04'], ['h06', 'z06'],
    ]);
    const frames = solver.trace!(cyclic);
    expect(frames[0]?.evaluationOrder).toHaveLength(0);
    expect(frames[0]?.settledCount).toBe(0);
    const finalFrame = frames.at(-1)!;
    expect(finalFrame.isComplete).toBe(true);
    expect(finalFrame.evaluationOrder).toHaveLength(cyclic.gates.length);
    expect(evaluateCircuit(finalFrame.circuit).zValue).toBe(255n);
    expect(solvePart2(cyclic)).toBe('c00,c01,c02,g04,h06,p04,z00,z06');

    const doubleBit = corruptCircuit(base, [
      ['p02', 'g02'], ['z02', 'h02'], ['z00', 'c00'], ['h05', 'z05'],
    ]);
    expect(solvePart2(doubleBit)).toBe('c00,g02,h02,h05,p02,z00,z02,z05');
  });

  it('builds bounded repair traces for default and custom maxSteps', () => {
    const parsed = solver.parse(FOUR_BIT_CORRUPTED);
    const full = solver.trace!(parsed);
    expect(full.map((f) => f.phase)).toEqual(['initial', 'step', 'step', 'step', 'complete']);
    expect(solver.trace!(parsed, { maxSteps: 3 })).toHaveLength(3);
    const single = solver.trace!(parsed, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]?.phase).toBe('complete');
  });

  it('rejects malformed circuit syntax', () => {
    expect(() => solver.parse('x00: 1')).toThrow(/blank line/);
  });

  it('rejects the 6-bit bitwise-AND non-adder circuit', () => {
    expect(() => solvePart2(buildBitwiseAndCircuit(6))).toThrow(/adder structure/);
  });

  it('rejects a clean 0-swap 4-bit adder', () => {
    expect(() => solvePart2(buildRippleCarryAdder(4))).toThrow(/Unable to repair/);
  });

  it('rejects a 2-swap 4-bit adder', () => {
    const twoSwaps = corruptCircuit(buildRippleCarryAdder(4), [['z00', 'c00'], ['p02', 'g02']]);
    expect(() => solvePart2(twoSwaps)).toThrow(/Unable to repair/);
  });
});
