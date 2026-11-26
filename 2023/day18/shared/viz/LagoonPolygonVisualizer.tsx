import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, type PlaybackState, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  type LagoonPolygon,
  type LagoonTraceFrame,
  type ProjectedPolygon,
  projectPolygonToSvg,
} from '../index';
import { LAGOON_SVG_VIEWPORT, LagoonSvg } from './LagoonSvg';

export interface LagoonPolygonVisualizerProps {
  readonly rawInput: string;
  readonly solver: PuzzleSolver<LagoonPolygon, bigint, LagoonTraceFrame>;
  readonly partLabel: string;
}

type VizData =
  | {
      readonly ok: true;
      readonly polygon: LagoonPolygon;
      readonly frames: readonly LagoonTraceFrame[];
      readonly projected: ProjectedPolygon;
    }
  | { readonly ok: false; readonly message: string };

function buildVizData(
  rawInput: string,
  solver: PuzzleSolver<LagoonPolygon, bigint, LagoonTraceFrame>,
): VizData {
  try {
    const polygon = solver.parse(rawInput);
    const frames = solver.trace?.(polygon, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) ?? [];
    const projected = projectPolygonToSvg(polygon, LAGOON_SVG_VIEWPORT);
    return { ok: true, polygon, frames, projected };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function togglePlayback(playback: PlaybackState, totalFrames: number): void {
  if (!playback.isPlaying && playback.step >= totalFrames - 1) playback.setStep(0);
  playback.togglePlay();
}

function jumpToStep(playback: PlaybackState, nextStep: number): void {
  if (playback.isPlaying) playback.togglePlay();
  playback.setStep(nextStep);
}

function TelemetryBadges({
  polygon,
  frame,
  partLabel,
}: {
  readonly polygon: LagoonPolygon;
  readonly frame: LagoonTraceFrame;
  readonly partLabel: string;
}) {
  const { spanX, spanY } = polygon.bounds;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
      <span className="badge">
        Steps: <strong>{frame.completedEdges} / {polygon.stepCount}</strong>
      </span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Mode: <strong>{partLabel}</strong>
      </span>
      <span className="badge">
        Bounds: <strong>{spanX.toString()} × {spanY.toString()}</strong>
      </span>
      <span className="badge">
        Running B: <strong>{frame.cumulativeBoundary.toString()}</strong>
      </span>
      <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
        Running 2A: <strong>{frame.cumulativeSignedDoubleArea.toString()}</strong>
      </span>
      <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
        Final I: <strong>{polygon.interiorCount.toString()}</strong> · Vol:{' '}
        <strong>{polygon.totalVolume.toString()}</strong>
      </span>
    </div>
  );
}

function LegendRow() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.9rem', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--text)' }}>
      <span><span style={{ color: 'var(--text)', fontWeight: 700 }}>━</span> RGB trench edge</span>
      <span><span style={{ color: 'var(--ok)', fontWeight: 700 }}>▲</span> +Shoelace / <span style={{ color: 'var(--warn)', fontWeight: 700 }}>▲</span> −Shoelace</span>
      <span><span style={{ color: 'var(--accent)', fontWeight: 700 }}>●</span> Origin (0,0)</span>
      <span><span style={{ color: 'var(--gold)', fontWeight: 700 }}>●</span> Active head</span>
      <span><span style={{ color: 'var(--warn)', fontWeight: 700 }}>■</span> Lava lagoon fill (complete)</span>
    </div>
  );
}

/** Shared interactive Shoelace + Pick's theorem polygon visualizer for Day 18 Parts 1 & 2. */
export function LagoonPolygonVisualizer({ rawInput, solver, partLabel }: LagoonPolygonVisualizerProps) {
  const data = useMemo(() => buildVizData(rawInput, solver), [rawInput, solver]);
  const totalFrames = data.ok ? data.frames.length : 0;
  const playback = usePlayback(totalFrames, rawInput, 100);
  const activeFrame = data.ok ? data.frames[playback.step] : undefined;

  if (!data.ok) return <p className="error-text" role="alert">Invalid dig plan input: {data.message}</p>;
  if (!activeFrame) return <p className="muted">No dig frames available to visualize.</p>;

  return (
    <div className="stack">
      <TelemetryBadges polygon={data.polygon} frame={activeFrame} partLabel={partLabel} />
      <LagoonSvg frame={activeFrame} projected={data.projected} />
      <LegendRow />
      <PlaybackControls
        step={playback.step}
        totalSteps={totalFrames}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={() => togglePlayback(playback, totalFrames)}
        onStepChange={(s) => jumpToStep(playback, s)}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
