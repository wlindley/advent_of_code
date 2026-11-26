import { MIN_ZERO_CHECKSUM_POLICY, SpaceImageSolver, STANDARD_IMAGE_DIMENSIONS } from '../../shared';

/** AoC 2019 Day 8 Part 1 pure 25x6 Space Image checksum solver. */
export const solver = new SpaceImageSolver(MIN_ZERO_CHECKSUM_POLICY, () => STANDARD_IMAGE_DIMENSIONS);
