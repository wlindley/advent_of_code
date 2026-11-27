/** Policy configuring how many enhancement passes a solver performs. */
export interface EnhancementPolicy {
  readonly steps: number;
}

/** Step count for Day 20 Part 1. */
export const PART1_STEPS = 2;

/** Step count for Day 20 Part 2. */
export const PART2_STEPS = 50;

/** Validates a non-negative integer step count and builds an enhancement policy. */
export function createStepCountPolicy(steps: number): EnhancementPolicy {
  if (!Number.isInteger(steps) || steps < 0) {
    throw new RangeError(`Policy steps must be a non-negative integer, got ${steps}`);
  }
  return { steps };
}

/** Policy for Day 20 Part 1 (2 passes). */
export const PART1_POLICY = createStepCountPolicy(PART1_STEPS);

/** Policy for Day 20 Part 2 (50 passes). */
export const PART2_POLICY = createStepCountPolicy(PART2_STEPS);
