import {
  sampleTraceIndices,
  validateMaxSteps,
  type PuzzleSolver,
  type TraceOptions,
} from '../../../shared/core';
import { DockingProgram, parseDockingProgram } from './model';
import {
  DockingTraceFrame,
  type DecoderChipPolicy,
  type MemoryEntry,
  type MemoryWriter,
  type StepWriteRecord,
} from './policies';

export const DEFAULT_MAX_TRACE_STEPS = 200;
export const MAX_PREVIEW_WRITES = 8;
export const MAX_MEMORY_SNAPSHOT = 12;

/** Sparse BigInt memory bank storing only non-zero 36-bit cells while maintaining an exact sum. */
export class MemoryBank implements MemoryWriter {
  private readonly cells = new Map<bigint, bigint>();
  private total = 0n;

  write(address: bigint, value: bigint): void {
    const prev = this.cells.get(address) ?? 0n;
    if (value === 0n) {
      this.cells.delete(address);
    } else {
      this.cells.set(address, value);
    }
    this.total += value - prev;
  }

  read(address: bigint): bigint {
    return this.cells.get(address) ?? 0n;
  }

  get sum(): bigint {
    return this.total;
  }

  get nonZeroCount(): number {
    return this.cells.size;
  }
}

/** MemoryWriter wrapper that maintains bounded step-write previews and an O(1) MRU snapshot. */
export class TraceMemoryBank implements MemoryWriter {
  private readonly bank = new MemoryBank();
  private readonly recent = new Map<bigint, bigint>();
  private recordPreview = false;
  private preview: StepWriteRecord[] = [];
  private stepWriteCount = 0;

  beginStep(recordPreview: boolean): void {
    this.recordPreview = recordPreview;
    this.preview = [];
    this.stepWriteCount = 0;
  }

  write(address: bigint, value: bigint): void {
    const previousValue = this.bank.read(address);
    this.bank.write(address, value);
    this.stepWriteCount += 1;
    if (this.recordPreview && this.preview.length < MAX_PREVIEW_WRITES) {
      this.preview.push(Object.freeze({ address, previousValue, value }));
    }
    this.recent.delete(address);
    if (value !== 0n) {
      this.recent.set(address, value);
      if (this.recent.size > MAX_MEMORY_SNAPSHOT) {
        this.recent.delete(this.recent.keys().next().value as bigint);
      }
    }
  }

  snapshotRecent(): readonly MemoryEntry[] {
    const entries: MemoryEntry[] = [];
    for (const [address, value] of this.recent) {
      entries.push(Object.freeze({ address, value }));
    }
    entries.reverse();
    return Object.freeze(entries);
  }

  get writesInStep(): number {
    return this.stepWriteCount;
  }

  get writePreview(): readonly StepWriteRecord[] {
    return this.preview;
  }

  get sum(): bigint {
    return this.bank.sum;
  }

  get nonZeroCount(): number {
    return this.bank.nonZeroCount;
  }
}

/** Shared `PuzzleSolver` parameterized by a Day 14 `DecoderChipPolicy`. */
export class DockingSolver implements Required<PuzzleSolver<DockingProgram, bigint, DockingTraceFrame>> {
  readonly policy: DecoderChipPolicy;

  constructor(policy: DecoderChipPolicy) {
    this.policy = policy;
    Object.freeze(this);
  }

  parse(raw: string): DockingProgram {
    return parseDockingProgram(raw);
  }

  solve(input: DockingProgram): bigint {
    const memory = new MemoryBank();
    let activeMask = input.initialMask;
    for (const instr of input.instructions) {
      if (instr.kind === 'mask') {
        activeMask = instr.mask;
      } else {
        this.policy.executeWrite(activeMask, instr, memory);
      }
    }
    return memory.sum;
  }

  trace(input: DockingProgram, options?: TraceOptions): readonly DockingTraceFrame[] {
    const maxSteps = validateMaxSteps(
      options === undefined ? undefined : options.maxSteps,
      DEFAULT_MAX_TRACE_STEPS,
    );
    const sampleIndices = sampleTraceIndices(input.length, maxSteps);
    const memory = new TraceMemoryBank();
    const frames: DockingTraceFrame[] = [];
    let activeMask = input.initialMask;
    let sampleCursor = 0;

    for (let i = 0; i < input.instructions.length; i += 1) {
      const instr = input.instructions[i]!;
      const sampled = sampleIndices[sampleCursor] === i;
      memory.beginStep(sampled);
      if (instr.kind === 'mask') {
        activeMask = instr.mask;
      } else {
        this.policy.executeWrite(activeMask, instr, memory);
      }
      if (sampled) {
        frames.push(buildTraceFrame(this.policy.id, i, input.length, instr, activeMask, memory));
        sampleCursor += 1;
      }
    }
    return Object.freeze(frames);
  }
}

function buildTraceFrame(
  policyId: DecoderChipPolicy['id'],
  instructionIndex: number,
  totalInstructions: number,
  instruction: DockingProgram['instructions'][number],
  activeMask: DockingProgram['initialMask'],
  memory: TraceMemoryBank,
): DockingTraceFrame {
  return new DockingTraceFrame({
    policyId,
    instructionIndex,
    totalInstructions,
    instruction,
    activeMask,
    writesInStep: memory.writesInStep,
    writePreview: memory.writePreview,
    recentMemory: memory.snapshotRecent(),
    memorySum: memory.sum,
    nonZeroCount: memory.nonZeroCount,
  });
}
