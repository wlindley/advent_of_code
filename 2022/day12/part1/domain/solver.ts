import { createHillClimbingSolver } from '../../shared';
import { FIXED_START_CONDITION } from './condition';

/** Part 1 solver: shortest path from `S` to `E` using reverse BFS. */
export const solver = createHillClimbingSolver(FIXED_START_CONDITION);
