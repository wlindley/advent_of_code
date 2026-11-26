import { ClawConfig, createClawContraptionSolver } from '../../shared';

/** Part 1 rules: unshifted prize coordinates and at most 100 presses per button. */
export const PART1_CONFIG = new ClawConfig(0n, 100n);

/** Part 1 solver summing minimum tokens for winnable machines under `PART1_CONFIG`. */
export const solver = createClawContraptionSolver(PART1_CONFIG);
