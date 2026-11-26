import { validateMaxSteps } from '../../../shared/core';
import { BufferedIoChannel, type IoChannel } from './io';
import { IntcodeMemory, type MemoryAccess } from './memory';
import {
  COMPLETE_MODES,
  CORE_MODES,
  createModeRegistry,
  decodeOpcode,
  type CompleteParameterMode,
  type ParameterMode,
  type ParameterModeHandler,
} from './modes';
import { COMPLETE_OPCODES, createOpcodeRegistry, type OpcodeHandler } from './opcodes';
import type { IntcodeProgram } from './program';
import { SparseIntcodeMemory } from './sparseMemory';
import { StepRecorderContext, type DetailedIntcodeStep } from './stepContext';

export type { DecodedMemoryRead, MemoryRead } from './modes';
export type { DetailedIntcodeStep, IntcodeStep, MemoryWrite } from './stepContext';

/** Execution lifecycle status of an Intcode VM instance. */
export type MachineStatus = 'running' | 'waiting-input' | 'halted';

/** Optional configuration overrides for IntcodeMachine mode registry and I/O channel. */
export interface IntcodeMachineOptions<TMode extends string = ParameterMode> {
  readonly modes?: ReadonlyMap<bigint, ParameterModeHandler<TMode>>;
  readonly io?: IoChannel;
}

/** Optional I/O override for Day 9 complete Intcode machines. */
export interface CompleteMachineOptions {
  readonly io?: IoChannel;
}

const DEFAULT_MODE_REGISTRY = createModeRegistry(CORE_MODES);
const COMPLETE_MODE_REGISTRY = createModeRegistry(COMPLETE_MODES);
const COMPLETE_OPCODE_REGISTRY = createOpcodeRegistry(COMPLETE_OPCODES);

/** Reusable steppable Intcode virtual machine parameterized by memory, opcodes, modes, and I/O. */
export class IntcodeMachine<TMode extends string = ParameterMode> {
  private readonly memory: MemoryAccess;
  private readonly opcodes: ReadonlyMap<bigint, OpcodeHandler>;
  private readonly modes: ReadonlyMap<bigint, ParameterModeHandler<TMode>>;
  private readonly io: IoChannel;
  private ipValue = 0n;
  private relativeBaseValue = 0n;
  private statusValue: MachineStatus = 'running';
  private executedSteps = 0;

  constructor(
    memory: MemoryAccess,
    opcodes: ReadonlyMap<bigint, OpcodeHandler>,
    options?: IntcodeMachineOptions<TMode>,
  ) {
    this.memory = memory;
    this.opcodes = opcodes;
    this.modes = (options?.modes ?? DEFAULT_MODE_REGISTRY) as ReadonlyMap<bigint, ParameterModeHandler<TMode>>;
    this.io = options?.io ?? new BufferedIoChannel([]);
  }

  static fromProgram<TMode extends string = ParameterMode>(
    program: IntcodeProgram,
    opcodes: ReadonlyMap<bigint, OpcodeHandler>,
    options?: IntcodeMachineOptions<TMode>,
  ): IntcodeMachine<TMode> {
    return new IntcodeMachine(new IntcodeMemory(program.cells), opcodes, options);
  }

  static fromCompleteProgram(
    program: IntcodeProgram,
    options?: CompleteMachineOptions,
  ): IntcodeMachine<CompleteParameterMode> {
    return new IntcodeMachine<CompleteParameterMode>(
      new SparseIntcodeMemory(program.cells),
      COMPLETE_OPCODE_REGISTRY,
      { modes: COMPLETE_MODE_REGISTRY, io: options?.io },
    );
  }

  get ip(): bigint {
    return this.ipValue;
  }

  get relativeBase(): bigint {
    return this.relativeBaseValue;
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

  step(): DetailedIntcodeStep<TMode> {
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
    const ctx = new StepRecorderContext(
      this.memory,
      ipBefore,
      rawInstruction,
      this.modes,
      this.io,
      this.relativeBaseValue,
    );
    handler.execute(ctx);
    if (ctx.isWaitingForInput) {
      this.statusValue = 'waiting-input';
      return ctx.toStep(this.executedSteps, opcode, handler.mnemonic, handler.arity);
    }
    this.ipValue = ctx.ipAfter;
    this.relativeBaseValue = ctx.relativeBaseAfter;
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
