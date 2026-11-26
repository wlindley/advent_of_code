import { ceilDiv, floorDiv, Rational, type PuzzleSolver, type TraceOptions } from '../../../../shared/core';
import { FactoryMachine, parseMachines } from '../../shared';
import { RationalLinearSystem, type RationalEquation } from './linearSystem';

export const DEFAULT_MAX_TRACE_STEPS = 120;

export interface MachineJoltageSolution {
  readonly machineIndex: number;
  readonly system: RationalLinearSystem;
  readonly presses: readonly number[];
}

export interface MachineJoltageTraceFrame {
  readonly machineIndex: number;
  readonly totalMachines: number;
  readonly machine: FactoryMachine;
  readonly system: RationalLinearSystem;
  readonly presses: readonly number[];
  readonly cumulativePresses: number;
  readonly isComplete: boolean;
}

export const totalPresses = (presses: readonly number[]): number => presses.reduce((s, p) => s + p, 0);

/** Computes tight per-button upper bounds `min_{i in btn} target[i]`. */
export const buttonUpperBounds = (machine: FactoryMachine): readonly number[] =>
  Object.freeze(machine.buttons.map((btn) => Math.min(...btn.map((idx) => machine.joltageRequirements[idx]!))));

/** Builds `A x = joltageRequirements`, ordering widest-bounded buttons first so tight buttons become free. */
export function buildJoltageSystem(machine: FactoryMachine): RationalLinearSystem {
  const ub = buttonUpperBounds(machine);
  const pivotOrder = Array.from({ length: machine.buttonCount }, (_, b) => b).sort((a, b) => ub[b]! - ub[a]! || a - b);
  const equations: RationalEquation[] = machine.joltageRequirements.map((target, counter) => ({
    coeffs: machine.buttons.map((btn) => (btn.includes(counter) ? Rational.ONE : Rational.ZERO)),
    rhs: new Rational(BigInt(target)),
  }));
  return new RationalLinearSystem(machine.buttonCount, equations, pivotOrder);
}

/** Tightens `[lo, hi]` to satisfy `coeff * x <= maxRhs` via exact integer division. */
export function tightenBounds(lo: bigint, hi: bigint, coeff: bigint, maxRhs: bigint): readonly [bigint, bigint] {
  if (coeff > 0n) { const b = floorDiv(maxRhs, coeff); return [lo, b < hi ? b : hi]; }
  if (coeff < 0n) { const b = ceilDiv(-maxRhs, -coeff); return [b > lo ? b : lo, hi]; }
  return maxRhs < 0n ? [1n, 0n] : [lo, hi];
}

function suffixNegativeSlack(coeffs: readonly bigint[], ubs: readonly bigint[]): bigint[] {
  const s = new Array<bigint>(coeffs.length).fill(0n);
  for (let d = coeffs.length - 2; d >= 0; d -= 1) {
    s[d] = s[d + 1]! + (coeffs[d + 1]! < 0n ? -coeffs[d + 1]! * ubs[d + 1]! : 0n);
  }
  return s;
}

/** Finds the minimum-press non-negative integer solution for one machine, or throws if infeasible. */
export function solveMachineJoltage(machine: FactoryMachine, machineIndex = 0): MachineJoltageSolution {
  const system = buildJoltageSystem(machine);
  if (!system.consistent) throw new Error(`Machine ${machineIndex} joltage system is inconsistent`);
  const [pivots, obj, ub, K] = [system.toIntegerPivotEquations(), system.toIntegerObjectiveForm(), buttonUpperBounds(machine), system.nullity];
  if (K === 0) {
    const presses = new Array<number>(machine.buttonCount).fill(0);
    for (const eq of pivots) {
      if (eq.constant < 0n || eq.constant % eq.den !== 0n) throw new Error(`Machine ${machineIndex} infeasible`);
      presses[eq.pivotCol] = Number(eq.constant / eq.den);
    }
    return Object.freeze({ machineIndex, system, presses: Object.freeze(presses) });
  }
  // Visit narrowest free-variable domains first; precompute suffix slacks for negative coefficients.
  const freeOrder = Array.from({ length: K }, (_, k) => k).sort((a, b) => ub[system.freeColumns[a]!]! - ub[system.freeColumns[b]!]! || a - b);
  const ubs = freeOrder.map((k) => BigInt(ub[system.freeColumns[k]!]!));
  const weights = freeOrder.map((k) => obj.freeWeights[k]!);
  const coeffs = pivots.map((eq) => freeOrder.map((k) => eq.freeCoeffs[k]!));
  const [rowSlack, objSlack] = [coeffs.map((r) => suffixNegativeSlack(r, ubs)), suffixNegativeSlack(weights, ubs)];
  let bestTotal: bigint | null = null;
  const [bestFree, current] = [new Array<bigint>(K).fill(0n), new Array<bigint>(K).fill(0n)];
  const dfs = (d: number, rem: readonly bigint[], objSum: bigint): void => {
    let [lo, hi] = [0n, ubs[d]!];
    for (let i = 0; i < pivots.length && lo <= hi; i += 1) [lo, hi] = tightenBounds(lo, hi, coeffs[i]![d]!, rem[i]! + rowSlack[i]![d]!);
    const w = weights[d]!;
    if (bestTotal !== null && lo <= hi) [lo, hi] = tightenBounds(lo, hi, w, obj.den * (bestTotal - 1n) - objSum + objSlack[d]!);
    if (lo > hi) return;
    const [ascending, step] = [w >= 0n, w >= 0n ? 1n : -1n];
    // Leaf (d === K - 1) values are already non-negative and < bestTotal; first divisible hit is optimal.
    for (let v = ascending ? lo : hi; ascending ? v <= hi : v >= lo; v += step) {
      current[d] = v;
      if (d === K - 1) {
        if (!pivots.every((eq, i) => (rem[i]! - coeffs[i]![d]! * v) % eq.den === 0n)) continue;
        bestTotal = (objSum + w * v) / obj.den;
        for (let m = 0; m < K; m += 1) bestFree[freeOrder[m]!] = current[m]!;
        break;
      }
      dfs(d + 1, rem.map((r, i) => r - coeffs[i]![d]! * v), objSum + w * v);
      if (bestTotal !== null) [lo, hi] = tightenBounds(lo, hi, w, obj.den * (bestTotal - 1n) - objSum + objSlack[d]!);
    }
  };
  dfs(0, pivots.map((eq) => eq.constant), obj.constant);
  if (bestTotal === null) throw new Error(`Machine ${machineIndex} has no non-negative integer solution`);
  const presses = new Array<number>(machine.buttonCount).fill(0);
  for (let k = 0; k < K; k += 1) presses[system.freeColumns[k]!] = Number(bestFree[k]!);
  for (const eq of pivots) presses[eq.pivotCol] = Number(eq.freeCoeffs.reduce((num, c, k) => num - c * bestFree[k]!, eq.constant) / eq.den);
  return Object.freeze({ machineIndex, system, presses: Object.freeze(presses) });
}

/** Computes minimum total button presses across all factory machines. */
export const solveFactoryJoltages = (machines: readonly FactoryMachine[]): number =>
  machines.reduce((sum, m, i) => sum + totalPresses(solveMachineJoltage(m, i).presses), 0);

/** Generates a bounded trace of per-machine solve frames for interactive playback. */
export function traceFactoryJoltages(
  machines: readonly FactoryMachine[],
  options: TraceOptions = {},
): readonly MachineJoltageTraceFrame[] {
  const maxSteps = options.maxSteps ?? DEFAULT_MAX_TRACE_STEPS;
  if (!Number.isInteger(maxSteps) || maxSteps < 1) throw new RangeError(`Invalid maxSteps: ${maxSteps}`);
  const total = machines.length;
  if (total === 0) return Object.freeze([]);
  let cumulativePresses = 0;
  const all = machines.map((machine, machineIndex) => {
    const { system, presses } = solveMachineJoltage(machine, machineIndex);
    cumulativePresses += totalPresses(presses);
    return Object.freeze({ machineIndex, totalMachines: total, machine, system, presses, cumulativePresses, isComplete: machineIndex === total - 1 });
  });
  if (total <= maxSteps) return Object.freeze(all);
  if (maxSteps === 1) return Object.freeze([all[total - 1]!]);
  return Object.freeze(Array.from({ length: maxSteps }, (_, k) => all[Math.round((k * (total - 1)) / (maxSteps - 1))]!));
}

export const solver: PuzzleSolver<readonly FactoryMachine[], number, MachineJoltageTraceFrame> = {
  parse: parseMachines, solve: solveFactoryJoltages, trace: traceFactoryJoltages,
};
