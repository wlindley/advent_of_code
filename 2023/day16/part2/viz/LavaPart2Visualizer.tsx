import { useMemo } from 'react';
import { PlaybackControls, usePlayback, type PlaybackState, type VisualizerProps } from '../../../../shared/viz';
import { type BeamWaveFrame, type Contraption, DEFAULT_MAX_TRACE_STEPS, DIR_LABELS } from '../../shared';
import { ContraptionCanvas } from '../../shared/viz/ContraptionCanvas';
import { type PerimeterScanResult, solver, traceOptimalPerimeter } from '../domain';

type VizData =
  | { readonly ok: true; readonly contraption: Contraption; readonly scan: PerimeterScanResult; readonly frames: readonly BeamWaveFrame[] }
  | { readonly ok: false; readonly message: string };

function buildVizData(rawInput: string): VizData {
  try {
    const contraption = solver.parse(rawInput);
    const { scan, frames } = traceOptimalPerimeter(contraption, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, contraption, scan, frames };
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
  contraption, scan, frame,
}: {
  readonly contraption: Contraption;
  readonly scan: PerimeterScanResult;
  readonly frame: BeamWaveFrame;
}) {
  const best = scan.best;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
      <span className="badge">Grid: <strong>{contraption.height}×{contraption.width}</strong></span>
      <span className="badge">Entries: <strong>{scan.scores.length}</strong></span>
      <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
        Best: <strong>({best.entry.row}, {best.entry.col}) {DIR_LABELS[best.entry.dir]}</strong>
      </span>
      <span className="badge">Wave: <strong>{frame.wave + 1} / {frame.totalWaves}</strong></span>
      <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
        Frontier: <strong>{frame.frontier.length}</strong>
      </span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Energized: <strong>{frame.energizedCount} / {best.energizedCount}</strong>
      </span>
    </div>
  );
}

function LegendRow() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.9rem', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--text)' }}>
      <span><span style={{ color: 'var(--warn)', fontWeight: 700 }}>■</span> Energized lava &amp; beam</span>
      <span><span style={{ color: 'var(--accent)', fontWeight: 700 }}>●</span> Active frontier</span>
      <span><span style={{ color: 'var(--gold)', fontWeight: 700 }}>●</span> Perimeter score heatmap</span>
      <span><span style={{ color: 'var(--ok)', fontWeight: 700 }}>●</span> Optimal entry</span>
      <span><strong>/ \ | -</strong> Mirrors &amp; splitters</span>
    </div>
  );
}

/** Interactive perimeter-heatmap and optimal wavefront visualizer for AoC 2023 Day 16 Part 2. */
export function LavaPart2Visualizer({ rawInput }: VisualizerProps) {
  const data = useMemo(() => buildVizData(rawInput), [rawInput]);
  const totalFrames = data.ok ? data.frames.length : 0;
  const playback = usePlayback(totalFrames, rawInput, 140);
  const activeFrame = data.ok ? data.frames[playback.step] : undefined;

  if (!data.ok) return <p className="error-text" role="alert">Invalid contraption input: {data.message}</p>;
  if (!activeFrame) return <p className="muted">No beam wavefront frames available to visualize.</p>;

  const best = data.scan.best;
  return (
    <div className="stack">
      <TelemetryBadges contraption={data.contraption} scan={data.scan} frame={activeFrame} />
      <ContraptionCanvas contraption={data.contraption} frame={activeFrame} edgeScores={data.scan.scores} optimalEntry={best.entry} />
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
