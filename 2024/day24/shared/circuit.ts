import {
  type BusPrefix,
  type GateOp,
  type WireBit,
  type WireSwap,
  assertValidWireName,
  parseBitWire,
} from './types';

const INITIAL_LINE_RE = /^([a-z0-9]+):\s*([01])$/;
const GATE_LINE_RE = /^([a-z0-9]+)\s+(AND|OR|XOR)\s+([a-z0-9]+)\s*->\s*([a-z0-9]+)$/;

/** Immutable two-input logic gate with lexicographically canonicalized inputs. */
export class LogicGate {
  readonly op: GateOp;
  readonly in1: string;
  readonly in2: string;
  readonly out: string;

  constructor(op: GateOp, in1: string, in2: string, out: string) {
    assertValidWireName(in1);
    assertValidWireName(in2);
    assertValidWireName(out);
    this.op = op;
    if (in1 <= in2) { this.in1 = in1; this.in2 = in2; } else { this.in1 = in2; this.in2 = in1; }
    this.out = out;
    Object.freeze(this);
  }

  evaluate(a: WireBit, b: WireBit): WireBit {
    if (this.op === 'AND') return (a & b) as WireBit;
    if (this.op === 'OR') return (a | b) as WireBit;
    return (a ^ b) as WireBit;
  }
}

function validateCircuitStructure(
  initialWires: ReadonlyMap<string, WireBit>,
  gates: readonly LogicGate[],
): void {
  if (initialWires.size === 0 || gates.length === 0) {
    throw new Error('Circuit must contain at least one initial wire and one gate');
  }
  const outputs = new Set<string>();
  for (const gate of gates) {
    if (initialWires.has(gate.out)) {
      throw new Error(`Gate output "${gate.out}" overlaps an initial wire`);
    }
    if (outputs.has(gate.out)) {
      throw new Error(`Duplicate gate output "${gate.out}"`);
    }
    outputs.add(gate.out);
  }
  for (const gate of gates) {
    if (!initialWires.has(gate.in1) && !outputs.has(gate.in1)) {
      throw new Error(`Dangling input wire "${gate.in1}"`);
    }
    if (!initialWires.has(gate.in2) && !outputs.has(gate.in2)) {
      throw new Error(`Dangling input wire "${gate.in2}"`);
    }
  }
}

function buildSwapLookup(swaps: readonly WireSwap[], gates: readonly LogicGate[]): Map<string, string> {
  const outputs = new Set(gates.map((g) => g.out));
  const map = new Map<string, string>();
  for (const swap of swaps) {
    if (!outputs.has(swap.first) || !outputs.has(swap.second)) {
      throw new Error(`Swap wires must be gate outputs: ${swap.first}, ${swap.second}`);
    }
    if (map.has(swap.first) || map.has(swap.second)) {
      throw new Error(`Overlapping wire swap involving "${swap.first}" or "${swap.second}"`);
    }
    map.set(swap.first, swap.second);
    map.set(swap.second, swap.first);
  }
  return map;
}

/** Immutable combinational (or potentially cyclic) wire-and-gate logic circuit. */
export class LogicCircuit {
  readonly initialWires: ReadonlyMap<string, WireBit>;
  readonly gates: readonly LogicGate[];

  constructor(initialWires: ReadonlyMap<string, WireBit>, gates: readonly LogicGate[]) {
    const wiresCopy = new Map<string, WireBit>();
    for (const [name, bit] of initialWires) {
      assertValidWireName(name);
      wiresCopy.set(name, bit);
    }
    const gatesCopy = Object.freeze([...gates]);
    validateCircuitStructure(wiresCopy, gatesCopy);
    this.initialWires = wiresCopy;
    this.gates = gatesCopy;
    Object.freeze(this);
  }

  get wireNames(): readonly string[] {
    const names = new Set<string>(this.initialWires.keys());
    for (const gate of this.gates) names.add(gate.out);
    return Object.freeze([...names].sort());
  }

  gateByOutput(wire: string): LogicGate | undefined {
    return this.gates.find((gate) => gate.out === wire);
  }

  busBitWidth(prefix: BusPrefix): number {
    let width = 0;
    for (const name of this.wireNames) {
      const bit = parseBitWire(name, prefix);
      if (bit !== null) width = Math.max(width, bit + 1);
    }
    return width;
  }

  withSwaps(swaps: readonly WireSwap[]): LogicCircuit {
    const swapMap = buildSwapLookup(swaps, this.gates);
    const nextGates = this.gates.map((gate) => {
      const nextOut = swapMap.get(gate.out);
      return nextOut ? new LogicGate(gate.op, gate.in1, gate.in2, nextOut) : gate;
    });
    return new LogicCircuit(this.initialWires, nextGates);
  }
}

function parseInitialSection(section: string): Map<string, WireBit> {
  const wires = new Map<string, WireBit>();
  for (const rawLine of section.split(/\r?\n/)) {
    const line = rawLine.trim();
    const match = INITIAL_LINE_RE.exec(line);
    if (!match) throw new Error(`Invalid initial wire line: "${line}"`);
    const name = match[1]!;
    if (wires.has(name)) throw new Error(`Duplicate initial wire "${name}"`);
    wires.set(name, Number(match[2]) as WireBit);
  }
  return wires;
}

function parseGateSection(section: string): LogicGate[] {
  const gates: LogicGate[] = [];
  for (const rawLine of section.split(/\r?\n/)) {
    const line = rawLine.trim();
    const match = GATE_LINE_RE.exec(line);
    if (!match) throw new Error(`Invalid gate line: "${line}"`);
    gates.push(new LogicGate(match[2] as GateOp, match[1]!, match[3]!, match[4]!));
  }
  return gates;
}

/** Parses an AoC Day 24 circuit specification without rejecting gate cycles. */
export function parseCircuit(raw: string): LogicCircuit {
  const sections = raw.trim().split(/\r?\n\s*\r?\n/);
  if (sections.length !== 2) {
    throw new Error('Circuit input must contain initial wires and gates separated by a blank line');
  }
  return new LogicCircuit(parseInitialSection(sections[0]!), parseGateSection(sections[1]!));
}
