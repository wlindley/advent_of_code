import { createReservoirSolver } from '../../shared';
import { ABYSS_BOUNDARY_POLICY } from './policy';

/** Part 1 Regolith Reservoir solver (abyss escape boundary). */
export const solver = createReservoirSolver(ABYSS_BOUNDARY_POLICY);
