import { validateMaxSteps } from '../../../shared/core';
import { IntcodeMachine, type IntcodeProgram } from '../../shared/intcode';
import { SpringdroidAsciiIo } from './asciiIo';
import type { SpringscriptProgram } from './springscript';

export const DEFAULT_MAX_VM_STEPS = 2_000_000;

export interface SpringdroidRunResult {
  readonly asciiLog: string;
  readonly hullDamage: bigint | null;
  readonly vmSteps: number;
}

/** Runs an Intcode Springdroid VM with a Springscript program and captures ASCII + damage output. */
export function runSpringdroidProgram(
  program: IntcodeProgram,
  script: SpringscriptProgram,
  maxVmSteps?: number,
): SpringdroidRunResult {
  const limit = validateMaxSteps(maxVmSteps, DEFAULT_MAX_VM_STEPS);
  const io = new SpringdroidAsciiIo();
  io.pushAscii(script.toAscii());
  const machine = IntcodeMachine.fromCompleteProgram(program, { io });
  const vmSteps = machine.run(limit);
  if (machine.status !== 'halted') {
    throw new Error(`Intcode machine stopped with status "${machine.status}" instead of halting`);
  }
  const { asciiLog, hullDamage } = io.drainSpringdroidOutput();
  return Object.freeze({ asciiLog, hullDamage, vmSteps });
}

/** Extracts hull damage or throws an explanatory error containing the droid ASCII log. */
export function extractHullDamage(result: SpringdroidRunResult): bigint {
  if (result.hullDamage === null) {
    const detail = result.asciiLog.trim();
    throw new Error(detail.length > 0 ? detail : 'Springdroid did not report hull damage');
  }
  return result.hullDamage;
}
