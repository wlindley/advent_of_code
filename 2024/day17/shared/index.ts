export {
  ChronospatialProgram,
  DEFAULT_MAX_EXECUTION_STEPS,
  DEFAULT_MAX_TRACE_STEPS,
  isThreeBitValue,
  VmRegisters,
  type DisassembledInstruction,
  type ExecutedAction,
  type OpcodeMnemonic,
  type OperandMode,
  type ThreeBitValue,
  type VmRunResult,
  type VmTraceFrame,
} from './types';
export {
  COMBO_RESOLVERS,
  disassembleProgram,
  formatOperand,
  OPCODE_TABLE,
  resolveCombo,
  type OpcodeSpec,
  type StepOutcome,
} from './opcodes';
export { parseChronospatialInput } from './parse';
export {
  formatOutput,
  runProgram,
  traceProgram,
  type VmRunOptions,
  type VmTraceOptions,
} from './vm';
