import { describe, expect, it } from 'vitest';
import { LogicCircuit, LogicGate, parseCircuit } from './circuit';
import {
  CircuitSnapshot,
  DEFAULT_MAX_TRACE_STEPS,
  buildEvaluationTrace,
  buildRepairTrace,
} from './snapshot';
import { WireSwap, formatBitWire } from './types';

function buildAdder(bits: number): LogicCircuit {
  const init = new Map<string, 0 | 1>();
  const gates: LogicGate[] = [];
  let carry = '';
  for (let i = 0; i < bits; i += 1) {
    const x = formatBitWire('x', i);
    const y = formatBitWire('y', i);
    const z = formatBitWire('z', i);
    init.set(x, i === 0 ? 1 : 0);
    init.set(y, 1);
    if (i === 0) {
      gates.push(new LogicGate('XOR', x, y, z));
      carry = 'c00';
      gates.push(new LogicGate('AND', x, y, carry));
    } else {
      const p = `p${String(i).padStart(2, '0')}`;
      const g = `g${String(i).padStart(2, '0')}`;
      const h = `h${String(i).padStart(2, '0')}`;
      const nextC = i === bits - 1 ? formatBitWire('z', bits) : `c${String(i).padStart(2, '0')}`;
      gates.push(
        new LogicGate('XOR', x, y, p),
        new LogicGate('AND', x, y, g),
        new LogicGate('XOR', p, carry, z),
        new LogicGate('AND', p, carry, h),
        new LogicGate('OR', g, h, nextC),
      );
      carry = nextC;
    }
  }
  return new LogicCircuit(init, gates);
}

describe('CircuitSnapshot and trace builders', () => {
  it('builds bounded evaluation traces and exposes dynamic getters', () => {
    const circuit = parseCircuit([
      'x00: 1', 'x01: 1', 'y00: 0', 'y01: 1',
      '',
      'x00 AND y00 -> z00',
      'x01 XOR y01 -> z01',
      'x01 OR y01 -> z02',
    ].join('\n'));

    const trace = buildEvaluationTrace(circuit);
    expect(trace).toHaveLength(4);
    expect(trace[0]!.phase).toBe('initial');
    expect(trace[0]!.activeGate).toBeNull();
    expect(trace[0]!.zValue).toBe(0n);
    expect(trace[1]!.phase).toBe('step');
    expect(trace[1]!.activeGate).not.toBeNull();
    expect(trace[3]!.isComplete).toBe(true);
    expect(trace[3]!.totalGates).toBe(3);
    expect(trace[3]!.zValue).toBe(4n);
    expect(trace[3]!.answer).toBe('4');
    expect(trace[3]!.zBitCount).toBe(3);

    expect(buildEvaluationTrace(circuit, { maxSteps: 1 })).toHaveLength(1);
    expect(buildEvaluationTrace(circuit, { maxSteps: 2 })).toHaveLength(2);

    const singleGate = parseCircuit('x00: 1\n\nx00 XOR x00 -> z00');
    expect(buildEvaluationTrace(singleGate)).toHaveLength(2);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(48);
  });

  it('builds repair traces across cyclic and acyclic intermediate frames', () => {
    const clean = buildAdder(4);
    const zeroSwapTrace = buildRepairTrace(clean, 0);
    expect(zeroSwapTrace).toHaveLength(1);
    expect(zeroSwapTrace[0]!.isComplete).toBe(true);
    expect(zeroSwapTrace[0]!.activeSwap).toBeNull();

    // Swapping z01 <-> c00 creates a cycle in the initial corrupted circuit.
    const cyclicCorrupted = clean.withSwaps([new WireSwap('z01', 'c00'), new WireSwap('p02', 'g02')]);
    const repairTrace = buildRepairTrace(cyclicCorrupted, 2);
    expect(repairTrace).toHaveLength(3);
    expect(repairTrace[0]!.phase).toBe('initial');
    expect(repairTrace[0]!.evaluationOrder).toHaveLength(0);
    expect(repairTrace[1]!.phase).toBe('step');
    expect(repairTrace[1]!.activeSwap).not.toBeNull();
    expect(repairTrace[2]!.isComplete).toBe(true);
    expect(repairTrace[2]!.answer).toBe('c00,g02,p02,z01');
    expect(buildRepairTrace(cyclicCorrupted, 2, { maxSteps: 1 })).toHaveLength(1);
  });

  it('validates CircuitSnapshot invariants and maxSteps bounds', () => {
    const circuit = parseCircuit('x00: 1\n\nx00 AND x00 -> z00');
    expect(() => new CircuitSnapshot('evaluate', 'initial', circuit, [], 1, [], 0)).toThrow(RangeError);
    expect(() => new CircuitSnapshot('evaluate', 'initial', circuit, [], -1, [], 0)).toThrow(RangeError);
    expect(() => new CircuitSnapshot('repair', 'initial', circuit, [], 0, [], -1)).toThrow(RangeError);
    expect(() => buildEvaluationTrace(circuit, { maxSteps: 0 })).toThrow(RangeError);
  });
});
