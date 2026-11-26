import { createGardenGroupsSolver } from '../../shared';
import { PERIMETER_METRIC } from './metric';

/** Part 1 solver summing `area * perimeter` across all garden regions. */
export const solver = createGardenGroupsSolver(PERIMETER_METRIC);
