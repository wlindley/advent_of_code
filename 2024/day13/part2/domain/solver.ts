import { ClawConfig, createClawContraptionSolver } from '../../shared';

/** Prize coordinate offset applied to both X and Y in Part 2 (`10^13`). */
export const PART2_PRIZE_OFFSET = 10_000_000_000_000n;

/** Part 2 rules: +10^13 prize shift and unbounded button presses. */
export const PART2_CONFIG = new ClawConfig(PART2_PRIZE_OFFSET, null);

/** Part 2 solver summing minimum tokens for winnable machines under `PART2_CONFIG`. */
export const solver = createClawContraptionSolver(PART2_CONFIG);
