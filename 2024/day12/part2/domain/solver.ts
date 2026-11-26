import { createGardenGroupsSolver } from '../../shared';
import { SIDES_METRIC } from './metric';

/** Part 2 solver summing `area * sides` across all garden regions. */
export const solver = createGardenGroupsSolver(SIDES_METRIC);
