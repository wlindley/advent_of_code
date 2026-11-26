import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  AIM_NAVIGATION_POLICY,
  navigateCourse,
  parseSubmarineCourse,
  traceCourse,
  type NavigationTraceFrame,
  type SubmarineCourse,
} from '../../shared';

function solvePart2(course: SubmarineCourse): bigint {
  return navigateCourse(course, AIM_NAVIGATION_POLICY).product;
}

function tracePart2(course: SubmarineCourse, options?: TraceOptions): readonly NavigationTraceFrame[] {
  return traceCourse(course, AIM_NAVIGATION_POLICY, options);
}

/** Solver for 2021 Day 2 Part 2 (aim-steered submarine navigation). */
export const solver: PuzzleSolver<SubmarineCourse, bigint, NavigationTraceFrame> = Object.freeze({
  parse: parseSubmarineCourse,
  solve: solvePart2,
  trace: tracePart2,
});
