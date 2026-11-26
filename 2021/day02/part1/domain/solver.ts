import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  DIRECT_NAVIGATION_POLICY,
  navigateCourse,
  parseSubmarineCourse,
  traceCourse,
  type NavigationTraceFrame,
  type SubmarineCourse,
} from '../../shared';

function solvePart1(course: SubmarineCourse): bigint {
  return navigateCourse(course, DIRECT_NAVIGATION_POLICY).product;
}

function tracePart1(course: SubmarineCourse, options?: TraceOptions): readonly NavigationTraceFrame[] {
  return traceCourse(course, DIRECT_NAVIGATION_POLICY, options);
}

/** Solver for 2021 Day 2 Part 1 (direct horizontal/depth submarine navigation). */
export const solver: PuzzleSolver<SubmarineCourse, bigint, NavigationTraceFrame> = Object.freeze({
  parse: parseSubmarineCourse,
  solve: solvePart1,
  trace: tracePart1,
});
