import { DECODED_MESSAGE_POLICY, SpaceImageSolver, STANDARD_IMAGE_DIMENSIONS } from '../../shared';

/** AoC 2019 Day 8 Part 2 pure 25x6 Space Image composite OCR solver. */
export const solver = new SpaceImageSolver(DECODED_MESSAGE_POLICY, () => STANDARD_IMAGE_DIMENSIONS);
