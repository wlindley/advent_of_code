import type { Cuboid } from './cuboid';
import type { RebootAction, RebootStep } from './parser';
import type { ReactorPolicy } from './policy';

/** Applies an already-clipped cuboid (`on` or `off`) to a pairwise-disjoint cuboid set. */
export function applyEffectiveStep(
  disjointCuboids: readonly Cuboid[],
  action: RebootAction,
  effectiveCuboid: Cuboid,
): readonly Cuboid[] {
  const next: Cuboid[] = [];
  for (const existing of disjointCuboids) {
    for (const piece of existing.subtract(effectiveCuboid)) {
      next.push(piece);
    }
  }
  if (action === 'on') {
    next.push(effectiveCuboid);
  }
  return Object.freeze(next);
}

/** Clips `step.cuboid` using `policy` and updates the pairwise-disjoint active cuboid set. */
export function applyRebootStep(
  disjointCuboids: readonly Cuboid[],
  step: RebootStep,
  policy: ReactorPolicy,
): readonly Cuboid[] {
  const clipped = policy.clip(step.cuboid);
  if (clipped === null) return disjointCuboids;
  return applyEffectiveStep(disjointCuboids, step.action, clipped);
}

/** Executes a sequence of reboot steps under `policy`, returning the final disjoint ON cuboids. */
export function executeReboot(
  steps: readonly RebootStep[],
  policy: ReactorPolicy,
): readonly Cuboid[] {
  let active: readonly Cuboid[] = Object.freeze([]);
  for (const step of steps) {
    active = applyRebootStep(active, step, policy);
  }
  return active;
}

/** Sums the exact `bigint` ON cube volume across a pairwise-disjoint cuboid collection. */
export function totalOnVolume(disjointCuboids: readonly Cuboid[]): bigint {
  let total = 0n;
  for (const cuboid of disjointCuboids) {
    total += cuboid.volume;
  }
  return total;
}
