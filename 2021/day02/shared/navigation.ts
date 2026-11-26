import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../shared/core';
import type { SubmarineCommand, SubmarineCourse } from './course';
import type { NavigationPolicy } from './navigationPolicy';
import { SubmarinePose } from './pose';

export const DEFAULT_MAX_TRACE_STEPS = 120;

export interface NavigationTraceFrame {
  readonly stepIndex: number;
  readonly command: SubmarineCommand;
  readonly before: SubmarinePose;
  readonly after: SubmarinePose;
}

/** Simulates an entire submarine course under a policy, returning the final pose in O(N) time. */
export function navigateCourse(course: SubmarineCourse, policy: NavigationPolicy): SubmarinePose {
  let pose = SubmarinePose.ORIGIN;
  for (let i = 0; i < course.count; i += 1) {
    pose = policy.step(pose, course.commandAt(i));
  }
  return pose;
}

/** Simulates a course and samples up to `options.maxSteps` transition frames uniformly. */
export function traceCourse(
  course: SubmarineCourse,
  policy: NavigationPolicy,
  options?: TraceOptions,
): readonly NavigationTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sampled = sampleTraceIndices(course.count, limit);
  const frames: NavigationTraceFrame[] = [];
  let pose = SubmarinePose.ORIGIN;
  let cursor = 0;

  for (let i = 0; i < course.count; i += 1) {
    const command = course.commandAt(i);
    const next = policy.step(pose, command);
    if (i === sampled[cursor]) {
      frames.push(Object.freeze({ stepIndex: i, command, before: pose, after: next }));
      cursor += 1;
    }
    pose = next;
  }
  return Object.freeze(frames);
}
