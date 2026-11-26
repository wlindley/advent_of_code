import { useMemo } from 'react';
import { PlaybackControls, usePlayback, type PlaybackState, type VisualizerProps } from '../../../../shared/viz';
import { type BeamWaveFrame, type Contraption, DEFAULT_MAX_TRACE_STEPS, DIR_LABELS } from '../../shared';
import { ContraptionCanvas } from '../../shared/viz/ContraptionCanvas';
import { solver } from '../domain';

type VizData =
  | { readonly ok: true; readonly contraption: Contraption; readonly frames: readonly BeamWaveFrame[]; readonly finalEnergized: number }
  | { readonly ok: false; readonly message: string };

function buildVizData(rawInput: string): VizData {
  try {
    const contraption = solver.parse(rawInput);
    const frames = solver.trace?.(contraption, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) ?? [];
    const last = frames[frames.length - 1];
    return { ok: true, contraption, frames, finalEnergized: last ? last.energizedCount : solver.solve(contraption) };
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
  contraption, frame, finalEnergized,
}: {
  readonly contraption: Contraption;
  readonly frame: BeamWaveFrame;
  readonly finalEnergized: number;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
      <span className="badge">Grid: <strong>{contraption.height}×{contraption.width}</strong></span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Entry: <strong>({frame.entry.row}, {frame.entry.col}) {DIR_LABELS[frame.entry.dir]}</strong>
      </span>
      <span className="badge">Wave: <strong>{frame.wave + 1} / {frame.totalWaves}</strong></span>
      <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
        Frontier: <strong>{frame.frontier.length}</strong>
      </span>
      <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
        Energized: <strong>{frame.energizedCount} / {finalEnergized}</strong>
      </span>
    </div>
  );
}

function LegendRow() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.9rem', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--text)' }}>
      <span><span style={{ color: 'var(--warn)', fontWeight: 700 }}>■</span> Energized lava &amp; beam</span>
      <span><span style={{ color: 'var(--accent)', fontWeight: 700 }}>●</span> Active frontier &amp; entry</span>
      <span><strong>/ \ | -</strong> Optical mirrors &amp; splitters</span>
    </div>
  );
}

/** Interactive wavefront laser-tracing visualizer for AoC 2023 Day 16 Part 1. */
export function LavaPart1Visualizer({ rawInput }: VisualizerProps) {
  const data = useMemo(() => buildVizData(rawInput), [rawInput]);
  const totalFrames = data.ok ? data.frames.length : 0;
  const playback = usePlayback(totalFrames, rawInput, 140);
  const activeFrame = data.ok ? data.frames[playback.step] : undefined;

  if (!data.ok) return <p className="error-text" role="alert">Invalid contraption input: {data.message}</p>;
  if (!activeFrame) return <p className="muted">No beam wavefront frames available to visualize.</p>;

  return (
    <div className="stack">
      <TelemetryBadges contraption={data.contraption} frame={activeFrame} finalEnergized={data.finalEnergized} />
      <ContraptionCanvas contraption={data.contraption} frame={activeFrame} />
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
