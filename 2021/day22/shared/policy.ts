import { ClosedInterval } from '../../../shared/core';
import { Cuboid } from './cuboid';

export type ReactorMode = 'initialization' | 'full';

/** Strategy governing how reboot step cuboids are clipped for Part 1 vs Part 2. */
export interface ReactorPolicy {
  readonly mode: ReactorMode;
  clip(cuboid: Cuboid): Cuboid | null;
}

/** Clips reboot steps to a finite bounding cuboid (e.g., initialization `[-50..50]^3`). */
export class BoundedReactorPolicy implements ReactorPolicy {
  readonly mode: ReactorMode = 'initialization';
  readonly bounds: Cuboid;

  constructor(bounds: Cuboid) {
    this.bounds = bounds;
    Object.freeze(this);
  }

  clip(cuboid: Cuboid): Cuboid | null {
    return cuboid.intersection(this.bounds);
  }
}

/** Leaves every reboot cuboid unclipped across the entire 3D integer grid. */
export class FullReactorPolicy implements ReactorPolicy {
  readonly mode: ReactorMode = 'full';

  constructor() {
    Object.freeze(this);
  }

  clip(cuboid: Cuboid): Cuboid {
    return cuboid;
  }
}

export const INITIALIZATION_REGION = new Cuboid(
  new ClosedInterval(-50n, 50n),
  new ClosedInterval(-50n, 50n),
  new ClosedInterval(-50n, 50n),
);

export const INITIALIZATION_POLICY: ReactorPolicy = new BoundedReactorPolicy(INITIALIZATION_REGION);
export const FULL_REACTOR_POLICY: ReactorPolicy = new FullReactorPolicy();
