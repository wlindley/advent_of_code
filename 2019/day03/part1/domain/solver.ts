import { MANHATTAN_METRIC, createCrossedWiresSolver } from '../../shared';

/** AoC 2019 Day 3 Part 1 solver minimizing Manhattan distance to the central port. */
export const solver = createCrossedWiresSolver(MANHATTAN_METRIC);
