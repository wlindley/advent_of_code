import { useMemo } from 'react';
import { PlaybackControls, usePlayback, type PlaybackState, type VisualizerProps } from '../../../../shared/viz';
import { DirectoryAuditSvg, type DirectoryAuditBar } from '../../shared/viz/DirectoryAuditSvg';
import { DEFAULT_MAX_TRACE_STEPS, DirectoryDeletionTraceFrame, solver } from '../domain';

type TraceResult =
  | { readonly ok: true; readonly frames: readonly DirectoryDeletionTraceFrame[] }
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

function buildAuditBars(frame: DirectoryDeletionTraceFrame): readonly DirectoryAuditBar[] {
  const bars: DirectoryAuditBar[] = [];
  const bestIdx = frame.bestIndex;
  for (let i = 0; i < frame.directories.length; i += 1) {
    const metrics = frame.directories[i]!;
    const status = i > frame.auditedIndex
      ? 'pending'
      : i === bestIdx
        ? 'best'
        : metrics.totalSize >= frame.neededSpace
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

function formatBestBadge(frame: DirectoryDeletionTraceFrame): string {
  if (!frame.bestCandidate || frame.bestSize === null) return 'None';
  return `${frame.bestCandidate.path} (${frame.bestSize.toLocaleString('en-US')} B)`;
}

function TelemetryHeader({ frame }: { readonly frame: DirectoryDeletionTraceFrame }) {
  return (
    <div className="meta-row">
      <span className="badge">Used: <code>{frame.rootTotalSize.toLocaleString('en-US')} B</code></span>
      <span className="badge">Free: <code>{frame.unusedSpace.toLocaleString('en-US')} B</code></span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Need &ge; {frame.neededSpace.toLocaleString('en-US')} B
      </span>
      <span className="badge">Audited: <code>{frame.auditedCount} / {frame.totalDirectories}</code></span>
      <span className="badge">Current: <code>{frame.current.path}</code> ({frame.current.totalSize.toLocaleString('en-US')} B)</span>
      <span className="badge">Qualifying: <code>{frame.qualifyingCount}</code></span>
      <span className={`badge ${frame.isComplete ? 'status-solved' : ''}`}>
        Best: <strong>{formatBestBadge(frame)}</strong>
      </span>
      {frame.totalDirectories > frame.totalSteps && (
        <span className="muted">Sampled {frame.totalSteps} of {frame.totalDirectories} dirs</span>
      )}
    </div>
  );
}

/** Interactive log-scaled post-order directory deletion visualizer for 2022 Day 7 Part 2. */
export function DirectoryDeletionVisualizer({ rawInput }: VisualizerProps) {
  const state = useMemo(() => buildTraceResult(rawInput), [rawInput]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, rawInput, 220);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>;
  }

  return (
    <div>
      <TelemetryHeader frame={frame} />
      <DirectoryAuditSvg
        bars={buildAuditBars(frame)}
        currentIndex={frame.auditedIndex}
        threshold={frame.neededSpace}
        thresholdLabel={`Need ${frame.neededSpace.toLocaleString('en-US')} B`}
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
