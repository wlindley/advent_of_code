import { type PuzzleSolver, type TraceOptions, validateMaxSteps } from '../../../../shared/core';
import {
  type CircuitBlueprint,
  CircuitSimulator,
  DEFAULT_MAX_TRACE_STEPS,
  parseCircuitBlueprint,
  type PulseEvent,
  type PulseTraceFrame,
  validatePositiveInt,
} from '../../shared';
import { FeederCycleTracker } from './cycles';
import { NOOP_OBSERVER, Part2TraceRecorder, type RxSearchObserver } from './trace';

export const TARGET_MODULE = 'rx';
export const MAX_CYCLE_SEARCH_PRESSES = 100_000;

/** Runs a single button press, reporting feeder high hits and the first low pulse to rx. */
export function runSinglePress(
  sim: CircuitSimulator,
  tracker: FeederCycleTracker | null,
  observer: RxSearchObserver,
): number | null {
  let directHitPress: number | null = null;
  const onPulse = (event: PulseEvent): void => {
    if (event.to === TARGET_MODULE && event.pulse === 'low') {
      if (directHitPress === null) {
        directHitPress = event.press;
        observer.onDirectHit(sim, event);
      }
    } else if (tracker !== null) {
      const hit = tracker.record(event);
      if (hit !== null) observer.onFeederHit(sim, event, hit, tracker);
    }
  };
  sim.pressButton(onPulse);
  return directHitPress;
}

/** Finds minimum presses for a low pulse to rx via direct hit or verified feeder-cycle LCM. */
export function runRxSearch(
  blueprint: CircuitBlueprint,
  maxPresses: number,
  observer: RxSearchObserver,
): bigint {
  const validatedMax = validatePositiveInt(maxPresses, 'maxPresses');
  if (!blueprint.hasModule(TARGET_MODULE)) {
    throw new Error(`Missing required target module "${TARGET_MODULE}"`);
  }
  const sim = new CircuitSimulator(blueprint);
  const tracker = FeederCycleTracker.forTarget(blueprint, TARGET_MODULE);
  observer.onInitial(sim, tracker);

  for (let press = 1; press <= validatedMax; press += 1) {
    const directHit = runSinglePress(sim, tracker, observer);
    if (directHit !== null) return BigInt(directHit);
    if (tracker !== null && tracker.isComplete) {
      const lcm = tracker.computeLcm();
      observer.onCyclesComplete(sim, tracker, lcm);
      return lcm;
    }
  }

  const detail = tracker !== null ? ` (feeder ${tracker.feeder}: ${tracker.formatPeriods()})` : '';
  throw new Error(`No low pulse to "${TARGET_MODULE}" within ${validatedMax} presses${detail}`);
}

/** Computes minimum button presses to deliver a low pulse to rx within maxPresses. */
export function findMinPressesForRx(blueprint: CircuitBlueprint, maxPresses: number): bigint {
  return runRxSearch(blueprint, maxPresses, NOOP_OBSERVER);
}

/** AoC 2023 Day 20 Part 2 solver: detects feeder cycle periods and returns their LCM. */
export const solver: PuzzleSolver<CircuitBlueprint, bigint, PulseTraceFrame> = {
  parse(raw: string): CircuitBlueprint {
    return parseCircuitBlueprint(raw);
  },

  solve(blueprint: CircuitBlueprint): bigint {
    return findMinPressesForRx(blueprint, MAX_CYCLE_SEARCH_PRESSES);
  },

  trace(blueprint: CircuitBlueprint, options?: TraceOptions): readonly PulseTraceFrame[] {
    const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
    const recorder = new Part2TraceRecorder();
    runRxSearch(blueprint, MAX_CYCLE_SEARCH_PRESSES, recorder);
    return recorder.finalize(maxSteps);
  },
};
