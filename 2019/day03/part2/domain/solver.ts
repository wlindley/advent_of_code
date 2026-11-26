import { SIGNAL_DELAY_METRIC, createCrossedWiresSolver } from '../../shared';

/** AoC 2019 Day 3 Part 2 solver minimizing combined wire signal delay. */
export const solver = createCrossedWiresSolver(SIGNAL_DELAY_METRIC);
