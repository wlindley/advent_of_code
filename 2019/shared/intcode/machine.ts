import { validateMaxSteps } from '../../../shared/core';
import { BufferedIoChannel, type IoChannel } from './io';
import { IntcodeMemory, type MemoryAccess } from './memory';
import {
  CORE_MODES,
  createModeRegistry,
  decodeOpcode,
  type ParameterModeHandler,
} from './modes';
import type { OpcodeHandler } from './opcodes';
import type { IntcodeProgram } from './program';
import { StepRecorderContext, type DetailedIntcodeStep } from './stepContext';

export type { DecodedMemoryRead, MemoryRead } from './modes';
export type { DetailedIntcodeStep, IntcodeStep, MemoryWrite } from './stepContext';

/** Execution lifecycle status of an Intcode VM instance. */
export type MachineStatus = 'running' | 'waiting-input' | 'halted';

/** Optional configuration overrides for IntcodeMachine mode registry and I/O channel. */
export interface IntcodeMachineOptions {
  readonly modes?: ReadonlyMap<bigint, ParameterModeHandler>;
  readonly io?: IoChannel;
}

const DEFAULT_MODE_REGISTRY = createModeRegistry(CORE_MODES);

/** Reusable steppable Intcode virtual machine parameterized by memory, opcodes, modes, and I/O. */
export class IntcodeMachine {
  private readonly memory: MemoryAccess;
  private readonly opcodes: ReadonlyMap<bigint, OpcodeHandler>;
  private readonly modes: ReadonlyMap<bigint, ParameterModeHandler>;
  private readonly io: IoChannel;
  private ipValue = 0n;
  private statusValue: MachineStatus = 'running';
  private executedSteps = 0;

  constructor(
    memory: MemoryAccess,
    opcodes: ReadonlyMap<bigint, OpcodeHandler>,
    options?: IntcodeMachineOptions,
  ) {
    this.memory = memory;
    this.opcodes = opcodes;
    this.modes = options?.modes ?? DEFAULT_MODE_REGISTRY;
    this.io = options?.io ?? new BufferedIoChannel([]);
  }

  static fromProgram(
    program: IntcodeProgram,
    opcodes: ReadonlyMap<bigint, OpcodeHandler>,
    options?: IntcodeMachineOptions,
  ): IntcodeMachine {
    return new IntcodeMachine(new IntcodeMemory(program.cells), opcodes, options);
  }

  get ip(): bigint {
    return this.ipValue;
  }

  get status(): MachineStatus {
    return this.statusValue;
  }

  get stepCount(): number {
    return this.executedSteps;
  }

  get pendingInputCount(): number {
    return this.io.pendingInputCount;
  }

  get outputCount(): number {
    return this.io.outputCount;
  }

  pushInput(value: bigint): void {
    this.io.pushInput(value);
    if (this.statusValue === 'waiting-input') {
      this.statusValue = 'running';
    }
  }

  readMemory(address: bigint): bigint {
    return this.memory.read(address);
  }

  snapshotMemory(): readonly bigint[] {
    return this.memory.snapshot();
  }

  snapshotInputs(): readonly bigint[] {
    return this.io.snapshotInputs();
  }

  snapshotOutputs(): readonly bigint[] {
    return this.io.snapshotOutputs();
  }

  step(): DetailedIntcodeStep {
    if (this.statusValue !== 'running') {
      throw new Error(`Cannot step Intcode machine with status "${this.statusValue}"`);
    }
    const ipBefore = this.ipValue;
    const rawInstruction = this.memory.read(ipBefore);
    const opcode = decodeOpcode(rawInstruction);
    const handler = this.opcodes.get(opcode);
    if (!handler) {
      throw new Error(`Unknown opcode ${opcode} at address ${ipBefore}`);
    }
    const ctx = new StepRecorderContext(this.memory, ipBefore, rawInstruction, this.modes, this.io);
    handler.execute(ctx);
    if (ctx.isWaitingForInput) {
      this.statusValue = 'waiting-input';
      return ctx.toStep(this.executedSteps, opcode, handler.mnemonic, handler.arity);
    }
    this.ipValue = ctx.ipAfter;
    if (ctx.isHalted) {
      this.statusValue = 'halted';
    }
    const stepIndex = this.executedSteps;
    this.executedSteps += 1;
    return ctx.toStep(stepIndex, opcode, handler.mnemonic, handler.arity);
  }

  run(maxSteps: number): number {
    const limit = validateMaxSteps(maxSteps, maxSteps);
    while (this.statusValue === 'running') {
      if (this.executedSteps >= limit) {
        throw new RangeError(`Intcode machine exceeded step limit of ${limit}`);
      }
      this.step();
    }
    return this.executedSteps;
  }
}
