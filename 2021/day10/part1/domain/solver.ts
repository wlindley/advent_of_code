import { CORRUPTION_SCORE_POLICY, SyntaxScoringSolver } from '../../shared';

/** Part 1 solver summing syntax corruption penalties for the first illegal closer on each corrupted line. */
export const solver = new SyntaxScoringSolver(CORRUPTION_SCORE_POLICY);
