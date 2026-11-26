import { describe, expect, it } from 'vitest';
import { LogicCircuit, LogicGate, parseCircuit } from './circuit';
import { formatBitWire } from './types';
import {
  evaluateCompiledAdder,
  tryCompileAdder,
  verifyAdderFunctionally,
} from './adderVerify';

function buildRippleAdder(bits: number): LogicCircuit {
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
      gates.push(new LogicGate('XOR', x, y, p));
      gates.push(new LogicGate('AND', x, y, g));
      gates.push(new LogicGate('XOR', p, carry, z));
      gates.push(new LogicGate('AND', p, carry, h));
      gates.push(new LogicGate('OR', g, h, nextC));
      carry = nextC;
    }
  }
  return new LogicCircuit(init, gates);
}

describe('adderVerify', () => {
  it('compiles and verifies valid 1-bit and 4-bit ripple-carry adders', () => {
    const oneBit = buildRippleAdder(1);
    const compiled1 = tryCompileAdder(oneBit);
    expect(compiled1).not.toBeNull();
    expect(evaluateCompiledAdder(compiled1!, 1n, 1n)).toBe(2n);
    expect(verifyAdderFunctionally(oneBit)).toBe(true);

    const fourBit = buildRippleAdder(4);
    expect(verifyAdderFunctionally(fourBit)).toBe(true);
    const compiled4 = tryCompileAdder(fourBit)!;
    expect(evaluateCompiledAdder(compiled4, 13n, 7n)).toBe(20n);
  });

  it('rejects broken and cyclic adders cleanly', () => {
    const broken = parseCircuit([
      'x00: 0', 'y00: 0',
      '',
      'x00 AND y00 -> z00',
      'x00 XOR y00 -> z01',
    ].join('\n'));
    expect(verifyAdderFunctionally(broken)).toBe(false);

    const cyclic = parseCircuit([
      'x00: 0', 'y00: 0',
      '',
      'x00 XOR c00 -> z00',
      'y00 OR z01 -> c00',
      'c00 AND x00 -> z01',
    ].join('\n'));
    expect(tryCompileAdder(cyclic)).toBeNull();
    expect(verifyAdderFunctionally(cyclic)).toBe(false);
  });

  it('returns null when required bus wires are missing or non-contiguous', () => {
    expect(tryCompileAdder(parseCircuit('a00: 1\n\na00 AND a00 -> z00'))).toBeNull();
    expect(tryCompileAdder(parseCircuit('x00: 1\ny00: 1\ny01: 1\n\nx00 XOR y00 -> z00\nx00 AND y01 -> z01'))).toBeNull();
    expect(tryCompileAdder(parseCircuit('x00: 1\ny00: 1\n\nx00 XOR y00 -> z00'))).toBeNull();
    expect(
      tryCompileAdder(
        parseCircuit('x00: 1\nx02: 1\ny00: 1\ny01: 1\ny02: 1\n\nx00 XOR y00 -> z00\nx02 XOR y01 -> z01\ny02 AND x00 -> z02\nx00 OR y00 -> z03'),
      ),
    ).toBeNull();
    expect(
      tryCompileAdder(
        parseCircuit('x00: 1\nx01: 1\nx02: 1\ny00: 1\ny02: 1\n\nx00 XOR y00 -> z00\nx01 XOR y02 -> z01\ny00 AND x00 -> z02\nx00 OR y00 -> z03'),
      ),
    ).toBeNull();
    expect(
      tryCompileAdder(
        parseCircuit('x00: 1\nx01: 1\ny00: 1\ny01: 1\n\nx00 XOR y00 -> z00\nx01 XOR y01 -> z02'),
      ),
    ).toBeNull();
  });
});
