import { executeBootProgram, type ExecutionRun } from './execution';
import type { BootInstruction } from './instruction';
import type { BootProgram } from './program';

/** Identifier for Day 8 diagnosis strategies. */
export type BootDiagnosisPolicyId = 'loop-accumulator' | 'repair-boot';

/** Immutable diagnosis pairing a possibly patched program with its execution run. */
export class BootDiagnosis {
  readonly policyId: BootDiagnosisPolicyId;
  readonly program: BootProgram;
  readonly run: ExecutionRun;
  readonly patchedIndex: number | null;

  constructor(
    policyId: BootDiagnosisPolicyId,
    program: BootProgram,
    run: ExecutionRun,
    patchedIndex: number | null,
  ) {
    if (patchedIndex !== null && !program.at(patchedIndex).isToggleable) {
      throw new Error(`Patched index ${patchedIndex} is not toggleable`);
    }
    this.policyId = policyId;
    this.program = program;
    this.run = run;
    this.patchedIndex = patchedIndex;
    Object.freeze(this);
  }

  get answer(): bigint {
    return this.run.finalAccumulator;
  }

  get patchedInstruction(): BootInstruction | null {
    return this.patchedIndex === null ? null : this.program.at(this.patchedIndex);
  }

  get originalPatchedInstruction(): BootInstruction | null {
    return this.patchedIndex === null ? null : this.program.at(this.patchedIndex).toggled();
  }
}

/** Strategy interface for diagnosing or repairing a boot-code program. */
export interface BootDiagnosisPolicy {
  readonly id: BootDiagnosisPolicyId;
  readonly label: string;
  readonly description: string;
  readonly metricLabel: string;
  diagnose(program: BootProgram): BootDiagnosis;
}

function buildTerminatingMask(program: BootProgram): Uint8Array {
  const n = program.length;
  const revHead = new Int32Array(n + 1).fill(-1);
  const revNext = new Int32Array(n).fill(-1);
  for (let i = 0; i < n; i += 1) {
    const target = program.at(i).nextPc(i);
    if (target >= 0 && target <= n) {
      revNext[i] = revHead[target]!;
      revHead[target] = i;
    }
  }
  const canTerminate = new Uint8Array(n + 1);
  const queue = new Int32Array(n + 1);
  let head = 0;
  let tail = 0;
  canTerminate[n] = 1;
  queue[tail++] = n;
  while (head < tail) {
    const node = queue[head++]!;
    for (let src = revHead[node]!; src !== -1; src = revNext[src]!) {
      canTerminate[src] = 1;
      queue[tail++] = src;
    }
  }
  return canTerminate;
}

function findRepairCandidates(
  initialRun: ExecutionRun,
  program: BootProgram,
  canTerminate: Uint8Array,
): number[] {
  const n = program.length;
  const candidates: number[] = [];
  for (const step of initialRun.steps) {
    const toggled = step.instruction.toggled();
    if (toggled === null) continue;
    const altTarget = toggled.nextPc(step.pc);
    if (altTarget >= 0 && altTarget <= n && canTerminate[altTarget] === 1) {
      candidates.push(step.pc);
    }
  }
  return candidates;
}

/** Part 1 policy: executes boot code and requires an infinite-loop halt. */
export const LOOP_ACCUMULATOR_POLICY: BootDiagnosisPolicy = Object.freeze({
  id: 'loop-accumulator',
  label: 'Loop Detection',
  description: 'Runs until a previously visited instruction is reached.',
  metricLabel: 'Accumulator before loop',
  diagnose(program: BootProgram): BootDiagnosis {
    const run = executeBootProgram(program);
    if (run.status !== 'loop-detected') {
      throw new Error(`Expected loop-detected status, got ${run.status}`);
    }
    return new BootDiagnosis('loop-accumulator', program, run, null);
  },
});

/** Part 2 policy: finds the unique jmp/nop repair in O(N) via reverse BFS from exit. */
export const REPAIR_BOOT_POLICY: BootDiagnosisPolicy = Object.freeze({
  id: 'repair-boot',
  label: 'Single-Instruction Repair',
  description: 'Finds the unique jmp/nop toggle that reaches normal termination.',
  metricLabel: 'Repaired accumulator',
  diagnose(program: BootProgram): BootDiagnosis {
    const initialRun = executeBootProgram(program);
    if (initialRun.status === 'terminated') {
      throw new Error('Program already terminates without repair');
    }
    const canTerminate = buildTerminatingMask(program);
    const candidates = findRepairCandidates(initialRun, program, canTerminate);
    if (candidates.length === 0) {
      throw new Error('No single-instruction repair reaches termination');
    }
    if (candidates.length > 1) {
      throw new Error(`Multiple repair candidates found: ${candidates.join(', ')}`);
    }
    const patchedProgram = program.withToggledAt(candidates[0]!);
    const repairedRun = executeBootProgram(patchedProgram);
    return new BootDiagnosis('repair-boot', patchedProgram, repairedRun, candidates[0]!);
  },
});
