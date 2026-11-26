import { sampleTraceIndices, type TraceOptions, validateMaxSteps } from '../../../shared/core';
import type { CircuitBlueprint } from './blueprint';
import { CircuitSimulator } from './simulator';
import { type NodeStateSnapshot, type PulseEvent, validatePositiveInt } from './types';

export const DEFAULT_MAX_TRACE_STEPS = 200;

export interface PulseTraceFrame {
  readonly stepIndex: number;
  readonly totalRawSteps: number;
  readonly press: number;
  readonly activePulse: PulseEvent | null;
  readonly lowTotal: number;
  readonly highTotal: number;
  readonly nodeStates: Readonly<Record<string, NodeStateSnapshot>>;
  readonly highlightedNodes: readonly string[];
  readonly caption: string;
}

function countRawSteps(blueprint: CircuitBlueprint, pressCount: number): number {
  const sim = new CircuitSimulator(blueprint);
  sim.runPresses(pressCount);
  return 1 + sim.totalPulses;
}

function createPulseFrame(
  stepIndex: number,
  totalRawSteps: number,
  sim: CircuitSimulator,
  event: PulseEvent,
): PulseTraceFrame {
  return Object.freeze({
    stepIndex,
    totalRawSteps,
    press: event.press,
    activePulse: event,
    lowTotal: sim.totalLow,
    highTotal: sim.totalHigh,
    nodeStates: sim.snapshotModules(),
    highlightedNodes: Object.freeze([event.from, event.to]),
    caption: `Press ${event.press}: ${event.from} -${event.pulse}-> ${event.to}`,
  });
}

function collectSampledFrames(
  blueprint: CircuitBlueprint,
  pressCount: number,
  sampled: readonly number[],
  totalRawSteps: number,
): readonly PulseTraceFrame[] {
  const sim = new CircuitSimulator(blueprint);
  const frames: PulseTraceFrame[] = [];
  let cursor = 0;

  if (sampled[0] === 0) {
    frames.push(
      Object.freeze({
        stepIndex: 0,
        totalRawSteps,
        press: 0,
        activePulse: null,
        lowTotal: 0,
        highTotal: 0,
        nodeStates: sim.snapshotModules(),
        highlightedNodes: Object.freeze([]),
        caption: 'Initial circuit state (flip-flops OFF, conjunctions LOW)',
      }),
    );
    cursor += 1;
  }

  let rawStep = 0;
  sim.runPresses(pressCount, (event) => {
    rawStep += 1;
    if (rawStep === sampled[cursor]) {
      frames.push(createPulseFrame(rawStep, totalRawSteps, sim, event));
      cursor += 1;
    }
  });
  return Object.freeze(frames);
}

/** Builds a bounded two-pass sampled pulse trace without allocating unrendered snapshots. */
export function buildPulseTrace(
  blueprint: CircuitBlueprint,
  pressCount: number,
  options?: TraceOptions,
): readonly PulseTraceFrame[] {
  const presses = validatePositiveInt(pressCount, 'pressCount');
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const totalRawSteps = countRawSteps(blueprint, presses);
  const sampled = sampleTraceIndices(totalRawSteps, maxSteps);
  return collectSampledFrames(blueprint, presses, sampled, totalRawSteps);
}
