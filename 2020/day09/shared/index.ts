export {
  ENCRYPTION_WEAKNESS_POLICY,
  FIRST_INVALID_POLICY,
  type XmasAttackPolicy,
  type XmasAttackPolicyId,
} from './policy';
export { XmasAttackSolver } from './solver';
export { parseXmasStream, XmasStream } from './stream';
export {
  DEFAULT_MAX_TRACE_STEPS,
  PreambleScanFrame,
  tracePreambleScan,
  traceWeaknessAttack,
  WeaknessScanFrame,
  type XmasTraceFrame,
} from './trace';
export {
  computeSignalViewport,
  DEFAULT_VIEWPORT_SLOTS,
  SignalBar,
  SignalViewport,
} from './viewport';
export {
  buildContiguousWeakness,
  collectWeaknessSteps,
  ContiguousWeakness,
  findContiguousWeakness,
  iterateWeaknessWindow,
  WeaknessWindowStep,
} from './weakness';
export {
  collectPreambleChecks,
  findFirstInvalidStep,
  iterateWindowChecks,
  SumPairMatch,
  validatePreambleLength,
  WindowCheckStep,
} from './window';
