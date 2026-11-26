import type {
  CompleteParameterMode,
  DetailedIntcodeStep,
  SparseMemoryEntry,
} from '../../shared/intcode';

/** Default trace frame cap to keep Day 9 browser visualization responsive. */
export const DEFAULT_MAX_TRACE_STEPS = 160;

/** Safety execution cap to accommodate Part 1 and Part 2 BOOST programs. */
export const DEFAULT_MAX_MACHINE_STEPS = 2_000_000;

/** Supported Day 9 BOOST operating modes. */
export type BoostModeId = 'test' | 'sensor';

/** Immutable configuration describing a Day 9 BOOST operating mode. */
export interface BoostMode {
  readonly id: BoostModeId;
  readonly label: string;
  readonly inputSignal: bigint;
  readonly outputLabel: string;
}

/** Part 1 BOOST test mode configuration (input signal 1). */
export const BOOST_TEST_MODE: BoostMode = Object.freeze({
  id: 'test',
  label: 'BOOST Test',
  inputSignal: 1n,
  outputLabel: 'BOOST Keycode',
});

/** Part 2 Sensor Boost mode configuration (input signal 2). */
export const BOOST_SENSOR_MODE: BoostMode = Object.freeze({
  id: 'sensor',
  label: 'Sensor Boost',
  inputSignal: 2n,
  outputLabel: 'Distress Coordinates',
});

/** Immutable execution summary for a Day 9 BOOST program run. */
export class BoostReport {
  readonly mode: BoostMode;
  readonly outputs: readonly bigint[];
  readonly stepCount: number;
  readonly finalRelativeBase: bigint;
  readonly sparseEntryCount: number;

  constructor(
    mode: BoostMode,
    outputs: readonly bigint[],
    stepCount: number,
    finalRelativeBase: bigint,
    sparseEntryCount: number,
  ) {
    if (outputs.length === 0) {
      throw new Error('BOOST program halted without emitting any output');
    }
    this.mode = mode;
    this.outputs = Object.freeze([...outputs]);
    this.stepCount = stepCount;
    this.finalRelativeBase = finalRelativeBase;
    this.sparseEntryCount = sparseEntryCount;
    Object.freeze(this);
  }

  get outputCount(): number {
    return this.outputs.length;
  }

  get singleOutput(): boolean {
    return this.outputs.length === 1;
  }

  get hasDiagnosticErrors(): boolean {
    return this.outputs.length > 1;
  }

  get finalOutput(): bigint {
    return this.outputs[this.outputs.length - 1]!;
  }

  get diagnosticOutputs(): readonly bigint[] {
    return Object.freeze(this.outputs.slice(0, -1));
  }
}

/** Sampled execution frame captured for Day 9 interactive visualization. */
export interface BoostTraceFrame {
  readonly step: DetailedIntcodeStep<CompleteParameterMode>;
  readonly totalSteps: number;
  readonly relativeBaseBefore: bigint;
  readonly relativeBaseAfter: bigint;
  readonly memory: readonly bigint[];
  readonly sparseEntries: readonly SparseMemoryEntry[];
  readonly pendingInputs: readonly bigint[];
  readonly outputs: readonly bigint[];
}
