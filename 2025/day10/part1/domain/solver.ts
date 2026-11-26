import {
  bitCount, Gf2LinearSystem, type Gf2Equation, type PuzzleSolver, type TraceOptions,
} from '../../../../shared/core';
import { FactoryMachine, parseMachines } from '../../shared';

export const DEFAULT_MAX_TRACE_STEPS = 120;

export interface MachineLightSolution {
  readonly machineIndex: number;
  readonly system: Gf2LinearSystem;
  readonly pressMask: bigint;
}

export interface MachineTraceFrame {
  readonly machineIndex: number;
  readonly totalMachines: number;
  readonly machine: FactoryMachine;
  readonly system: Gf2LinearSystem;
  readonly pressMask: bigint;
  readonly cumulativePresses: number;
  readonly isComplete: boolean;
}

/** Builds the GF(2) linear system `A x = targetLights` where each button is a binary variable. */
export function buildLightSystem(machine: FactoryMachine): Gf2LinearSystem {
  const buttonMasks = machine.buttonMasks;
  const equations: Gf2Equation[] = machine.targetLights.map((rhs, light) => {
    const lightBit = 1n << BigInt(light);
    let coeffMask = 0n;
    for (let b = 0; b < buttonMasks.length; b += 1) {
      if ((buttonMasks[b]! & lightBit) !== 0n) coeffMask |= 1n << BigInt(b);
    }
    return { coeffMask, rhs };
  });
  return new Gf2LinearSystem(machine.buttonCount, equations);
}

/** Finds the minimum-press button mask for one machine, or throws if unreachable. */
export function solveMachine(machine: FactoryMachine, machineIndex = 0): MachineLightSolution {
  const system = buildLightSystem(machine);
  const pressMask = system.minWeightSolution();
  if (pressMask === null) throw new Error(`Machine ${machineIndex} target lights are unreachable`);
  return Object.freeze({ machineIndex, system, pressMask });
}

/** Computes the minimum total button presses across all factory machines. */
export function solveFactoryLights(machines: readonly FactoryMachine[]): number {
  return machines.reduce((sum, m, i) => sum + bitCount(solveMachine(m, i).pressMask), 0);
}

/** Generates a bounded sequence of per-machine solve frames for interactive playback. */
export function traceFactoryLights(
  machines: readonly FactoryMachine[],
  options: TraceOptions = {},
): readonly MachineTraceFrame[] {
  const maxSteps = options.maxSteps ?? DEFAULT_MAX_TRACE_STEPS;
  if (!Number.isInteger(maxSteps) || maxSteps < 1) {
    throw new RangeError(`maxSteps must be an integer >= 1, got ${maxSteps}`);
  }
  const total = machines.length;
  if (total === 0) return Object.freeze([]);
  let cumulativePresses = 0;
  const all = machines.map((machine, machineIndex) => {
    const { system, pressMask } = solveMachine(machine, machineIndex);
    cumulativePresses += bitCount(pressMask);
    return Object.freeze({
      machineIndex, totalMachines: total, machine, system,
      pressMask, cumulativePresses, isComplete: machineIndex === total - 1,
    });
  });
  if (total <= maxSteps) return Object.freeze(all);
  if (maxSteps === 1) return Object.freeze([all[total - 1]!]);
  return Object.freeze(
    Array.from({ length: maxSteps }, (_, k) => all[Math.round((k * (total - 1)) / (maxSteps - 1))]!),
  );
}

export const solver: PuzzleSolver<readonly FactoryMachine[], number, MachineTraceFrame> = {
  parse: parseMachines,
  solve: solveFactoryLights,
  trace: traceFactoryLights,
};
