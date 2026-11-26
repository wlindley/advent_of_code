import { sampleTraceIndices, type TraceOptions, validateMaxSteps } from '../../../shared/core';
import { Chamber, type ChamberWindowSnapshot, type SettledRockSnapshot } from './chamber';
import type { JetPattern } from './jetPattern';
import type { RockShapeIndex } from './rocks';

/** Default cap on sampled frames returned by `traceTower`. */
export const DEFAULT_TRACE_MAX_STEPS = 120;

/** Number of top chamber rows included in each trace frame snapshot. */
export const TRACE_WINDOW_ROWS = 24;

export interface CycleSummary {
  readonly cycleStartRock: bigint;
  readonly cycleLength: bigint;
  readonly cycleHeightGain: bigint;
  readonly skippedCycles: bigint;
}

export interface SimulationResult {
  readonly targetRocks: bigint;
  readonly towerHeight: bigint;
  readonly simulatedDrops: number;
  readonly cycle: CycleSummary | null;
}

export interface PyroclasticTraceFrame {
  readonly step: number;
  readonly rockNumber: bigint;
  readonly targetRocks: bigint;
  readonly towerHeight: bigint;
  readonly chamberHeight: number;
  readonly nextRockIndex: RockShapeIndex;
  readonly nextJetIndex: number;
  readonly lastRock: SettledRockSnapshot | null;
  readonly window: ChamberWindowSnapshot;
  readonly cycle: CycleSummary | null;
}

interface SeenState {
  readonly dropped: bigint;
  readonly height: bigint;
}

class FrameCollector {
  private readonly indices: ReadonlySet<number>;
  private readonly targetRocks: bigint;
  readonly frames: PyroclasticTraceFrame[] = [];

  constructor(indices: ReadonlySet<number>, targetRocks: bigint) {
    this.indices = indices;
    this.targetRocks = targetRocks;
  }

  record(
    step: number,
    rockNumber: bigint,
    towerHeight: bigint,
    lastRock: SettledRockSnapshot | null,
    chamber: Chamber,
    cycle: CycleSummary | null,
  ): void {
    if (!this.indices.has(step)) return;
    this.frames.push(Object.freeze({
      step,
      rockNumber,
      targetRocks: this.targetRocks,
      towerHeight,
      chamberHeight: chamber.height,
      nextRockIndex: chamber.nextRockIndex,
      nextJetIndex: chamber.nextJetIndex,
      lastRock,
      window: chamber.snapshotWindow(TRACE_WINDOW_ROWS),
      cycle,
    }));
  }
}

function detectCycle(
  seen: Map<string, SeenState>,
  chamber: Chamber,
  dropped: bigint,
  targetRocks: bigint,
): CycleSummary | null {
  const key = chamber.stateKey();
  const height = BigInt(chamber.height);
  const prior = seen.get(key);
  if (prior === undefined) {
    seen.set(key, { dropped, height });
    return null;
  }
  const cycleLength = dropped - prior.dropped;
  const cycleHeightGain = height - prior.height;
  const skippedCycles = (targetRocks - dropped) / cycleLength;
  return Object.freeze({
    cycleStartRock: prior.dropped,
    cycleLength,
    cycleHeightGain,
    skippedCycles,
  });
}

function runSimulation(jets: JetPattern, targetRocks: bigint, collector?: FrameCollector): SimulationResult {
  if (targetRocks < 0n) {
    throw new RangeError(`targetRocks must be non-negative, got ${targetRocks}`);
  }
  const chamber = new Chamber(jets);
  const seen = new Map<string, SeenState>([[chamber.stateKey(), { dropped: 0n, height: 0n }]]);
  let dropped = 0n;
  let extraHeight = 0n;
  let simulatedDrops = 0;
  let cycle: CycleSummary | null = null;
  collector?.record(0, 0n, 0n, null, chamber, null);

  while (dropped < targetRocks) {
    const lastRock = chamber.dropNextRock();
    dropped += 1n;
    simulatedDrops += 1;
    if (cycle === null) {
      cycle = detectCycle(seen, chamber, dropped, targetRocks);
      if (cycle !== null) {
        dropped += cycle.skippedCycles * cycle.cycleLength;
        extraHeight += cycle.skippedCycles * cycle.cycleHeightGain;
      }
    }
    collector?.record(simulatedDrops, dropped, extraHeight + BigInt(chamber.height), lastRock, chamber, cycle);
  }
  return Object.freeze({ targetRocks, towerHeight: extraHeight + BigInt(chamber.height), simulatedDrops, cycle });
}

/** Simulates `targetRocks` falling rocks with reachable-cavity cycle detection. */
export function simulateTower(jets: JetPattern, targetRocks: bigint): SimulationResult {
  return runSimulation(jets, targetRocks);
}

/** Builds a uniformly sampled trace of chamber snapshots bounded by `options.maxSteps`. */
export function traceTower(
  jets: JetPattern,
  targetRocks: bigint,
  options?: TraceOptions,
): readonly PyroclasticTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_TRACE_MAX_STEPS);
  const summary = runSimulation(jets, targetRocks);
  const sampleIndices = new Set(sampleTraceIndices(summary.simulatedDrops + 1, limit));
  const collector = new FrameCollector(sampleIndices, targetRocks);
  runSimulation(jets, targetRocks, collector);
  return Object.freeze(collector.frames);
}
