import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, usePlayback, type PlaybackState } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  PROFILE_VIEWBOX,
  buildComparisonOverlay,
  buildProfileGeometry,
  type ComparisonOverlay,
  type ProfileGeometry,
  type SonarReport,
  type SweepDeltaKind,
  type SweepTraceFrame,
} from '../index';

export interface SonarSweepVisualizerProps {
  readonly rawInput: string;
  readonly solver: PuzzleSolver<SonarReport, number, SweepTraceFrame>;
  readonly windowSize: number;
}

interface SweepOk {
  readonly ok: true;
  readonly report: SonarReport;
  readonly answer: number;
  readonly frames: readonly SweepTraceFrame[];
  readonly geometry: ProfileGeometry;
  readonly totalComparisons: number;
}

type SweepViewModel = SweepOk | { readonly ok: false; readonly message: string };

const DELTA_STYLE: Record<SweepDeltaKind, { readonly color: string; readonly label: string }> = {
  increase: { color: 'var(--ok)', label: 'Increased' },
  decrease: { color: 'var(--err)', label: 'Decreased' },
  equal: { color: 'var(--muted)', label: 'No change' },
};

function buildSweepViewModel(
  rawInput: string,
  solver: PuzzleSolver<SonarReport, number, SweepTraceFrame>,
  windowSize: number,
): SweepViewModel {
  try {
    const report = solver.parse(rawInput);
    const answer = solver.solve(report);
    const frames = solver.trace ? solver.trace(report, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) : [];
    const geometry = buildProfileGeometry(report);
    return { ok: true, report, answer, frames, geometry, totalComparisons: Math.max(0, report.count - windowSize) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function handleTogglePlay(playback: PlaybackState, lastStep: number): void {
  if (!playback.isPlaying && playback.step >= lastStep) playback.setStep(0);
  playback.togglePlay();
}

function handleStepChange(playback: PlaybackState, nextStep: number): void {
  if (playback.isPlaying) playback.togglePlay();
  playback.setStep(nextStep);
}

function SweepSummaryBadges({ vm, frame, windowSize }: { readonly vm: SweepOk; readonly frame: SweepTraceFrame | null; readonly windowSize: number }) {
  const style = frame ? DELTA_STYLE[frame.deltaKind] : null;
  return (
    <div className="meta-row">
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>Window W={windowSize}</span>
      <span className="badge">Comparison: <code>{frame ? frame.comparisonIndex + 1 : 0} / {vm.totalComparisons}</code></span>
      {frame && style && (
        <span className="badge" style={{ borderColor: style.color, color: style.color }}>
          {frame.exitingDepth} → {frame.enteringDepth} ({style.label})
        </span>
      )}
      <span className="badge status-solved">Increases: <strong>{frame ? frame.increasesSoFar : vm.answer}</strong> / {vm.answer}</span>
      {vm.totalComparisons > vm.frames.length && (
        <span className="muted">Sampled {vm.frames.length} of {vm.totalComparisons} steps</span>
      )}
    </div>
  );
}

function OverlayMarkers({ overlay, windowSize }: { readonly overlay: ComparisonOverlay; readonly windowSize: number }) {
  const { color } = DELTA_STYLE[overlay.deltaKind];
  const { exitingPoint, enteringPoint, sharedBand } = overlay;
  const bandHeight = PROFILE_VIEWBOX.height - PROFILE_VIEWBOX.padY * 2;
  return (
    <g>
      {sharedBand && (
        <rect
          x={sharedBand.x} y={PROFILE_VIEWBOX.padY} width={sharedBand.width} height={bandHeight}
          fill="var(--gold)" fillOpacity={0.16} stroke="var(--gold)" strokeDasharray="3 3" rx={3}
        />
      )}
      <line x1={exitingPoint.x} y1={exitingPoint.y} x2={enteringPoint.x} y2={enteringPoint.y} stroke={color} strokeWidth={2} strokeDasharray="4 3" />
      <circle cx={exitingPoint.x} cy={exitingPoint.y} r={4.5} fill="var(--surface)" stroke="var(--text)" strokeWidth={2} />
      <circle cx={enteringPoint.x} cy={enteringPoint.y} r={5} fill={color} stroke="var(--surface)" strokeWidth={1.5} />
      <text x={PROFILE_VIEWBOX.width - PROFILE_VIEWBOX.padX} y={14} textAnchor="end" className="chart-axis-text">
        {windowSize > 1 ? 'Gold band: cancelled overlap' : 'Exit vs Enter pair'}
      </text>
    </g>
  );
}

function BathymetrySvg({ geometry, overlay, windowSize }: { readonly geometry: ProfileGeometry; readonly overlay: ComparisonOverlay | null; readonly windowSize: number }) {
  const viewBox = `0 0 ${PROFILE_VIEWBOX.width} ${PROFILE_VIEWBOX.height}`;
  return (
    <svg viewBox={viewBox} className="chart-svg" role="img" aria-label={`Bathymetry depth profile across ${geometry.totalPoints} readings`}>
      <path d={geometry.areaPath} fill="var(--accent)" fillOpacity={0.12} />
      <polyline fill="none" stroke="var(--accent)" strokeWidth={2} points={geometry.polylinePoints} />
      <text x={PROFILE_VIEWBOX.padX} y={14} className="chart-axis-text">Shallow {geometry.minDepth}</text>
      <text x={PROFILE_VIEWBOX.padX} y={PROFILE_VIEWBOX.height - 6} className="chart-axis-text">Deep {geometry.maxDepth}</text>
      {overlay && <OverlayMarkers overlay={overlay} windowSize={windowSize} />}
    </svg>
  );
}

/** Interactive bathymetry profile and sliding-window cancellation visualizer. */
export function SonarSweepVisualizer({ rawInput, solver, windowSize }: SonarSweepVisualizerProps) {
  const viewModel = useMemo(() => buildSweepViewModel(rawInput, solver, windowSize), [rawInput, solver, windowSize]);
  const frames = viewModel.ok ? viewModel.frames : [];
  const playback = usePlayback(frames.length, rawInput, 180);

  if (!viewModel.ok) {
    return <div className="stack"><p className="error-text">Unable to visualize input: {viewModel.message}</p></div>;
  }
  const frame = frames[playback.step] ?? null;
  const overlay = frame ? buildComparisonOverlay(viewModel.report, frame, windowSize) : null;
  return (
    <div className="stack">
      <SweepSummaryBadges vm={viewModel} frame={frame} windowSize={windowSize} />
      <BathymetrySvg geometry={viewModel.geometry} overlay={overlay} windowSize={windowSize} />
      <PlaybackControls
        step={playback.step} totalSteps={frames.length} isPlaying={playback.isPlaying} speedMs={playback.speedMs}
        onTogglePlay={() => handleTogglePlay(playback, frames.length - 1)}
        onStepChange={(next) => handleStepChange(playback, next)}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
