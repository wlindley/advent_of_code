import { describe, expect, it } from 'vitest';
import { LogicCircuit, LogicGate } from './circuit';
import { WireSwap, formatBitWire } from './types';
import { repairAdder } from './adderRepair';

function buildAdder(bits: number): LogicCircuit {
  const init = new Map<string, 0 | 1>();
  const gates: LogicGate[] = [];
  let carry = '';
  for (let i = 0; i < bits; i += 1) {
    const x = formatBitWire('x', i);
    const y = formatBitWire('y', i);
    const z = formatBitWire('z', i);
    init.set(x, 0);
    init.set(y, 0);
    if (i === 0) {
      gates.push(new LogicGate('XOR', x, y, z));
      carry = bits === 1 ? formatBitWire('z', 1) : 'c00';
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

function expectRepair(bits: number, pairs: readonly (readonly [string, string])[]): void {
  const clean = buildAdder(bits);
  const swaps = pairs.map(([a, b]) => new WireSwap(a, b));
  const corrupted = clean.withSwaps(swaps);
  const result = repairAdder(corrupted, swaps.length);
  const expected = pairs.flat().sort().join(',');
  expect(result.answer).toBe(expected);
  expect(result.swaps).toHaveLength(swaps.length);
  expect(result.repairedCircuit.gates).toHaveLength(clean.gates.length);
}

describe('adderRepair', () => {
  it('repairs bit-0, Case A, Case B, Case C, and Case D swap classes', () => {
    expectRepair(4, [['z00', 'c00']]);
    expectRepair(4, [['z00', 'z01']]);
    expectRepair(4, [['z01', 'h01']]);
    expectRepair(4, [['z02', 'c02']]);
    expectRepair(4, [['c00', 'z02']]);
    expectRepair(4, [['p01', 'g01']]);
    expectRepair(5, [['p02', 'g02'], ['c01', 'z03']]);
    expectRepair(4, [['z01', 'p01']]);
    expectRepair(4, [['z01', 'c00']]);
    expectRepair(4, [['z01', 'h01'], ['p01', 'g01']]);
    expectRepair(4, [['g01', 'c01']]);
    expectRepair(4, [['h01', 'c01']]);
    expectRepair(5, [['z03', 'h02']]);
    expectRepair(4, [['c02', 'z04']]);
    expectRepair(4, [['c01', 'z02'], ['p01', 'g01']]);
    expectRepair(4, [['z00', 'c00'], ['p01', 'p02'], ['z01', 'z02']]);
    expectRepair(4, []);

    const renamed = buildAdder(3);
    const withA01 = new LogicCircuit(
      renamed.initialWires,
      renamed.gates.map((g) => new LogicGate(
        g.op,
        g.in1 === 'h01' ? 'a01' : g.in1,
        g.in2 === 'h01' ? 'a01' : g.in2,
        g.out === 'h01' ? 'a01' : g.out,
      )),
    ).withSwaps([new WireSwap('a01', 'c00')]);
    expect(repairAdder(withA01, 1).answer).toBe('a01,c00');
  });

  it('repairs 4-swap N=8 and N=45 adders quickly', () => {
    expectRepair(8, [['z00', 'c00'], ['p02', 'g02'], ['h04', 'z04'], ['g06', 'c06']]);
    expectRepair(45, [['z07', 'h07'], ['p15', 'g15'], ['c23', 'z24'], ['z38', 'h37']]);
  });

  it('rejects invalid preconditions and unrepairable circuits', () => {
    const oneBit = buildAdder(1);
    expect(() => repairAdder(oneBit, 0)).toThrow();

    const fourBit = buildAdder(4);
    expect(() => repairAdder(fourBit, -1)).toThrow();
    expect(() => repairAdder(fourBit, 99)).toThrow();
    expect(() => repairAdder(fourBit, 1)).toThrow();
    expect(() => repairAdder(fourBit.withSwaps([new WireSwap('z01', 'h01')]), 0)).toThrow();

    const extraGate = new LogicCircuit(
      fourBit.initialWires,
      [...fourBit.gates, new LogicGate('AND', 'x00', 'y00', 'extra')],
    );
    expect(() => repairAdder(extraGate, 0)).toThrow();

    const twoBit = buildAdder(2);
    const badBit0 = new LogicCircuit(
      twoBit.initialWires,
      twoBit.gates.map((g, i) => (i === 0 ? new LogicGate('OR', g.in1, g.in2, g.out) : g)),
    );
    expect(() => repairAdder(badBit0, 0)).toThrow();

    const badBit1 = new LogicCircuit(
      twoBit.initialWires,
      twoBit.gates.map((g, i) => (i === 2 ? new LogicGate('OR', g.in1, g.in2, g.out) : g)),
    );
    expect(() => repairAdder(badBit1, 0)).toThrow();

    const badH = new LogicCircuit(
      twoBit.initialWires,
      twoBit.gates.map((g, i) => (i === 5 ? new LogicGate('OR', g.in1, g.in2, g.out) : g)),
    );
    expect(() => repairAdder(badH, 0)).toThrow();

    const swappedOutBad = twoBit.withSwaps([new WireSwap('z00', 'z01')]);
    expect(() => repairAdder(swappedOutBad, 2)).toThrow();

    const wrongVerify = new LogicCircuit(
      twoBit.initialWires,
      twoBit.gates.map((g) => (g.out === 'z01' ? new LogicGate('OR', g.in1, g.in2, 'z01') : g)),
    );
    expect(() => repairAdder(wrongVerify, 0)).toThrow();

    const noZ00 = new LogicCircuit(
      twoBit.initialWires,
      twoBit.gates.map((g) => (g.out === 'z00' ? new LogicGate(g.op, g.in1, g.in2, 'w00') : g)),
    );
    expect(() => repairAdder(noZ00, 1)).toThrow();

    const inputXor = new LogicCircuit(
      twoBit.initialWires,
      twoBit.gates.map((g) => (g.out === 'z01' ? new LogicGate('XOR', 'x00', 'p01', 'z01') : g)),
    );
    expect(() => repairAdder(inputXor, 1)).toThrow();
  });
});
