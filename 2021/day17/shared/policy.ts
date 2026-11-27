import type { TrickShotAnalysis } from './analyzer';

export type TrickShotPolicyMode = 'max-apex' | 'valid-count';

export interface TrickShotPolicyInit {
  readonly mode: TrickShotPolicyMode;
  readonly label: string;
  readonly compute: (analysis: TrickShotAnalysis) => number;
}

/** Strategy object parameterizing Part 1 (max apex) and Part 2 (valid count) reduction. */
export class TrickShotPolicy {
  readonly mode: TrickShotPolicyMode;
  readonly label: string;
  readonly #computeFn: (analysis: TrickShotAnalysis) => number;

  constructor(init: TrickShotPolicyInit) {
    this.mode = init.mode;
    this.label = init.label;
    this.#computeFn = init.compute;
    Object.freeze(this);
  }

  /** Evaluates the configured policy metric over an analyzed target area. */
  compute(analysis: TrickShotAnalysis): number {
    return this.#computeFn(analysis);
  }
}

/** Part 1 policy maximizing peak probe height y among all valid launch velocities. */
export const MAX_APEX_POLICY = new TrickShotPolicy({
  mode: 'max-apex',
  label: 'Max Apex Y',
  compute: (analysis) => analysis.maxApexY,
});

/** Part 2 policy counting all distinct valid (vx, vy) launch velocities. */
export const VALID_VELOCITY_COUNT_POLICY = new TrickShotPolicy({
  mode: 'valid-count',
  label: 'Valid Velocities',
  compute: (analysis) => analysis.validVelocityCount,
});
