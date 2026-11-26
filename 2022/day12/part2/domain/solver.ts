import { createHillClimbingSolver } from '../../shared';
import { ANY_LOWEST_START_CONDITION } from './condition';

/** Part 2 solver: shortest path from any lowest-elevation cell (`a` or `S`) to `E`. */
export const solver = createHillClimbingSolver(ANY_LOWEST_START_CONDITION);
