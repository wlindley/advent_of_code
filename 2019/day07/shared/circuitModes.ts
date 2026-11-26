import type { IntcodeProgram } from '../../shared/intcode';
import { AmplifierStage } from './amplifierStage';
import {
  AMPLIFIER_LABELS,
  CircuitRunResult,
  INITIAL_THRUSTER_INPUT,
  type AmplifierCircuitMode,
  type StageTelemetry,
} from './circuitModels';

function buildStages(program: IntcodeProgram, phases: readonly bigint[]): readonly AmplifierStage[] {
  if (phases.length !== AMPLIFIER_LABELS.length) {
    throw new RangeError(`Expected ${AMPLIFIER_LABELS.length} phases, got ${phases.length}`);
  }
  const stages: AmplifierStage[] = [];
  for (let i = 0; i < AMPLIFIER_LABELS.length; i += 1) {
    stages.push(new AmplifierStage(AMPLIFIER_LABELS[i]!, phases[i]!, program));
  }
  stages[0]!.enqueueSignal(INITIAL_THRUSTER_INPUT);
  return Object.freeze(stages);
}

function forwardSignals(target: AmplifierStage, signals: readonly bigint[]): void {
  for (const signal of signals) {
    target.enqueueSignal(signal);
  }
}

function collectTelemetries(stages: readonly AmplifierStage[]): readonly StageTelemetry[] {
  const telemetries: StageTelemetry[] = [];
  for (const stage of stages) {
    telemetries.push(stage.toTelemetry());
  }
  return Object.freeze(telemetries);
}

function hasPendingStages(stages: readonly AmplifierStage[]): boolean {
  for (const stage of stages) {
    if (stage.status !== 'halted') {
      return true;
    }
  }
  return false;
}

function hasRunnableStage(stages: readonly AmplifierStage[]): boolean {
  for (const stage of stages) {
    if (stage.status === 'running') {
      return true;
    }
  }
  return false;
}

function evaluateSeries(
  program: IntcodeProgram,
  phases: readonly bigint[],
  maxStepsPerAmp: number,
): CircuitRunResult {
  const stages = buildStages(program, phases);
  for (let i = 0; i < stages.length; i += 1) {
    const stage = stages[i]!;
    const outputs = stage.runAndDrainOutputs(maxStepsPerAmp);
    if (stage.status !== 'halted') {
      throw new Error(`Series amplifier ${stage.label} paused (${stage.status}) without halting`);
    }
    if (outputs.length === 0) {
      throw new Error(`Series amplifier ${stage.label} produced no output`);
    }
    if (i < stages.length - 1) {
      forwardSignals(stages[i + 1]!, outputs);
    }
  }
  return new CircuitRunResult(phases, collectTelemetries(stages), 1);
}

function runFeedbackRound(stages: readonly AmplifierStage[], maxStepsPerAmp: number): void {
  for (let i = 0; i < stages.length; i += 1) {
    const outputs = stages[i]!.runAndDrainOutputs(maxStepsPerAmp);
    const nextStage = stages[(i + 1) % stages.length]!;
    if (nextStage.status !== 'halted') {
      forwardSignals(nextStage, outputs);
    }
  }
}

function evaluateFeedback(
  program: IntcodeProgram,
  phases: readonly bigint[],
  maxStepsPerAmp: number,
): CircuitRunResult {
  const stages = buildStages(program, phases);
  let rounds = 0;
  while (hasPendingStages(stages)) {
    if (!hasRunnableStage(stages)) {
      throw new Error('Feedback amplifier circuit deadlocked waiting for input');
    }
    rounds += 1;
    runFeedbackRound(stages, maxStepsPerAmp);
  }
  return new CircuitRunResult(phases, collectTelemetries(stages), rounds);
}

/** Part 1 non-looping 5-amplifier series chain for phase settings 0..4. */
export const SERIES_CIRCUIT_MODE: AmplifierCircuitMode = Object.freeze({
  id: 'series',
  name: 'Series Amplifier Chain',
  phaseSettings: Object.freeze([0n, 1n, 2n, 3n, 4n]),
  hasFeedbackLoop: false,
  evaluate: evaluateSeries,
});

/** Part 2 continuous E -> A feedback loop circuit for phase settings 5..9. */
export const FEEDBACK_LOOP_MODE: AmplifierCircuitMode = Object.freeze({
  id: 'feedback',
  name: 'Feedback Loop Circuit',
  phaseSettings: Object.freeze([5n, 6n, 7n, 8n, 9n]),
  hasFeedbackLoop: true,
  evaluate: evaluateFeedback,
});
