import type { TraceOptions } from '../../../shared/core';
import { AsteroidMap } from './asteroidMap';
import {
  type MonitorScanTraceFrame,
  type StationTraceFrame,
  type VaporizationTraceFrame,
  buildMonitorScanTrace,
  buildVaporizationTrace,
} from './trace';
import { analyzeVisibility, computeVaporizationSchedule } from './visibility';

/** Strategy policy selecting the answer metric and trace mode for an `AsteroidMap`. */
export interface MonitoringStationPolicy<
  TAnswer,
  TTrace extends StationTraceFrame = StationTraceFrame,
> {
  readonly id: string;
  readonly label: string;
  evaluate(map: AsteroidMap): TAnswer;
  formatAnswer(answer: TAnswer): string;
  trace(map: AsteroidMap, options?: TraceOptions): readonly TTrace[];
}

class BestMonitorPolicy implements MonitoringStationPolicy<number, MonitorScanTraceFrame> {
  readonly id = 'best-monitor';
  readonly label = 'Best Monitor Station';

  constructor() {
    Object.freeze(this);
  }

  evaluate(map: AsteroidMap): number {
    return analyzeVisibility(map).bestDetectedCount;
  }

  formatAnswer(answer: number): string {
    return String(answer);
  }

  trace(map: AsteroidMap, options?: TraceOptions): readonly MonitorScanTraceFrame[] {
    return buildMonitorScanTrace(map, options);
  }
}

class VaporizationTargetPolicy implements MonitoringStationPolicy<number, VaporizationTraceFrame> {
  readonly id: string;
  readonly label: string;
  private readonly targetOrder: number;

  constructor(targetOrder: number) {
    if (!Number.isInteger(targetOrder) || targetOrder < 1) {
      throw new RangeError(`targetOrder must be a positive integer, got ${targetOrder}`);
    }
    this.targetOrder = targetOrder;
    this.id = `vaporize-${targetOrder}`;
    this.label = `Vaporization #${targetOrder}`;
    Object.freeze(this);
  }

  evaluate(map: AsteroidMap): number {
    const analysis = analyzeVisibility(map);
    const schedule = computeVaporizationSchedule(map, analysis.bestIndex);
    if (this.targetOrder > schedule.length) {
      throw new RangeError(
        `Cannot find #${this.targetOrder} vaporized asteroid when only ${schedule.length} targets exist`,
      );
    }
    return schedule[this.targetOrder - 1]!.coordinateCode;
  }

  formatAnswer(answer: number): string {
    return String(answer);
  }

  trace(map: AsteroidMap, options?: TraceOptions): readonly VaporizationTraceFrame[] {
    return buildVaporizationTrace(map, this.targetOrder, options);
  }
}

/** Part 1 policy maximizing detected asteroids from a candidate monitoring station. */
export const BEST_MONITOR_POLICY: MonitoringStationPolicy<number, MonitorScanTraceFrame> =
  new BestMonitorPolicy();

/** Creates a Part 2 policy returning `x * 100 + y` of the `targetOrder`-th vaporized asteroid. */
export function createVaporizationTargetPolicy(
  targetOrder: number,
): MonitoringStationPolicy<number, VaporizationTraceFrame> {
  return new VaporizationTargetPolicy(targetOrder);
}

/** Part 2 policy targeting the 200th vaporized asteroid from the optimal station. */
export const VAPORIZATION_200TH_POLICY = createVaporizationTargetPolicy(200);
