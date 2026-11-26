import { createKeepAwaySolver } from '../../shared';
import { ModularReliefRule } from './rule';

export const PART2_RULE = new ModularReliefRule();
export const solver = createKeepAwaySolver(PART2_RULE);
