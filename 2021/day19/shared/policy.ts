import { DEFAULT_MIN_OVERLAP, type TrenchMap } from './aligner';

/** Puzzle objective mode for 2021 Day 19 Beacon Scanner. */
export type BeaconScannerPolicyMode = 'beacon-count' | 'max-manhattan';

/** Parameterizable metric policy separating beacon counting (Part 1) from scanner separation (Part 2). */
export class BeaconScannerPolicy {
  constructor(
    readonly mode: BeaconScannerPolicyMode,
    readonly label: string,
    readonly minOverlap: number,
  ) {
    Object.freeze(this);
  }

  solve(map: TrenchMap): number {
    return this.mode === 'beacon-count' ? map.beaconCount : map.maxScannerManhattan;
  }

  formatAnswer(answer: number): string {
    return String(answer);
  }
}

/** Part 1 policy counting unique world-frame beacons. */
export const BEACON_COUNT_POLICY = new BeaconScannerPolicy(
  'beacon-count',
  'Unique Beacons',
  DEFAULT_MIN_OVERLAP,
);

/** Part 2 policy finding maximum Manhattan distance between any two aligned scanners. */
export const MAX_SCANNER_MANHATTAN_POLICY = new BeaconScannerPolicy(
  'max-manhattan',
  'Max Scanner Manhattan',
  DEFAULT_MIN_OVERLAP,
);
