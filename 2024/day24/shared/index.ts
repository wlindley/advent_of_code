export {
  type BusPrefix,
  type GateOp,
  WIRE_NAME_PATTERN,
  type WireBit,
  WireSwap,
  assertValidWireName,
  formatBitWire,
  parseBitWire,
} from './types';
export { LogicCircuit, LogicGate, parseCircuit } from './circuit';
export {
  CircuitEvaluation,
  assembleBusValue,
  buildWireGraph,
  evaluateCircuit,
} from './evaluator';
export {
  type CompiledAdderCircuit,
  evaluateCompiledAdder,
  tryCompileAdder,
  verifyAdderFunctionally,
} from './adderVerify';
export { type AdderRepairResult, repairAdder } from './adderRepair';
export {
  CircuitSnapshot,
  type CircuitTraceMode,
  type CircuitTracePhase,
  DEFAULT_MAX_TRACE_STEPS,
  buildEvaluationTrace,
  buildRepairTrace,
} from './snapshot';
