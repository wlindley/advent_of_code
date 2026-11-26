import type { CircuitSnapshot, GateOp, LogicGate, WireBit } from '../index';

export const SVG_WIDTH = 680;
export const SVG_HEIGHT = 316;
const MAX_FULL_GATES = 40;
const FOCUSED_WINDOW = 18;

export interface LayoutNode {
  readonly id: string;
  readonly label: string;
  readonly sublabel: string;
  readonly x: number;
  readonly y: number;
  readonly kind: 'input' | 'gate';
  readonly op?: GateOp;
  readonly bit?: WireBit;
}

export interface LayoutEdge {
  readonly key: string;
  readonly fromX: number;
  readonly fromY: number;
  readonly toX: number;
  readonly toY: number;
  readonly wire: string;
  readonly bit?: WireBit;
  readonly active: boolean;
  readonly swapped: boolean;
}

export interface CircuitLayout {
  readonly nodes: readonly LayoutNode[];
  readonly edges: readonly LayoutEdge[];
  readonly focused: boolean;
  readonly visibleGates: number;
  readonly totalGates: number;
}

function selectVisibleGates(snapshot: CircuitSnapshot): { gates: readonly LogicGate[]; focused: boolean } {
  const source = snapshot.evaluationOrder.length > 0 ? snapshot.evaluationOrder : snapshot.circuit.gates;
  if (source.length <= MAX_FULL_GATES && snapshot.evaluationOrder.length > 0) {
    return { gates: source, focused: false };
  }
  let anchor = Math.max(0, snapshot.settledCount - 1);
  if (snapshot.activeSwap) {
    const { first, second } = snapshot.activeSwap;
    const idx = source.findIndex((g) => g.out === first || g.out === second);
    if (idx >= 0) anchor = idx;
  }
  const start = Math.max(0, Math.min(source.length - FOCUSED_WINDOW, anchor - Math.floor(FOCUSED_WINDOW / 2)));
  return { gates: source.slice(start, start + FOCUSED_WINDOW), focused: true };
}

function assignDepths(gates: readonly LogicGate[]): Map<string, number> {
  const gateOutSet = new Set(gates.map((g) => g.out));
  const depth = new Map<string, number>();
  for (const gate of gates) {
    if (!gateOutSet.has(gate.in1)) depth.set(gate.in1, 0);
    if (!gateOutSet.has(gate.in2)) depth.set(gate.in2, 0);
  }
  for (let pass = 0; pass < gates.length; pass += 1) {
    let changed = false;
    for (const gate of gates) {
      const next = Math.max(depth.get(gate.in1) ?? 0, depth.get(gate.in2) ?? 0) + 1;
      if ((depth.get(gate.out) ?? 0) !== next) { depth.set(gate.out, next); changed = true; }
    }
    if (!changed) break;
  }
  return depth;
}

function distributeCoords(count: number, min: number, max: number): readonly number[] {
  if (count <= 1) return [(min + max) / 2];
  return Array.from({ length: count }, (_, i) => min + (i * (max - min)) / (count - 1));
}

export function buildCircuitLayout(snapshot: CircuitSnapshot): CircuitLayout {
  const { gates, focused } = selectVisibleGates(snapshot);
  const values = snapshot.wireValues;
  const depths = assignDepths(gates);
  const gateByOut = new Map(gates.map((g) => [g.out, g]));
  const columns = new Map<number, string[]>();
  for (const [wire, d] of depths) {
    const col = columns.get(d);
    if (col) col.push(wire);
    else columns.set(d, [wire]);
  }
  const sortedDepths = [...columns.keys()].sort((a, b) => a - b);
  const xs = distributeCoords(sortedDepths.length, 46, SVG_WIDTH - 52);
  const pos = new Map<string, readonly [number, number]>();
  const nodes: LayoutNode[] = [];
  sortedDepths.forEach((d, colIdx) => {
    const wires = columns.get(d)!;
    const ys = distributeCoords(wires.length, 32, SVG_HEIGHT - 28);
    wires.forEach((wire, rowIdx) => {
      const [x, y] = [xs[colIdx]!, ys[rowIdx]!];
      pos.set(wire, [x, y]);
      const gate = gateByOut.get(wire);
      nodes.push({
        id: wire, label: wire, sublabel: gate ? gate.op : 'IN',
        x, y, kind: gate ? 'gate' : 'input', op: gate?.op, bit: values.get(wire),
      });
    });
  });

  const activeOut = snapshot.activeGate?.out;
  const swapSet = new Set(snapshot.swaps.flatMap((s) => [s.first, s.second]));
  const edges: LayoutEdge[] = [];
  for (const gate of gates) {
    const to = pos.get(gate.out)!;
    for (const srcWire of gate.in1 === gate.in2 ? [gate.in1] : [gate.in1, gate.in2]) {
      const from = pos.get(srcWire);
      if (!from) continue;
      edges.push({
        key: `${srcWire}->${gate.out}`, fromX: from[0], fromY: from[1], toX: to[0], toY: to[1],
        wire: srcWire, bit: values.get(srcWire), active: gate.out === activeOut,
        swapped: swapSet.has(gate.out) || swapSet.has(srcWire),
      });
    }
  }
  return { nodes, edges, focused, visibleGates: gates.length, totalGates: snapshot.totalGates };
}
