import { describe, expect, it } from 'vitest';
import { parseSubmarineCourse, type SubmarineCommand } from './course';
import {
  DEFAULT_MAX_TRACE_STEPS,
  navigateCourse,
  traceCourse,
} from './navigation';
import {
  AIM_NAVIGATION_POLICY,
  DIRECT_NAVIGATION_POLICY,
  type NavigationPolicy,
} from './navigationPolicy';
import { SubmarinePose } from './pose';

const EXAMPLE_RAW = 'forward 5\ndown 5\nforward 8\nup 3\ndown 8\nforward 2';

const REVERSE_POLICY: NavigationPolicy = Object.freeze({
  name: 'reverse',
  usesAim: false,
  step(pose: SubmarinePose, command: SubmarineCommand): SubmarinePose {
    if (command.direction === 'forward') return pose.withDelta(-command.units, 0n, 0n);
    if (command.direction === 'down') return pose.withDelta(0n, command.units, 0n);
    return pose.withDelta(0n, -command.units, 0n);
  },
});

function buildRepeatedCourseRaw(count: number): string {
  const lines: string[] = [];
  for (let i = 0; i < count; i += 1) {
    lines.push(i % 3 === 0 ? 'down 2' : i % 3 === 1 ? 'forward 3' : 'up 1');
  }
  return lines.join('\n');
}

describe('NavigationPolicy', () => {
  it('exposes metadata and navigates official example under DIRECT and AIM policies', () => {
    const course = parseSubmarineCourse(EXAMPLE_RAW);

    expect(DIRECT_NAVIGATION_POLICY.name).toBe('direct');
    expect(DIRECT_NAVIGATION_POLICY.usesAim).toBe(false);
    const directFinal = navigateCourse(course, DIRECT_NAVIGATION_POLICY);
    expect(directFinal.horizontal).toBe(15n);
    expect(directFinal.depth).toBe(10n);
    expect(directFinal.aim).toBe(0n);
    expect(directFinal.product).toBe(150n);

    expect(AIM_NAVIGATION_POLICY.name).toBe('aim');
    expect(AIM_NAVIGATION_POLICY.usesAim).toBe(true);
    const aimFinal = navigateCourse(course, AIM_NAVIGATION_POLICY);
    expect(aimFinal.horizontal).toBe(15n);
    expect(aimFinal.depth).toBe(60n);
    expect(aimFinal.aim).toBe(10n);
    expect(aimFinal.product).toBe(900n);
  });

  it('supports negative aim and negative depth under AIM_NAVIGATION_POLICY', () => {
    const course = parseSubmarineCourse('up 4\nforward 3\ndown 2\nforward 5');
    const finalPose = navigateCourse(course, AIM_NAVIGATION_POLICY);
    expect(finalPose.aim).toBe(-2n);
    expect(finalPose.horizontal).toBe(8n);
    expect(finalPose.depth).toBe(-22n);
    expect(finalPose.product).toBe(-176n);
  });

  it('supports custom polymorphic NavigationPolicy implementations', () => {
    const course = parseSubmarineCourse('forward 4\ndown 5\nup 2');
    const finalPose = navigateCourse(course, REVERSE_POLICY);
    expect(finalPose.horizontal).toBe(-4n);
    expect(finalPose.depth).toBe(3n);
    expect(finalPose.product).toBe(-12n);
  });
});

describe('traceCourse', () => {
  it('emits frozen exact transition frames with omitted options and custom maxSteps', () => {
    const course = parseSubmarineCourse(EXAMPLE_RAW);
    const allFrames = traceCourse(course, DIRECT_NAVIGATION_POLICY);
    expect(Object.isFrozen(allFrames)).toBe(true);
    expect(allFrames.length).toBe(6);
    expect(Object.isFrozen(allFrames[0])).toBe(true);
    expect(allFrames[0]?.before).toBe(SubmarinePose.ORIGIN);
    expect(allFrames[0]?.after.horizontal).toBe(5n);
    expect(allFrames[5]?.stepIndex).toBe(5);
    expect(allFrames[5]?.after.product).toBe(150n);

    const threeFrames = traceCourse(course, AIM_NAVIGATION_POLICY, { maxSteps: 3 });
    expect(threeFrames.map((f) => f.stepIndex)).toEqual([0, 3, 5]);
    expect(threeFrames[2]?.after.product).toBe(900n);

    const singleFrame = traceCourse(course, DIRECT_NAVIGATION_POLICY, { maxSteps: 1 });
    expect(singleFrame.length).toBe(1);
    expect(singleFrame[0]?.stepIndex).toBe(5);
    expect(singleFrame[0]?.after.product).toBe(150n);
  });

  it('downsamples 300-command courses to DEFAULT_MAX_TRACE_STEPS and rejects invalid maxSteps', () => {
    const course = parseSubmarineCourse(buildRepeatedCourseRaw(300));
    const frames = traceCourse(course, DIRECT_NAVIGATION_POLICY);
    expect(frames.length).toBe(DEFAULT_MAX_TRACE_STEPS);
    expect(frames[0]?.stepIndex).toBe(0);
    expect(frames[frames.length - 1]?.stepIndex).toBe(299);
    expect(frames[frames.length - 1]?.after).toEqual(navigateCourse(course, DIRECT_NAVIGATION_POLICY));

    for (const bad of [0, -2, 1.5, Number.NaN]) {
      expect(() => traceCourse(course, DIRECT_NAVIGATION_POLICY, { maxSteps: bad })).toThrow(RangeError);
    }
  });
});
