import { createLagoonSolver } from '../../shared';
import { HEX_DIG_PLAN_DECODER } from './hexDecoder';

/** AoC 2023 Day 18 Part 2 solver: exact BigInt Shoelace + Pick's theorem on hex-decoded steps. */
export const solver = createLagoonSolver(HEX_DIG_PLAN_DECODER);
