import { verifyAdderFunctionally } from './adderVerify';
import { LogicCircuit, LogicGate } from './circuit';
import { type GateOp, type WireBit, WireSwap, formatBitWire } from './types';

export interface AdderRepairResult {
  readonly swaps: readonly WireSwap[];
  readonly repairedCircuit: LogicCircuit;
  readonly answer: string;
}

interface MutableGate { readonly op: GateOp; readonly in1: string; readonly in2: string; out: string; }

class MutableCircuit {
  readonly initialWires: ReadonlyMap<string, WireBit>;
  readonly gates: readonly MutableGate[];
  private readonly byOutput = new Map<string, MutableGate>();
  private readonly byKey = new Map<string, MutableGate>();
  private readonly byOp = new Map<GateOp, MutableGate[]>([['AND', []], ['OR', []], ['XOR', []]]);

  constructor(circuit: LogicCircuit) {
    this.initialWires = circuit.initialWires;
    this.gates = circuit.gates.map((g) => {
      const mg: MutableGate = { op: g.op, in1: g.in1, in2: g.in2, out: g.out };
      this.byOutput.set(mg.out, mg);
      this.byKey.set(`${mg.op}:${mg.in1}:${mg.in2}`, mg);
      this.byOp.get(mg.op)!.push(mg);
      return mg;
    });
  }

  findGate(op: GateOp, a: string, b: string): MutableGate | undefined {
    return this.byKey.get(a <= b ? `${op}:${a}:${b}` : `${op}:${b}:${a}`);
  }
  gateByOutput(out: string): MutableGate | undefined { return this.byOutput.get(out); }
  gatesWithOp(op: GateOp): readonly MutableGate[] { return this.byOp.get(op)!; }

  swapOutputs(a: string, b: string): void {
    const ga = this.byOutput.get(a)!;
    const gb = this.byOutput.get(b)!;
    ga.out = b;
    gb.out = a;
    this.byOutput.set(b, ga);
    this.byOutput.set(a, gb);
  }

  toLogicCircuit(): LogicCircuit {
    return new LogicCircuit(this.initialWires, this.gates.map((g) => new LogicGate(g.op, g.in1, g.in2, g.out)));
  }
}

interface SearchState {
  readonly circuit: MutableCircuit;
  readonly bitWidth: number;
  readonly targetSwaps: number;
  readonly used: Set<string>;
  readonly swaps: WireSwap[];
}

function addCandidate(out: [string, string][], seen: Set<string>, a: string, b: string): void {
  const pair: [string, string] = a < b ? [a, b] : [b, a];
  const key = `${pair[0]}|${pair[1]}`;
  if (a === b || seen.has(key)) return;
  seen.add(key);
  out.push(pair);
}

function addGateMatch(out: [string, string][], seen: Set<string>, gate: MutableGate, target: string, swapWith: string): void {
  if (gate.in1 === target) addCandidate(out, seen, swapWith, gate.in2);
  else if (gate.in2 === target) addCandidate(out, seen, swapWith, gate.in1);
}

function collectXorSwapCandidates(circuit: MutableCircuit, p: string, g: string, cin: string, zk: string): readonly (readonly [string, string])[] {
  const out: [string, string][] = [];
  const seen = new Set<string>();
  const actualZ = circuit.gateByOutput(zk);
  if (actualZ && actualZ.op === 'XOR') {
    addGateMatch(out, seen, actualZ, p, cin);
    addGateMatch(out, seen, actualZ, cin, p);
    if (actualZ.in1 === g || actualZ.in2 === g) addCandidate(out, seen, p, g);
  }
  for (const gate of circuit.gatesWithOp('XOR')) {
    addGateMatch(out, seen, gate, p, cin);
    addGateMatch(out, seen, gate, cin, p);
  }
  return out;
}

function collectOrSwapCandidates(circuit: MutableCircuit, g: string, h: string): readonly (readonly [string, string])[] {
  const out: [string, string][] = [];
  const seen = new Set<string>();
  for (const gate of circuit.gatesWithOp('OR')) {
    addGateMatch(out, seen, gate, g, h);
    addGateMatch(out, seen, gate, h, g);
  }
  return out;
}

function trySwapAndSearch(state: SearchState, candidates: readonly (readonly [string, string])[], k: number, cin: string): boolean {
  if (state.swaps.length >= state.targetSwaps) return false;
  for (const [a, b] of candidates) {
    if (state.used.has(a) || state.used.has(b)) continue;
    if (!state.circuit.gateByOutput(a) || !state.circuit.gateByOutput(b)) continue;
    state.circuit.swapOutputs(a, b);
    state.used.add(a);
    state.used.add(b);
    state.swaps.push(new WireSwap(a, b));
    const nextCin = cin === a ? b : cin === b ? a : cin;
    if (searchBit(state, k, nextCin)) return true;
    state.swaps.pop();
    state.used.delete(a);
    state.used.delete(b);
    state.circuit.swapOutputs(a, b);
  }
  return false;
}

function searchBit(state: SearchState, k: number, cin: string): boolean {
  if (k === 0) {
    const sum0 = state.circuit.findGate('XOR', 'x00', 'y00');
    const carry0 = state.circuit.findGate('AND', 'x00', 'y00');
    if (!sum0 || !carry0) return false;
    return sum0.out !== 'z00' ? trySwapAndSearch(state, [[sum0.out, 'z00']], 0, '') : searchBit(state, 1, carry0.out);
  }
  if (k === state.bitWidth) {
    return state.swaps.length === state.targetSwaps && verifyAdderFunctionally(state.circuit.toLogicCircuit());
  }
  const pGate = state.circuit.findGate('XOR', formatBitWire('x', k), formatBitWire('y', k));
  const gGate = state.circuit.findGate('AND', formatBitWire('x', k), formatBitWire('y', k));
  if (!pGate || !gGate) return false;
  const p = pGate.out;
  const g = gGate.out;
  const zk = formatBitWire('z', k);
  const sGate = state.circuit.findGate('XOR', p, cin);
  if (!sGate) return trySwapAndSearch(state, collectXorSwapCandidates(state.circuit, p, g, cin, zk), k, cin);
  if (sGate.out !== zk) return trySwapAndSearch(state, [[sGate.out, zk]], k, cin);
  const hGate = state.circuit.findGate('AND', p, cin);
  if (!hGate) return false;
  const cGate = state.circuit.findGate('OR', g, hGate.out);
  if (!cGate) return trySwapAndSearch(state, collectOrSwapCandidates(state.circuit, g, hGate.out), k, cin);
  return searchBit(state, k + 1, cGate.out);
}

/** Repairs `swapCount` swapped output-wire pairs in an N-bit ripple-carry adder. */
export function repairAdder(circuit: LogicCircuit, swapCount: number): AdderRepairResult {
  const bitWidth = circuit.busBitWidth('x');
  if (bitWidth < 2 || circuit.gates.length !== 5 * bitWidth - 3) {
    throw new Error('Circuit does not match N-bit ripple-carry adder structure');
  }
  if (!Number.isInteger(swapCount) || swapCount < 0 || 2 * swapCount > circuit.gates.length) {
    throw new RangeError(`Invalid swapCount ${swapCount} for ${circuit.gates.length} gates`);
  }
  const state: SearchState = {
    circuit: new MutableCircuit(circuit), bitWidth, targetSwaps: swapCount, used: new Set(), swaps: [],
  };
  if (!searchBit(state, 0, '')) throw new Error('Unable to repair adder with requested swapCount');
  const names = state.swaps.flatMap((s) => [s.first, s.second]).sort();
  return Object.freeze({ swaps: Object.freeze([...state.swaps]), repairedCircuit: state.circuit.toLogicCircuit(), answer: names.join(',') });
}
