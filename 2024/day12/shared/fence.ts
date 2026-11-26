import { sampleTraceIndices, type TraceOptions, validateMaxSteps } from '../../../shared/core';
import type { GardenMap } from './map';
import { type GardenRegion, partitionGarden, type RegionPartition } from './regions';

export const DEFAULT_MAX_TRACE_STEPS = 80;

/** Strategy interface measuring a region's fence metric (perimeter or sides). */
export interface RegionFenceMetric {
  readonly id: string;
  readonly label: string;
  readonly unit: string;
  measure(map: GardenMap, partition: RegionPartition, region: GardenRegion): number;
}

/** Initializer fields for a `GardenTraceFrame`. */
export interface GardenTraceFrameInit {
  readonly regionOrder: number;
  readonly totalRegions: number;
  readonly regionId: number;
  readonly plant: string;
  readonly area: number;
  readonly metricValue: number;
  readonly runningTotal: number;
}

/** Immutable trace snapshot for one garden region evaluation step. */
export class GardenTraceFrame {
  readonly regionOrder: number;
  readonly totalRegions: number;
  readonly regionId: number;
  readonly plant: string;
  readonly area: number;
  readonly metricValue: number;
  readonly runningTotal: number;

  constructor(init: GardenTraceFrameInit) {
    this.regionOrder = init.regionOrder;
    this.totalRegions = init.totalRegions;
    this.regionId = init.regionId;
    this.plant = init.plant;
    this.area = init.area;
    this.metricValue = init.metricValue;
    this.runningTotal = init.runningTotal;
    Object.freeze(this);
  }

  get regionPrice(): number {
    return this.area * this.metricValue;
  }
}

/** Sums `region.area * metric.measure(...)` across all 4-connected regions in `map`. */
export function evaluateTotalFenceCost(map: GardenMap, metric: RegionFenceMetric): number {
  const partition = partitionGarden(map);
  let total = 0;
  for (const region of partition.regions) {
    total += region.area * metric.measure(map, partition, region);
  }
  return total;
}

/** Traces region pricing steps across `map`, uniformly sampled to at most `maxSteps` frames. */
export function traceGardenGroups(
  map: GardenMap,
  metric: RegionFenceMetric,
  options?: TraceOptions,
): readonly GardenTraceFrame[] {
  const partition = partitionGarden(map);
  const regions = partition.regions;
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sampledIndices = sampleTraceIndices(regions.length, limit);
  const frames: GardenTraceFrame[] = [];
  let runningTotal = 0;
  let sampleCursor = 0;

  for (let order = 0; order < regions.length; order += 1) {
    const region = regions[order]!;
    const metricValue = metric.measure(map, partition, region);
    runningTotal += region.area * metricValue;
    if (sampledIndices[sampleCursor] === order) {
      frames.push(
        new GardenTraceFrame({
          regionOrder: order,
          totalRegions: regions.length,
          regionId: region.id,
          plant: region.plant,
          area: region.area,
          metricValue,
          runningTotal,
        }),
      );
      sampleCursor += 1;
    }
  }
  return Object.freeze(frames);
}
