import { useMemo } from 'react';
import { PlaybackControls, usePlayback, type PlaybackState, type VisualizerProps } from '../../../../shared/viz';
import { DirectoryAuditSvg, type DirectoryAuditBar } from '../../shared/viz/DirectoryAuditSvg';
import { DEFAULT_MAX_TRACE_STEPS, DirectoryAuditTraceFrame, solver } from '../domain';

type TraceResult =
  | { readonly ok: true; readonly frames: readonly DirectoryAuditTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildTraceResult(rawInput: string): TraceResult {
  try {
    const tree = solver.parse(rawInput);
    const frames = solver.trace(tree, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function buildAuditBars(frame: DirectoryAuditTraceFrame): readonly DirectoryAuditBar[] {
  const bars: DirectoryAuditBar[] = [];
  for (let i = 0; i < frame.directories.length; i += 1) {
    const metrics = frame.directories[i]!;
    const status = i > frame.auditedIndex
      ? 'pending'
      : metrics.totalSize <= frame.threshold
        ? 'qualifying'
        : 'excluded';
    bars.push({ metrics, status });
  }
  return bars;
}

function handleTogglePlay(playback: PlaybackState, lastStep: number): void {
  if (!playback.isPlaying && playback.step >= lastStep) playback.setStep(0);
  playback.togglePlay();
}

function handleStepChange(playback: PlaybackState, nextStep: number): void {
  if (playback.isPlaying) playback.togglePlay();
  playback.setStep(nextStep);
}

function TelemetryHeader({ frame }: { readonly frame: DirectoryAuditTraceFrame }) {
  return (
    <div className="meta-row">
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Threshold ≤ {frame.threshold.toLocaleString('en-US')} B
      </span>
      <span className="badge">Audited: <code>{frame.auditedCount} / {frame.totalDirectories}</code></span>
      <span className="badge">Current: <code>{frame.current.path}</code> ({frame.current.totalSize.toLocaleString('en-US')} B)</span>
      <span className="badge">Qualifying: <code>{frame.qualifyingCount}</code></span>
      <span className={`badge ${frame.isComplete ? 'status-solved' : ''}`}>
        Running Sum: <strong>{frame.runningSum.toLocaleString('en-US')}</strong>
      </span>
      {frame.totalDirectories > frame.totalSteps && (
        <span className="muted">Sampled {frame.totalSteps} of {frame.totalDirectories} dirs</span>
      )}
    </div>
  );
}

/** Interactive log-scaled post-order directory size audit visualizer for 2022 Day 7 Part 1. */
export function DirectoryAuditVisualizer({ rawInput }: VisualizerProps) {
  const state = useMemo(() => buildTraceResult(rawInput), [rawInput]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, rawInput, 220);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>;
  }

  const bars = buildAuditBars(frame);
  return (
    <div>
      <TelemetryHeader frame={frame} />
      <DirectoryAuditSvg
        bars={bars}
        currentIndex={frame.auditedIndex}
        threshold={frame.threshold}
        thresholdLabel={`Limit ${frame.threshold.toLocaleString('en-US')} B`}
        maxSize={frame.rootTotalSize}
        accentColor="var(--accent)"
      />
      <PlaybackControls
        step={playback.step}
        totalSteps={frames.length}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={() => handleTogglePlay(playback, frames.length - 1)}
        onStepChange={(next) => handleStepChange(playback, next)}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
