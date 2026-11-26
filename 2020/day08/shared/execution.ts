import type { BootInstruction } from './instruction';
import type { BootProgram } from './program';

/** Terminal state of executing a boot-code program until revisit or exit. */
export type HaltStatus = 'loop-detected' | 'terminated' | 'out-of-bounds';

function assertNonNegativeInt(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer, got ${value}`);
  }
}

/** Immutable record of one instruction execution with derived post-state getters. */
export class ExecutionStep {
  readonly stepIndex: number;
  readonly pc: number;
  readonly instruction: BootInstruction;
  readonly accBefore: bigint;

  constructor(
    stepIndex: number,
    pc: number,
    instruction: BootInstruction,
    accBefore: bigint,
  ) {
    assertNonNegativeInt(stepIndex, 'stepIndex');
    assertNonNegativeInt(pc, 'pc');
    this.stepIndex = stepIndex;
    this.pc = pc;
    this.instruction = instruction;
    this.accBefore = accBefore;
    Object.freeze(this);
  }

  get accAfter(): bigint {
    return this.instruction.nextAcc(this.accBefore);
  }

  get nextPc(): number {
    return this.instruction.nextPc(this.pc);
  }

  get isJump(): boolean {
    return this.instruction.opcode === 'jmp';
  }
}

/** Immutable trace and terminal summary for a full boot-program execution. */
export class ExecutionRun {
  readonly status: HaltStatus;
  readonly steps: readonly ExecutionStep[];

  constructor(status: HaltStatus, steps: readonly ExecutionStep[]) {
    if (steps.length === 0) {
      throw new Error('ExecutionRun must contain at least one step');
    }
    this.status = status;
    this.steps = Object.freeze([...steps]);
    Object.freeze(this);
  }

  get lastStep(): ExecutionStep {
    return this.steps[this.steps.length - 1]!;
  }

  get stepCount(): number {
    return this.steps.length;
  }

  get finalAccumulator(): bigint {
    return this.lastStep.accAfter;
  }

  get finalPc(): number {
    return this.lastStep.nextPc;
  }

  get loopTargetPc(): number | null {
    return this.status === 'loop-detected' ? this.finalPc : null;
  }
}

/** Executes a BootProgram from pc=0, acc=0n until a visited pc or exit bounds. */
export function executeBootProgram(program: BootProgram): ExecutionRun {
  const length = program.length;
  const visited = new Uint8Array(length);
  const steps: ExecutionStep[] = [];
  let pc = 0;
  let acc = 0n;

  while (pc >= 0 && pc < length) {
    if (visited[pc] === 1) {
      return new ExecutionRun('loop-detected', steps);
    }
    visited[pc] = 1;
    const step = new ExecutionStep(steps.length, pc, program.at(pc), acc);
    steps.push(step);
    pc = step.nextPc;
    acc = step.accAfter;
  }

  const status: HaltStatus = pc === length ? 'terminated' : 'out-of-bounds';
  return new ExecutionRun(status, steps);
}
