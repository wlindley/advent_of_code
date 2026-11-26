import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  TRAJECTORY_VIEWBOX,
  buildActiveSegmentOverlay,
  buildTrajectoryGeometry,
  type ActiveSegmentOverlay,
  type NavigationPolicy,
  type NavigationTraceFrame,
  type SubmarineCourse,
  type TrajectoryGeometry,
} from '../index';

export interface DiveTrajectoryVisualizerProps {
  readonly rawInput: string;
  readonly solver: PuzzleSolver<SubmarineCourse, bigint, NavigationTraceFrame>;
  readonly policy: NavigationPolicy;
}

interface DiveOk {
  readonly ok: true;
  readonly course: SubmarineCourse;
  readonly answer: bigint;
  readonly frames: readonly NavigationTraceFrame[];
  readonly geometry: TrajectoryGeometry;
}

type DiveViewModel = DiveOk | { readonly ok: false; readonly message: string };

function buildDiveViewModel(
  rawInput: string,
  solver: PuzzleSolver<SubmarineCourse, bigint, NavigationTraceFrame>,
  policy: NavigationPolicy,
): DiveViewModel {
  try {
    const course = solver.parse(rawInput);
    const answer = solver.solve(course);
    const frames = solver.trace ? solver.trace(course, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) : [];
    const geometry = buildTrajectoryGeometry(course, policy);
    return { ok: true, course, answer, frames, geometry };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

interface TelemetryProps {
  readonly vm: DiveOk;
  readonly frame: NavigationTraceFrame | null;
  readonly policy: NavigationPolicy;
}

function TelemetryBadges({ vm, frame, policy }: TelemetryProps) {
  const pose = frame ? frame.after : null;
  return (
    <div className="meta-row">
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>Policy: {policy.name}</span>
      <span className="badge">Step: <code>{frame ? frame.stepIndex + 1 : 0} / {vm.course.count}</code></span>
      {frame && <span className="badge" style={{ borderColor: 'var(--text)', color: 'var(--text)' }}>{frame.command.direction} {String(frame.command.units)}</span>}
      {pose && <span className="badge">Pos: <code>({String(pose.horizontal)}, {String(pose.depth)})</code></span>}
      {policy.usesAim && pose && <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>Aim: <code>{String(pose.aim)}</code></span>}
      <span className="badge status-solved">Product: <strong>{pose ? String(pose.product) : String(vm.answer)}</strong> / {String(vm.answer)}</span>
      {vm.course.count > vm.frames.length && <span className="muted">Sampled {vm.frames.length} of {vm.course.count} steps</span>}
    </div>
  );
}

function OverlayLayer({ overlay }: { readonly overlay: ActiveSegmentOverlay }) {
  const { beforePoint, afterPoint, aimRay } = overlay;
  return (
    <g>
      <line x1={beforePoint.x} y1={beforePoint.y} x2={afterPoint.x} y2={afterPoint.y} stroke="var(--ok)" strokeWidth={3} />
      {aimRay && (
        <line x1={aimRay.x1} y1={aimRay.y1} x2={aimRay.x2} y2={aimRay.y2} stroke="var(--gold)" strokeWidth={2.25} strokeDasharray="5 3" />
      )}
      <circle cx={beforePoint.x} cy={beforePoint.y} r={3.5} fill="var(--surface)" stroke="var(--text)" strokeWidth={1.75} />
      <circle cx={afterPoint.x} cy={afterPoint.y} r={5.5} fill="var(--ok)" stroke="var(--surface)" strokeWidth={1.75} />
    </g>
  );
}

interface TrajectorySvgProps {
  readonly geometry: TrajectoryGeometry;
  readonly overlay: ActiveSegmentOverlay | null;
  readonly usesAim: boolean;
}

function TrajectorySvg({ geometry, overlay, usesAim }: TrajectorySvgProps) {
  const { width, height, padX } = TRAJECTORY_VIEWBOX;
  const { bounds } = geometry;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" role="img" aria-label={`Submarine 2D trajectory across ${geometry.totalPoses} poses`}>
      <line x1={padX} y1={geometry.waterlineY} x2={width - padX} y2={geometry.waterlineY} stroke="var(--border)" strokeWidth={1.5} strokeDasharray="4 4" />
      <text x={width - padX} y={geometry.waterlineY - 5} textAnchor="end" className="chart-axis-text">Waterline (depth 0)</text>
      <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={geometry.polylinePoints} />
      <text x={padX} y={14} className="chart-axis-text">Depth {String(bounds.minDepth)}..{String(bounds.maxDepth)}</text>
      <text x={padX} y={height - 6} className="chart-axis-text">Horiz {String(bounds.minHorizontal)}..{String(bounds.maxHorizontal)}</text>
      {usesAim && <text x={width - padX} y={height - 6} textAnchor="end" className="chart-ref-text">Gold ray: current aim vector</text>}
      {overlay && <OverlayLayer overlay={overlay} />}
    </svg>
  );
}

/** Interactive 2D submarine trajectory and pose-stepping visualizer. */
export function DiveTrajectoryVisualizer({ rawInput, solver, policy }: DiveTrajectoryVisualizerProps) {
  const viewModel = useMemo(() => buildDiveViewModel(rawInput, solver, policy), [rawInput, solver, policy]);
  const frames = viewModel.ok ? viewModel.frames : [];
  const playback = usePlayback(frames.length, rawInput, 180);

  if (!viewModel.ok) {
    return (
      <div className="stack">
        <p className="error-text">Unable to visualize input: {viewModel.message}</p>
      </div>
    );
  }
  const frame = frames[playback.step] ?? null;
  const overlay = frame ? buildActiveSegmentOverlay(viewModel.geometry.bounds, frame, policy.usesAim) : null;
  return (
    <div className="stack">
      <TelemetryBadges vm={viewModel} frame={frame} policy={policy} />
      <TrajectorySvg geometry={viewModel.geometry} overlay={overlay} usesAim={policy.usesAim} />
      <PlaybackControls
        step={playback.step}
        totalSteps={frames.length}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={playback.togglePlay}
        onStepChange={playback.setStep}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
