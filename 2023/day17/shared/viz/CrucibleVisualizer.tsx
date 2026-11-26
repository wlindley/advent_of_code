import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, type PlaybackState, usePlayback } from '../../../../shared/viz';
import { type CrucibleRule, type CrucibleTraceFrame, DEFAULT_MAX_TRACE_STEPS, type HeatMap } from '../index';
import { CrucibleCanvas } from './CrucibleCanvas';

export interface CrucibleVisualizerProps {
  readonly rawInput: string;
  readonly solver: PuzzleSolver<HeatMap, number, CrucibleTraceFrame>;
  readonly rule: CrucibleRule;
  readonly partLabel: string;
}

type VizData =
  | { readonly ok: true; readonly map: HeatMap; readonly frames: readonly CrucibleTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildVizData(
  rawInput: string,
  solver: PuzzleSolver<HeatMap, number, CrucibleTraceFrame>,
): VizData {
  try {
    const map = solver.parse(rawInput);
    const frames = solver.trace?.(map, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) ?? [];
    return { ok: true, map, frames };
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
  map, frame, partLabel,
}: {
  readonly map: HeatMap;
  readonly frame: CrucibleTraceFrame;
  readonly partLabel: string;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
      <span className="badge">Grid: <strong>{map.height}×{map.width}</strong></span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Rule: <strong>{partLabel}</strong>
      </span>
      <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
        Heat Wave: <strong>{frame.heatThreshold} / {frame.result.goalHeat}</strong>
      </span>
      <span className="badge">
        Settled: <strong>{frame.settledCount} / {map.size}</strong>
      </span>
      <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
        Optimal Heat: <strong>{frame.result.goalHeat}</strong>
      </span>
      <span className="badge">Turns: <strong>{frame.result.turnCount}</strong></span>
    </div>
  );
}

function LegendRow() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.9rem', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--text)' }}>
      <span><span style={{ color: 'var(--warn)', fontWeight: 700 }}>■</span> Settled thermal wavefront</span>
      <span><span style={{ color: 'var(--gold)', fontWeight: 700 }}>□</span> Active frontier &amp; turns</span>
      <span><span style={{ color: 'var(--accent)', fontWeight: 700 }}>━</span> Optimal route</span>
      <span><span style={{ color: 'var(--ok)', fontWeight: 700 }}>●</span> Start (S) / <span style={{ color: 'var(--warn)', fontWeight: 700 }}>●</span> Goal (G)</span>
    </div>
  );
}

/** Shared interactive iso-heat wavefront and optimal-route visualizer for Day 17 Parts 1 & 2. */
export function CrucibleVisualizer({ rawInput, solver, rule: _rule, partLabel }: CrucibleVisualizerProps) {
  const data = useMemo(() => buildVizData(rawInput, solver), [rawInput, solver]);
  const totalFrames = data.ok ? data.frames.length : 0;
  const playback = usePlayback(totalFrames, rawInput, 120);
  const activeFrame = data.ok ? data.frames[playback.step] : undefined;
  const prevThreshold = data.ok && playback.step > 0 ? data.frames[playback.step - 1]!.heatThreshold : -1;

  if (!data.ok) return <p className="error-text" role="alert">Invalid heat map input: {data.message}</p>;
  if (!activeFrame) return <p className="muted">No wavefront frames available to visualize.</p>;

  return (
    <div className="stack">
      <TelemetryBadges map={data.map} frame={activeFrame} partLabel={partLabel} />
      <CrucibleCanvas map={data.map} frame={activeFrame} prevThreshold={prevThreshold} />
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
