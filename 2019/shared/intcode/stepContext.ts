import type { IoChannel } from './io';
import type { MemoryAccess } from './memory';
import {
  extractModeCode,
  type DecodedMemoryRead,
  type MemoryRead,
  type ParameterMode,
  type ParameterModeHandler,
} from './modes';
import type { ExecutionContext, OpcodeArity, ParamOffset } from './opcodes';

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

/** Extended step trace record with decoded parameter modes and I/O telemetry. */
export interface DetailedIntcodeStep<TMode extends string = ParameterMode> extends IntcodeStep {
  readonly rawInstruction: bigint;
  readonly arity: OpcodeArity;
  readonly reads: readonly DecodedMemoryRead<TMode>[];
  readonly inputConsumed: bigint | null;
  readonly outputEmitted: bigint | null;
  readonly waitingForInput: boolean;
}

/** Per-step ExecutionContext that decodes modes, enforces write rules, and records telemetry. */
export class StepRecorderContext<TMode extends string = ParameterMode> implements ExecutionContext {
  private readonly memory: MemoryAccess;
  private readonly ipBefore: bigint;
  private readonly rawInstruction: bigint;
  private readonly modes: ReadonlyMap<bigint, ParameterModeHandler<TMode>>;
  private readonly io: IoChannel;
  private nextRelativeBase: bigint;
  private nextIp: bigint;
  private haltedFlag = false;
  private waitingFlag = false;
  private readonly recordedReads: DecodedMemoryRead<TMode>[] = [];
  private recordedWrite: MemoryWrite | null = null;
  private consumedInput: bigint | null = null;
  private emittedOutput: bigint | null = null;

  constructor(
    memory: MemoryAccess,
    ipBefore: bigint,
    rawInstruction: bigint,
    modes: ReadonlyMap<bigint, ParameterModeHandler<TMode>>,
    io: IoChannel,
    relativeBaseBefore: bigint,
  ) {
    this.memory = memory;
    this.ipBefore = ipBefore;
    this.rawInstruction = rawInstruction;
    this.modes = modes;
    this.io = io;
    this.nextRelativeBase = relativeBaseBefore;
    this.nextIp = ipBefore;
  }

  get ipAfter(): bigint {
    return this.nextIp;
  }

  get relativeBaseAfter(): bigint {
    return this.nextRelativeBase;
  }

  get isHalted(): boolean {
    return this.haltedFlag;
  }

  get isWaitingForInput(): boolean {
    return this.waitingFlag;
  }

  private resolveMode(offset: ParamOffset): ParameterModeHandler<TMode> {
    const modeCode = extractModeCode(this.rawInstruction, offset);
    const handler = this.modes.get(modeCode);
    if (!handler) {
      throw new Error(`Unknown parameter mode ${modeCode} at address ${this.ipBefore}`);
    }
    return handler;
  }

  private resolveWriteAddress(offset: ParamOffset): bigint {
    return this.resolveMode(offset).resolveWriteAddress(
      this.memory,
      this.ipBefore + BigInt(offset),
      this.nextRelativeBase,
    );
  }

  readParam(offset: ParamOffset): bigint {
    const handler = this.resolveMode(offset);
    const resolved = handler.read(
      this.memory,
      this.ipBefore + BigInt(offset),
      this.nextRelativeBase,
    );
    this.recordedReads.push(
      Object.freeze({
        address: resolved.address,
        rawParam: resolved.rawParam,
        value: resolved.value,
        mode: handler.mode,
      }),
    );
    return resolved.value;
  }

  assertWritable(offset: ParamOffset): void {
    this.resolveWriteAddress(offset);
  }

  writeParam(offset: ParamOffset, value: bigint): void {
    const address = this.resolveWriteAddress(offset);
    const previousValue = this.memory.read(address);
    this.memory.write(address, value);
    this.recordedWrite = Object.freeze({ address, previousValue, value });
  }

  advance(delta: bigint): void {
    this.nextIp = this.ipBefore + delta;
  }

  jump(targetAddress: bigint): void {
    this.nextIp = targetAddress;
  }

  readInput(): bigint | null {
    const value = this.io.readInput();
    if (value !== null) {
      this.consumedInput = value;
    }
    return value;
  }

  writeOutput(value: bigint): void {
    this.io.writeOutput(value);
    this.emittedOutput = value;
  }

  adjustRelativeBase(delta: bigint): void {
    this.nextRelativeBase += delta;
  }

  waitForInput(): void {
    this.waitingFlag = true;
  }

  halt(): void {
    this.haltedFlag = true;
  }

  toStep(
    stepIndex: number,
    opcode: bigint,
    mnemonic: string,
    arity: OpcodeArity,
  ): DetailedIntcodeStep<TMode> {
    return Object.freeze({
      stepIndex,
      ipBefore: this.ipBefore,
      ipAfter: this.nextIp,
      rawInstruction: this.rawInstruction,
      opcode,
      mnemonic,
      arity,
      reads: Object.freeze([...this.recordedReads]),
      write: this.recordedWrite,
      inputConsumed: this.consumedInput,
      outputEmitted: this.emittedOutput,
      waitingForInput: this.waitingFlag,
      halted: this.haltedFlag,
    });
  }
}
