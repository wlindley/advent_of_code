import { validateMaxSteps } from '../../../shared/core';
import { IntcodeMachine, type IntcodeProgram } from '../../shared/intcode';
import { AsciiIoChannel, type AsciiDustOutput } from './asciiIo';
import type { RoutinePlan } from './routineCompressor';
import { ScaffoldMap } from './scaffoldMap';

/** Default VM instruction budget for a single Day 17 Intcode execution. */
export const DEFAULT_MAX_VM_STEPS = 2_000_000;

/** Execution limits applied when running Day 17 camera or dust collection VMs. */
export interface ScaffoldExecutionLimits {
  readonly maxVmSteps: number;
}

/** Default VM step limit configuration for Day 17 solvers. */
export const DEFAULT_SCAFFOLD_LIMITS: ScaffoldExecutionLimits = Object.freeze({
  maxVmSteps: DEFAULT_MAX_VM_STEPS,
});

/** Output payload produced by a Part 2 vacuum dust collection run. */
export type DustCollectionResult = AsciiDustOutput;

function runProgramToHalt(
  program: IntcodeProgram,
  io: AsciiIoChannel,
  maxVmSteps: number | undefined,
): AsciiIoChannel {
  const limit = validateMaxSteps(maxVmSteps, DEFAULT_MAX_VM_STEPS);
  const machine = IntcodeMachine.fromCompleteProgram(program, { io });
  machine.run(limit);
  if (machine.status !== 'halted') {
    throw new Error(`Intcode machine stopped with status "${machine.status}" instead of halting`);
  }
  return io;
}

/** Captures the ASCII camera frame from an unmodified Day 17 Intcode program. */
export function captureScaffoldMap(program: IntcodeProgram, maxVmSteps?: number): ScaffoldMap {
  const io = runProgramToHalt(program, new AsciiIoChannel(), maxVmSteps);
  return ScaffoldMap.fromAscii(io.drainAscii());
}

/** Patches address 0 to 2, feeds ASCII routines, and collects the dust output from the VM. */
export function runDustCollection(
  program: IntcodeProgram,
  plan: RoutinePlan,
  maxVmSteps?: number,
): DustCollectionResult {
  const patched = program.withPatches([{ address: 0n, value: 2n }]);
  const io = new AsciiIoChannel();
  io.pushAscii(plan.toAsciiProgram(false));
  runProgramToHalt(patched, io, maxVmSteps);
  return io.drainDustOutput();
}
