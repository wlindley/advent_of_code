import type { Bitmask, DockingInstruction, WriteMemoryInstruction } from './model';

export type DecoderPolicyId = 'decoder-v1' | 'decoder-v2';

export interface MemoryEntry {
  readonly address: bigint;
  readonly value: bigint;
}

export interface StepWriteRecord {
  readonly address: bigint;
  readonly previousValue: bigint;
  readonly value: bigint;
}

export interface MemoryWriter {
  write(address: bigint, value: bigint): void;
}

/** Strategy interface governing how a docking decoder chip applies masks to memory writes. */
export interface DecoderChipPolicy {
  readonly id: DecoderPolicyId;
  readonly label: string;
  executeWrite(mask: Bitmask, instruction: WriteMemoryInstruction, memory: MemoryWriter): void;
  expectedWriteCount(mask: Bitmask): bigint;
}

/** Part 1 decoder policy: masks the written 36-bit value before storing at the literal address. */
export const DECODER_V1_POLICY: DecoderChipPolicy = Object.freeze({
  id: 'decoder-v1',
  label: 'Decoder v1 (Value Mask)',
  executeWrite(mask: Bitmask, instruction: WriteMemoryInstruction, memory: MemoryWriter): void {
    memory.write(instruction.address, mask.applyToValue(instruction.value));
  },
  expectedWriteCount(): bigint {
    return 1n;
  },
});

/** Part 2 decoder policy: expands floating address bits and writes raw value to every address. */
export const DECODER_V2_POLICY: DecoderChipPolicy = Object.freeze({
  id: 'decoder-v2',
  label: 'Decoder v2 (Address Mask)',
  executeWrite(mask: Bitmask, instruction: WriteMemoryInstruction, memory: MemoryWriter): void {
    for (const address of mask.expandedAddresses(instruction.address)) {
      memory.write(address, instruction.value);
    }
  },
  expectedWriteCount(mask: Bitmask): bigint {
    return mask.expandedAddressCount;
  },
});

export interface DockingTraceFrameInit {
  readonly policyId: DecoderPolicyId;
  readonly instructionIndex: number;
  readonly totalInstructions: number;
  readonly instruction: DockingInstruction;
  readonly activeMask: Bitmask;
  readonly writesInStep: number;
  readonly writePreview: readonly StepWriteRecord[];
  readonly recentMemory: readonly MemoryEntry[];
  readonly memorySum: bigint;
  readonly nonZeroCount: number;
}

function validateTraceBounds(init: DockingTraceFrameInit): void {
  if (!Number.isInteger(init.totalInstructions) || init.totalInstructions < 1) {
    throw new RangeError(`totalInstructions must be >= 1, got ${init.totalInstructions}`);
  }
  if (
    !Number.isInteger(init.instructionIndex) ||
    init.instructionIndex < 0 ||
    init.instructionIndex >= init.totalInstructions
  ) {
    throw new RangeError(
      `instructionIndex ${init.instructionIndex} out of bounds [0, ${init.totalInstructions - 1}]`,
    );
  }
  if (!Number.isInteger(init.writesInStep) || init.writesInStep < 0) {
    throw new RangeError(`writesInStep must be a non-negative integer, got ${init.writesInStep}`);
  }
}

/** Immutable trace snapshot captured at a sampled docking instruction step. */
export class DockingTraceFrame {
  readonly policyId: DecoderPolicyId;
  readonly instructionIndex: number;
  readonly totalInstructions: number;
  readonly instruction: DockingInstruction;
  readonly activeMask: Bitmask;
  readonly writesInStep: number;
  readonly writePreview: readonly StepWriteRecord[];
  readonly recentMemory: readonly MemoryEntry[];
  readonly memorySum: bigint;
  readonly nonZeroCount: number;

  constructor(init: DockingTraceFrameInit) {
    validateTraceBounds(init);
    this.policyId = init.policyId;
    this.instructionIndex = init.instructionIndex;
    this.totalInstructions = init.totalInstructions;
    this.instruction = init.instruction;
    this.activeMask = init.activeMask;
    this.writesInStep = init.writesInStep;
    this.writePreview = Object.freeze([...init.writePreview]);
    this.recentMemory = Object.freeze([...init.recentMemory]);
    this.memorySum = init.memorySum;
    this.nonZeroCount = init.nonZeroCount;
    Object.freeze(this);
  }

  get step(): number {
    return this.instructionIndex + 1;
  }

  get isFinal(): boolean {
    return this.instructionIndex === this.totalInstructions - 1;
  }

  get isWriteStep(): boolean {
    return this.instruction.kind === 'mem';
  }

  get truncatedWriteCount(): number {
    return Math.max(0, this.writesInStep - this.writePreview.length);
  }
}
