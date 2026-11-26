import { type TraceOptions, sampleTraceIndices, validateMaxSteps } from '../../../shared/core';
import { repairAdder } from './adderRepair';
import type { LogicCircuit, LogicGate } from './circuit';
import { assembleBusValue, evaluateCircuit } from './evaluator';
import type { WireBit, WireSwap } from './types';

export const DEFAULT_MAX_TRACE_STEPS = 48;

export type CircuitTracePhase = 'initial' | 'step' | 'complete';
export type CircuitTraceMode = 'evaluate' | 'repair';

/** Immutable visualization frame capturing circuit topology, settled wires, and swaps. */
export class CircuitSnapshot {
  readonly mode: CircuitTraceMode;
  readonly phase: CircuitTracePhase;
  readonly circuit: LogicCircuit;
  readonly evaluationOrder: readonly LogicGate[];
  readonly settledCount: number;
  readonly swaps: readonly WireSwap[];
  readonly targetSwapCount: number;

  constructor(
    mode: CircuitTraceMode,
    phase: CircuitTracePhase,
    circuit: LogicCircuit,
    evaluationOrder: readonly LogicGate[],
    settledCount: number,
    swaps: readonly WireSwap[],
    targetSwapCount: number,
  ) {
    if (!Number.isInteger(settledCount) || settledCount < 0 || settledCount > evaluationOrder.length) {
      throw new RangeError(`settledCount must be in [0, ${evaluationOrder.length}], got ${settledCount}`);
    }
    if (!Number.isInteger(targetSwapCount) || targetSwapCount < 0) {
      throw new RangeError(`targetSwapCount must be non-negative, got ${targetSwapCount}`);
    }
    this.mode = mode;
    this.phase = phase;
    this.circuit = circuit;
    this.evaluationOrder = Object.freeze([...evaluationOrder]);
    this.settledCount = settledCount;
    this.swaps = Object.freeze([...swaps]);
    this.targetSwapCount = targetSwapCount;
    Object.freeze(this);
  }

  get isComplete(): boolean { return this.phase === 'complete'; }
  get totalGates(): number { return this.circuit.gates.length; }
  get zBitCount(): number { return this.circuit.busBitWidth('z'); }
  get activeGate(): LogicGate | null {
    return this.settledCount === 0 ? null : this.evaluationOrder[this.settledCount - 1]!;
  }
  get activeSwap(): WireSwap | null {
    return this.swaps.length === 0 ? null : this.swaps[this.swaps.length - 1]!;
  }

  get wireValues(): ReadonlyMap<string, WireBit> {
    const values = new Map<string, WireBit>(this.circuit.initialWires);
    for (let i = 0; i < this.settledCount; i += 1) {
      const gate = this.evaluationOrder[i]!;
      values.set(gate.out, gate.evaluate(values.get(gate.in1)!, values.get(gate.in2)!));
    }
    return values;
  }

  get zValue(): bigint { return assembleBusValue(this.wireValues, 'z'); }

  get answer(): string {
    if (this.mode === 'evaluate') return this.zValue.toString();
    return this.swaps.flatMap((s) => [s.first, s.second]).sort().join(',');
  }
}

function tryEvalOrder(circuit: LogicCircuit): readonly LogicGate[] {
  try {
    return evaluateCircuit(circuit).evaluationOrder;
  } catch {
    return [];
  }
}

/** Builds a bounded trace of progressive gate evaluations in topological order. */
export function buildEvaluationTrace(
  circuit: LogicCircuit,
  options?: TraceOptions,
): readonly CircuitSnapshot[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const order = evaluateCircuit(circuit).evaluationOrder;
  const total = order.length;
  const complete = new CircuitSnapshot('evaluate', 'complete', circuit, order, total, [], 0);
  if (limit === 1) return Object.freeze([complete]);

  const frames: CircuitSnapshot[] = [new CircuitSnapshot('evaluate', 'initial', circuit, order, 0, [], 0)];
  if (total > 1 && limit > 2) {
    for (const idx of sampleTraceIndices(total - 1, limit - 2)) {
      frames.push(new CircuitSnapshot('evaluate', 'step', circuit, order, idx + 1, [], 0));
    }
  }
  frames.push(complete);
  return Object.freeze(frames);
}

/** Builds a bounded trace of progressive adder wire-swap repairs. */
export function buildRepairTrace(
  circuit: LogicCircuit,
  swapCount: number,
  options?: TraceOptions,
): readonly CircuitSnapshot[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const result = repairAdder(circuit, swapCount);
  const finalOrder = evaluateCircuit(result.repairedCircuit).evaluationOrder;
  const complete = new CircuitSnapshot(
    'repair', 'complete', result.repairedCircuit, finalOrder, finalOrder.length, result.swaps, swapCount,
  );
  if (result.swaps.length === 0 || limit === 1) return Object.freeze([complete]);

  const frames: CircuitSnapshot[] = [];
  for (const idx of sampleTraceIndices(result.swaps.length, limit - 1)) {
    const partialSwaps = result.swaps.slice(0, idx);
    const partialCircuit = idx === 0 ? circuit : circuit.withSwaps(partialSwaps);
    const order = tryEvalOrder(partialCircuit);
    frames.push(
      new CircuitSnapshot(
        'repair', idx === 0 ? 'initial' : 'step', partialCircuit, order, order.length, partialSwaps, swapCount,
      ),
    );
  }
  frames.push(complete);
  return Object.freeze(frames);
}
