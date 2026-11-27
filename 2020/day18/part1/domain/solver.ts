import { EQUAL_PRECEDENCE_POLICY, OperationOrderSolver } from '../../shared';

/** 2020 Day 18 Part 1 solver with equal left-to-right precedence for `+` and `*`. */
export const solver = new OperationOrderSolver(EQUAL_PRECEDENCE_POLICY);
