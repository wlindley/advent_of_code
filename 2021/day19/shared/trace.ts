import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../shared/core';
import { alignScanners, TrenchMap } from './aligner';
import type { BeaconScannerPolicy } from './policy';
import {
  computeProjectionBounds,
  projectTrenchSnapshot,
  type ProjectionBounds,
  type TrenchProjection,
} from './projection';
import type { AlignedScanner, ScannerReport } from './scanner';
import type { Vec3 } from './vec3';

/** Default frame cap applied when tracing beacon scanner alignment. */
export const DEFAULT_MAX_TRACE_STEPS = 48;

/** Single bounded trace frame capturing progressive scanner alignment and 3D projection. */
export interface BeaconTraceFrame {
  readonly stepIndex: number;
  readonly rawIndex: number;
  readonly totalRawSteps: number;
  readonly activeScanner: AlignedScanner;
  readonly alignedScanners: readonly AlignedScanner[];
  readonly beacons: readonly Vec3[];
  readonly projection: TrenchProjection;
  readonly newlyAddedCount: number;
  readonly metricValue: number;
  readonly isComplete: boolean;
}

function computeNewlyAddedPerStep(
  scanners: readonly AlignedScanner[],
): readonly ReadonlySet<string>[] {
  const seen = new Set<string>();
  const addedPerStep: ReadonlySet<string>[] = [];
  for (const scanner of scanners) {
    const added = new Set<string>();
    for (const beacon of scanner.beacons) {
      if (!seen.has(beacon.key)) {
        seen.add(beacon.key);
        added.add(beacon.key);
      }
    }
    addedPerStep.push(added);
  }
  return addedPerStep;
}

function buildTraceFrame(
  stepIndex: number,
  rawIndex: number,
  fullMap: TrenchMap,
  bounds: ProjectionBounds,
  addedPerStep: readonly ReadonlySet<string>[],
  policy: BeaconScannerPolicy,
): BeaconTraceFrame {
  const scannersPrefix = fullMap.scanners.slice(0, rawIndex + 1);
  const activeScanner = fullMap.scanners[rawIndex]!;
  const addedKeys = addedPerStep[rawIndex]!;
  const prefixMap = new TrenchMap(
    scannersPrefix,
    scannersPrefix.flatMap((scanner) => scanner.beacons),
  );
  const projection = projectTrenchSnapshot(
    prefixMap.scanners,
    prefixMap.beacons,
    bounds,
    activeScanner.id,
    addedKeys,
  );

  return Object.freeze({
    stepIndex,
    rawIndex,
    totalRawSteps: fullMap.scannerCount,
    activeScanner,
    alignedScanners: prefixMap.scanners,
    beacons: prefixMap.beacons,
    projection,
    newlyAddedCount: addedKeys.size,
    metricValue: policy.solve(prefixMap),
    isComplete: rawIndex === fullMap.scannerCount - 1,
  });
}

/** Traces progressive scanner alignment frames bounded to `options?.maxSteps` via uniform sampling. */
export function traceBeaconAlignment(
  reports: readonly ScannerReport[],
  policy: BeaconScannerPolicy,
  options?: TraceOptions,
): readonly BeaconTraceFrame[] {
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const fullMap = alignScanners(reports, policy.minOverlap);
  const bounds = computeProjectionBounds([
    ...fullMap.beacons,
    ...fullMap.scanners.map((scanner) => scanner.position),
  ]);
  const addedPerStep = computeNewlyAddedPerStep(fullMap.scanners);
  const sampled = sampleTraceIndices(fullMap.scannerCount, maxSteps);
  const frames = sampled.map((rawIndex, stepIndex) =>
    buildTraceFrame(stepIndex, rawIndex, fullMap, bounds, addedPerStep, policy),
  );
  return Object.freeze(frames);
}
