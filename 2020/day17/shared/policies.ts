export type PocketDimensionCount = 3 | 4;

export type PocketPolicyId = '3d' | '4d';

export interface PocketPolicy {
  readonly id: PocketPolicyId;
  readonly label: string;
  readonly dimensions: PocketDimensionCount;
  readonly cycles: number;
}

export const DEFAULT_MAX_TRACE_STEPS = 64;

export const POCKET_3D_POLICY: PocketPolicy = Object.freeze({
  id: '3d',
  label: '3D Pocket (26 neighbors)',
  dimensions: 3,
  cycles: 6,
});

export const POCKET_4D_POLICY: PocketPolicy = Object.freeze({
  id: '4d',
  label: '4D Hypercube (80 neighbors)',
  dimensions: 4,
  cycles: 6,
});
