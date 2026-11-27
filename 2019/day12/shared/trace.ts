import { sampleTraceIndices, validateMaxSteps } from '../../../shared/core';
import { AXES, MoonState, MoonSystem, Vec3, type AxisName } from './models';
import { analyzeSystemCycles, stepAxisInPlace, type CycleAnalysis } from './simulation';

/** Default maximum number of frames emitted by trace builders. */
export const DEFAULT_MAX_TRACE_FRAMES = 240;

/** Maximum trail points retained per moon in a trace frame. */
export const MAX_TRAIL_LENGTH = 24;

/** Maximum preview simulation steps included in cycle-decomposition traces. */
export const MAX_CYCLE_PREVIEW_STEPS = 48;

/** Frame emitted when tracing fixed-step orbit integration. */
export interface OrbitStepTraceFrame {
  readonly kind: 'orbit-step';
  readonly step: number;
  readonly totalSteps: number;
  readonly moons: readonly MoonState[];
  readonly trails: readonly (readonly Vec3[])[];
}

/** Frame emitted when tracing per-axis cycle decomposition and LCM recombination. */
export interface AxisCycleTraceFrame {
  readonly kind: 'axis-cycle';
  readonly phase: 'preview' | 'axis-locked' | 'lcm-complete';
  readonly step: bigint;
  readonly moons: readonly MoonState[];
  readonly trails: readonly (readonly Vec3[])[];
  readonly analysis: CycleAnalysis;
  readonly lockedAxes: readonly AxisName[];
}

/** Discriminated union of trace frames produced by Day 12 solvers. */
export type NBodyTraceFrame = OrbitStepTraceFrame | AxisCycleTraceFrame;

function buildMoonSnapshot(
  px: Int32Array, vx: Int32Array, py: Int32Array, vy: Int32Array, pz: Int32Array, vz: Int32Array,
): readonly MoonState[] {
  const moons: MoonState[] = [];
  for (let i = 0; i < px.length; i += 1) {
    moons.push(new MoonState(new Vec3(px[i]!, py[i]!, pz[i]!), new Vec3(vx[i]!, vy[i]!, vz[i]!)));
  }
  return Object.freeze(moons);
}

function appendTrailPositions(trails: Vec3[][], moons: readonly MoonState[]): readonly (readonly Vec3[])[] {
  const frozen: (readonly Vec3[])[] = [];
  for (let i = 0; i < moons.length; i += 1) {
    const trail = trails[i]!;
    trail.push(moons[i]!.position);
    if (trail.length > MAX_TRAIL_LENGTH) trail.shift();
    frozen.push(Object.freeze([...trail]));
  }
  return Object.freeze(frozen);
}

function makeOrbitFrame(
  step: number, totalSteps: number, moons: readonly MoonState[], trails: readonly (readonly Vec3[])[],
): OrbitStepTraceFrame {
  return Object.freeze({ kind: 'orbit-step', step, totalSteps, moons, trails });
}

/** Simulates `totalSteps` ticks and returns at most `maxSteps` uniformly sampled frames. */
export function buildOrbitStepTrace(
  system: MoonSystem, totalSteps: number, maxSteps: number,
): readonly OrbitStepTraceFrame[] {
  if (!Number.isSafeInteger(totalSteps) || totalSteps < 0) {
    throw new RangeError(`totalSteps must be a non-negative safe integer, got ${totalSteps}`);
  }
  const limit = validateMaxSteps(maxSteps, DEFAULT_MAX_TRACE_FRAMES);
  const sampled = sampleTraceIndices(totalSteps + 1, limit);
  const px = system.axisInitialPositions('x'), vx = system.axisInitialVelocities('x');
  const py = system.axisInitialPositions('y'), vy = system.axisInitialVelocities('y');
  const pz = system.axisInitialPositions('z'), vz = system.axisInitialVelocities('z');
  const trails: Vec3[][] = system.moons.map((m) => [m.position]);
  const frames: OrbitStepTraceFrame[] = [];
  let nextSampleIdx = 0;

  if (sampled[nextSampleIdx] === 0) {
    frames.push(makeOrbitFrame(0, totalSteps, system.moons, Object.freeze(trails.map((t) => Object.freeze([...t])))));
    nextSampleIdx += 1;
  }
  for (let step = 1; step <= totalSteps; step += 1) {
    stepAxisInPlace(px, vx);
    stepAxisInPlace(py, vy);
    stepAxisInPlace(pz, vz);
    if (sampled[nextSampleIdx] === step) {
      const moons = buildMoonSnapshot(px, vx, py, vy, pz, vz);
      frames.push(makeOrbitFrame(step, totalSteps, moons, appendTrailPositions(trails, moons)));
      nextSampleIdx += 1;
    }
  }
  return Object.freeze(frames);
}

function makeCycleFrame(
  phase: AxisCycleTraceFrame['phase'],
  step: bigint,
  moons: readonly MoonState[],
  trails: readonly (readonly Vec3[])[],
  analysis: CycleAnalysis,
  lockedAxes: readonly AxisName[],
): AxisCycleTraceFrame {
  return Object.freeze({ kind: 'axis-cycle', phase, step, moons, trails, analysis, lockedAxes });
}

/** Builds a bounded canonical axis-cycle decomposition trace sampled to `maxSteps` frames. */
export function buildAxisCycleTrace(
  system: MoonSystem, maxAxisSteps: number, maxSteps: number,
): readonly AxisCycleTraceFrame[] {
  const limit = validateMaxSteps(maxSteps, DEFAULT_MAX_TRACE_FRAMES);
  const analysis = analyzeSystemCycles(system, maxAxisSteps);
  const maxCap = BigInt(MAX_CYCLE_PREVIEW_STEPS);
  const previewSteps = analysis.maxAxisPeriod < maxCap ? Number(analysis.maxAxisPeriod) : MAX_CYCLE_PREVIEW_STEPS;
  const preview = buildOrbitStepTrace(system, previewSteps, previewSteps + 1);
  const timeline: AxisCycleTraceFrame[] = [];
  const noLocks: readonly AxisName[] = Object.freeze([]);

  for (let i = 0; i < preview.length; i += 1) {
    const f = preview[i]!;
    timeline.push(makeCycleFrame('preview', BigInt(f.step), f.moons, f.trails, analysis, noLocks));
  }
  const lastPreview = preview[preview.length - 1]!;
  const sorted = analysis.sortedByPeriod();
  const locked: AxisName[] = [];
  for (let i = 0; i < sorted.length; i += 1) {
    locked.push(sorted[i]!.axis);
    timeline.push(makeCycleFrame(
      'axis-locked', sorted[i]!.period, lastPreview.moons, lastPreview.trails, analysis, Object.freeze([...locked]),
    ));
  }
  const resetTrails = Object.freeze(system.moons.map((m) => Object.freeze([m.position])));
  timeline.push(makeCycleFrame('lcm-complete', analysis.globalPeriod, system.moons, resetTrails, analysis, AXES));
  return Object.freeze(sampleTraceIndices(timeline.length, limit).map((idx) => timeline[idx]!));
}
