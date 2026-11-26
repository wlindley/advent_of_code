import { createKeepAwaySolver } from '../../shared';
import { DivideByThreeRule } from './rule';

export const PART1_RULE = new DivideByThreeRule();

export const solver = createKeepAwaySolver(PART1_RULE);
