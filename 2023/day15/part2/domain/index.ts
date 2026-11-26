export {
  assertValidFocalLength,
  assertValidLensLabel,
  LensBoxSnapshot,
  LensEntry,
  OpticalBench,
  type LensMutationOutcome,
} from './bench';
export {
  parseLensInstruction,
  parseLensInstructions,
  RemoveLensInstruction,
  UpsertLensInstruction,
  type LensInstruction,
} from './instruction';
export { solveFocusingPower, solver } from './solver';
export {
  DEFAULT_MAX_TRACE_STEPS,
  HashmapTraceFrame,
  traceHashmapSequence,
} from './trace';
