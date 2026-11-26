import { DirectedGraph } from '../../../shared/core';
import type { LogicCircuit, LogicGate } from './circuit';
import { type BusPrefix, type WireBit, parseBitWire } from './types';

/** Immutable result of topologically evaluating an acyclic logic circuit. */
export class CircuitEvaluation {
  readonly wireValues: ReadonlyMap<string, WireBit>;
  readonly evaluationOrder: readonly LogicGate[];

  constructor(wireValues: ReadonlyMap<string, WireBit>, evaluationOrder: readonly LogicGate[]) {
    this.wireValues = new Map(wireValues);
    this.evaluationOrder = Object.freeze([...evaluationOrder]);
    Object.freeze(this);
  }

  get zValue(): bigint {
    return assembleBusValue(this.wireValues, 'z');
  }

  busValue(prefix: BusPrefix): bigint {
    return assembleBusValue(this.wireValues, prefix);
  }
}

/** Builds the directed wire-dependency graph from inputs to gate outputs. */
export function buildWireGraph(circuit: LogicCircuit): DirectedGraph<string> {
  const adj = new Map<string, string[]>();
  for (const wire of circuit.wireNames) adj.set(wire, []);
  for (const gate of circuit.gates) {
    adj.get(gate.in1)!.push(gate.out);
    if (gate.in2 !== gate.in1) adj.get(gate.in2)!.push(gate.out);
  }
  return new DirectedGraph(adj);
}

/** Combines all settled bus wires (`prefix00`, `prefix01`, ...) into an unsigned `bigint`. */
export function assembleBusValue(values: ReadonlyMap<string, WireBit>, prefix: BusPrefix): bigint {
  let result = 0n;
  for (const [wire, bit] of values) {
    const idx = parseBitWire(wire, prefix);
    if (idx !== null) result |= BigInt(bit) << BigInt(idx);
  }
  return result;
}

function indexGatesByOutput(gates: readonly LogicGate[]): Map<string, LogicGate> {
  const byOut = new Map<string, LogicGate>();
  for (const gate of gates) byOut.set(gate.out, gate);
  return byOut;
}

/** Evaluates all gates in topological order; throws if the circuit contains a cycle. */
export function evaluateCircuit(circuit: LogicCircuit): CircuitEvaluation {
  const topo = buildWireGraph(circuit).topologicalOrder();
  const byOut = indexGatesByOutput(circuit.gates);
  const values = new Map<string, WireBit>(circuit.initialWires);
  const order: LogicGate[] = [];

  for (const wire of topo) {
    const gate = byOut.get(wire);
    if (!gate) continue;
    const a = values.get(gate.in1)!;
    const b = values.get(gate.in2)!;
    values.set(gate.out, gate.evaluate(a, b));
    order.push(gate);
  }

  return new CircuitEvaluation(values, order);
}
