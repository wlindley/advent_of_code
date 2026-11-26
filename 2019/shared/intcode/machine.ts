import { validateMaxSteps } from '../../../shared/core';
import { IntcodeMemory, type MemoryAccess } from './memory';
import type { ExecutionContext, OpcodeHandler, ParamOffset } from './opcodes';
import type { IntcodeProgram } from './program';

/** Execution lifecycle status of an Intcode VM instance. */
export type MachineStatus = 'running' | 'halted';

/** Recorded positional memory read performed while executing an opcode. */
export interface MemoryRead {
  readonly address: bigint;
  readonly value: bigint;
}

/** Recorded positional memory write with before/after cell values. */
export interface MemoryWrite {
  readonly address: bigint;
  readonly previousValue: bigint;
  readonly value: bigint;
}

/** Single executed instruction trace record emitted by IntcodeMachine.step(). */
export interface IntcodeStep {
  readonly stepIndex: number;
  readonly ipBefore: bigint;
  readonly ipAfter: bigint;
  readonly opcode: bigint;
  readonly mnemonic: string;
  readonly reads: readonly MemoryRead[];
  readonly write: MemoryWrite | null;
  readonly halted: boolean;
}

class StepRecorderContext implements ExecutionContext {
  private readonly memory: MemoryAccess;
  private readonly ipBefore: bigint;
  private nextIp: bigint;
  private haltedFlag = false;
  private readonly recordedReads: MemoryRead[] = [];
  private recordedWrite: MemoryWrite | null = null;

  constructor(memory: MemoryAccess, ipBefore: bigint) {
    this.memory = memory;
    this.ipBefore = ipBefore;
    this.nextIp = ipBefore;
  }

  get ipAfter(): bigint {
    return this.nextIp;
  }

  get isHalted(): boolean {
    return this.haltedFlag;
  }

  readParam(offset: ParamOffset): bigint {
    const pointer = this.memory.read(this.ipBefore + BigInt(offset));
    const value = this.memory.read(pointer);
    this.recordedReads.push(Object.freeze({ address: pointer, value }));
    return value;
  }

  writeParam(offset: ParamOffset, value: bigint): void {
    const pointer = this.memory.read(this.ipBefore + BigInt(offset));
    const previousValue = this.memory.read(pointer);
    this.memory.write(pointer, value);
    this.recordedWrite = Object.freeze({ address: pointer, previousValue, value });
  }

  advance(delta: bigint): void {
    this.nextIp = this.ipBefore + delta;
  }

  halt(): void {
    this.haltedFlag = true;
  }

  toStep(stepIndex: number, opcode: bigint, mnemonic: string): IntcodeStep {
    return Object.freeze({
      stepIndex,
      ipBefore: this.ipBefore,
      ipAfter: this.nextIp,
      opcode,
      mnemonic,
      reads: Object.freeze([...this.recordedReads]),
      write: this.recordedWrite,
      halted: this.haltedFlag,
    });
  }
}

/** Reusable steppable Intcode virtual machine parameterized by memory and opcode registry. */
export class IntcodeMachine {
  private readonly memory: MemoryAccess;
  private readonly opcodes: ReadonlyMap<bigint, OpcodeHandler>;
  private ipValue = 0n;
  private statusValue: MachineStatus = 'running';
  private executedSteps = 0;

  constructor(memory: MemoryAccess, opcodes: ReadonlyMap<bigint, OpcodeHandler>) {
    this.memory = memory;
    this.opcodes = opcodes;
  }

  static fromProgram(
    program: IntcodeProgram,
    opcodes: ReadonlyMap<bigint, OpcodeHandler>,
  ): IntcodeMachine {
    return new IntcodeMachine(new IntcodeMemory(program.cells), opcodes);
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

  readMemory(address: bigint): bigint {
    return this.memory.read(address);
  }

  snapshotMemory(): readonly bigint[] {
    return this.memory.snapshot();
  }

  step(): IntcodeStep {
    if (this.statusValue === 'halted') {
      throw new Error('Cannot step a halted Intcode machine');
    }
    const ipBefore = this.ipValue;
    const opcode = this.memory.read(ipBefore);
    const handler = this.opcodes.get(opcode);
    if (!handler) {
      throw new Error(`Unknown opcode ${opcode} at address ${ipBefore}`);
    }
    const ctx = new StepRecorderContext(this.memory, ipBefore);
    handler.execute(ctx);
    this.ipValue = ctx.ipAfter;
    if (ctx.isHalted) {
      this.statusValue = 'halted';
    }
    const stepIndex = this.executedSteps;
    this.executedSteps += 1;
    return ctx.toStep(stepIndex, opcode, handler.mnemonic);
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
