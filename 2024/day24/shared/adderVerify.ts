import type { LogicCircuit, LogicGate } from './circuit';
import { buildWireGraph } from './evaluator';
import { type GateOp, formatBitWire } from './types';

export interface CompiledAdderCircuit {
  readonly bitWidth: number;
  readonly wireCount: number;
  readonly xIndices: Int32Array;
  readonly yIndices: Int32Array;
  readonly zIndices: Int32Array;
  readonly gateOps: Uint8Array;
  readonly gateIn1: Int32Array;
  readonly gateIn2: Int32Array;
  readonly gateOut: Int32Array;
}

function opCode(op: GateOp): number {
  if (op === 'AND') return 0;
  if (op === 'OR') return 1;
  return 2;
}

function collectBusIndices(
  circuit: LogicCircuit,
  wireToId: ReadonlyMap<string, number>,
  bitWidth: number,
): { x: Int32Array; y: Int32Array; z: Int32Array } | null {
  const x = new Int32Array(bitWidth);
  const y = new Int32Array(bitWidth);
  const z = new Int32Array(bitWidth + 1);
  for (let i = 0; i < bitWidth; i += 1) {
    const xWire = formatBitWire('x', i);
    const yWire = formatBitWire('y', i);
    if (!circuit.initialWires.has(xWire) || !circuit.initialWires.has(yWire)) return null;
    x[i] = wireToId.get(xWire)!;
    y[i] = wireToId.get(yWire)!;
  }
  for (let i = 0; i <= bitWidth; i += 1) {
    const zWire = formatBitWire('z', i);
    if (!circuit.gateByOutput(zWire)) return null;
    z[i] = wireToId.get(zWire)!;
  }
  return { x, y, z };
}

function tryTopologicalOrder(circuit: LogicCircuit): readonly string[] | null {
  try { return buildWireGraph(circuit).topologicalOrder(); } catch { return null; }
}

function compileGateTables(
  topo: readonly string[],
  circuit: LogicCircuit,
  wireToId: ReadonlyMap<string, number>,
): { ops: Uint8Array; in1: Int32Array; in2: Int32Array; out: Int32Array } {
  const gates: LogicGate[] = [];
  for (const wire of topo) {
    const gate = circuit.gateByOutput(wire);
    if (gate) gates.push(gate);
  }
  const ops = new Uint8Array(gates.length);
  const in1 = new Int32Array(gates.length);
  const in2 = new Int32Array(gates.length);
  const out = new Int32Array(gates.length);
  for (let i = 0; i < gates.length; i += 1) {
    const gate = gates[i]!;
    ops[i] = opCode(gate.op);
    in1[i] = wireToId.get(gate.in1)!;
    in2[i] = wireToId.get(gate.in2)!;
    out[i] = wireToId.get(gate.out)!;
  }
  return { ops, in1, in2, out };
}

/** Compiles an acyclic N-bit adder circuit to typed arrays, or returns `null`. */
export function tryCompileAdder(circuit: LogicCircuit): CompiledAdderCircuit | null {
  const bitWidth = circuit.busBitWidth('x');
  if (bitWidth < 1 || circuit.busBitWidth('y') !== bitWidth || circuit.busBitWidth('z') !== bitWidth + 1) {
    return null;
  }
  const topo = tryTopologicalOrder(circuit);
  if (!topo) return null;
  const wireToId = new Map<string, number>();
  for (let i = 0; i < topo.length; i += 1) wireToId.set(topo[i]!, i);
  const buses = collectBusIndices(circuit, wireToId, bitWidth);
  if (!buses) return null;
  const tables = compileGateTables(topo, circuit, wireToId);
  return Object.freeze({
    bitWidth, wireCount: topo.length,
    xIndices: buses.x, yIndices: buses.y, zIndices: buses.z,
    gateOps: tables.ops, gateIn1: tables.in1, gateIn2: tables.in2, gateOut: tables.out,
  });
}

/** Evaluates a compiled N-bit adder on unsigned `x` and `y` inputs. */
export function evaluateCompiledAdder(compiled: CompiledAdderCircuit, x: bigint, y: bigint): bigint {
  const wires = new Uint8Array(compiled.wireCount);
  for (let i = 0; i < compiled.bitWidth; i += 1) {
    wires[compiled.xIndices[i]!] = Number((x >> BigInt(i)) & 1n);
    wires[compiled.yIndices[i]!] = Number((y >> BigInt(i)) & 1n);
  }
  for (let g = 0; g < compiled.gateOps.length; g += 1) {
    const a = wires[compiled.gateIn1[g]!]!;
    const b = wires[compiled.gateIn2[g]!]!;
    const op = compiled.gateOps[g]!;
    wires[compiled.gateOut[g]!] = op === 0 ? a & b : op === 1 ? a | b : a ^ b;
  }
  let result = 0n;
  for (let i = 0; i <= compiled.bitWidth; i += 1) {
    if (wires[compiled.zIndices[i]!] === 1) result |= 1n << BigInt(i);
  }
  return result;
}

function alternatingMask(bitWidth: number, parity: number): bigint {
  let value = 0n;
  for (let i = parity; i < bitWidth; i += 2) value |= 1n << BigInt(i);
  return value;
}

function nextXorshift64(state: bigint): bigint {
  let s = state;
  s = BigInt.asUintN(64, s ^ (s << 13n));
  s = BigInt.asUintN(64, s ^ (s >> 7n));
  return BigInt.asUintN(64, s ^ (s << 17n));
}

function buildTestVectors(bitWidth: number): readonly (readonly [bigint, bigint])[] {
  const mask = (1n << BigInt(bitWidth)) - 1n;
  const even = alternatingMask(bitWidth, 0);
  const odd = alternatingMask(bitWidth, 1);
  const vectors: [bigint, bigint][] = [
    [0n, 0n], [0n, 1n], [1n, 0n], [1n, 1n],
    [mask, 0n], [0n, mask], [mask, 1n], [1n, mask], [mask, mask],
    [even, odd], [odd, even], [even, even], [odd, odd],
  ];
  for (let k = 0; k < bitWidth; k += 1) {
    const bit = 1n << BigInt(k);
    vectors.push([bit, 0n], [0n, bit], [bit, bit]);
    const lowOnes = (1n << BigInt(k + 1)) - 1n;
    vectors.push([lowOnes, 1n], [1n, lowOnes]);
  }
  let rng = 0x9e3779b97f4a7c15n;
  for (let i = 0; i < 32; i += 1) {
    rng = nextXorshift64(rng);
    const x = rng & mask;
    rng = nextXorshift64(rng);
    vectors.push([x, rng & mask]);
  }
  return vectors;
}

/** Verifies whether `circuit` computes `z = x + y` across deterministic test vectors. */
export function verifyAdderFunctionally(circuit: LogicCircuit): boolean {
  const compiled = tryCompileAdder(circuit);
  if (!compiled) return false;
  for (const [x, y] of buildTestVectors(compiled.bitWidth)) {
    if (evaluateCompiledAdder(compiled, x, y) !== x + y) return false;
  }
  return true;
}
