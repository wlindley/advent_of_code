export {
  assertUint36,
  Bitmask,
  DockingProgram,
  MAX_FLOATING_BITS,
  parseDockingProgram,
  WORD_BITS,
  WORD_MASK,
  type DockingInstruction,
  type MaskChar,
  type SetMaskInstruction,
  type WriteMemoryInstruction,
} from './model';
export {
  DECODER_V1_POLICY,
  DECODER_V2_POLICY,
  DockingTraceFrame,
  type DecoderChipPolicy,
  type DecoderPolicyId,
  type DockingTraceFrameInit,
  type MemoryEntry,
  type MemoryWriter,
  type StepWriteRecord,
} from './policies';
export {
  formatInstructionLabel,
  formatUint36Binary,
  projectBitGateColumns,
  projectStepSummary,
  type BitGateColumn,
  type BitGateRole,
  type StepLedgerSummary,
} from './projection';
export {
  DEFAULT_MAX_TRACE_STEPS,
  DockingSolver,
  MAX_MEMORY_SNAPSHOT,
  MAX_PREVIEW_WRITES,
  MemoryBank,
  TraceMemoryBank,
} from './solver';
