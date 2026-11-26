import { createReservoirSolver } from '../../shared';
import { FLOOR_BOUNDARY_POLICY } from './policy';

/** Part 2 solver: pours sand from (500, 0) onto an infinite bedrock floor until blocked. */
export const solver = createReservoirSolver(FLOOR_BOUNDARY_POLICY);
