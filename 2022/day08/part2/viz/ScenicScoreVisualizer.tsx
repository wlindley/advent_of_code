import { useMemo, useState } from 'react';
import { PlaybackControls, usePlayback, type PlaybackState, type VisualizerProps } from '../../../../shared/viz';
import { CARDINAL_DIR, CARDINAL_DIRS, type ForestGrid } from '../../shared';
import { CanopySightlineSvg } from '../../shared/viz/CanopySightlineSvg';
import { DEFAULT_MAX_TRACE_STEPS, ScenicTraceFrame, solver } from '../domain';

type HighlightMode = 'scanned' | 'ridges';
type TraceResult =
  | { readonly ok: true; readonly forest: ForestGrid; readonly frames: readonly ScenicTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildTraceResult(rawInput: string): TraceResult {
  try {
    const forest = solver.parse(rawInput);
    return { ok: true, forest, frames: solver.trace(forest, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) };
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

function isCellActive(frame: ScenicTraceFrame, mode: HighlightMode, row: number, col: number): boolean {
  if (!frame.isInteriorScanned(row, col)) return false;
  if (mode === 'scanned') return true;
  if (frame.bestScore <= 0) return false;
  return Math.log1p(frame.sightlines.scenicScore(row, col)) / Math.log1p(frame.bestScore) >= 0.5;
}

function TelemetryHeader({ frame }: { readonly frame: ScenicTraceFrame }) {
  return (
    <div className="meta-row">
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Row scan: <code>{frame.scannedRow + 1} / {frame.totalRawSteps}</code>
      </span>
      <span
        className={`badge ${frame.isComplete ? 'status-solved' : ''}`}
        style={frame.improvedOnRow ? { borderColor: 'var(--gold)', color: 'var(--gold)' } : undefined}
      >
        Best: <strong>{frame.bestScore}</strong> at ({frame.bestRow},{frame.bestCol}) h={frame.bestHeight}
      </span>
      {frame.improvedOnRow && (
        <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>New leader</span>
      )}
      {frame.totalRawSteps > frame.totalSteps && (
        <span className="muted">Sampled {frame.totalSteps} of {frame.totalRawSteps} rows</span>
      )}
    </div>
  );
}

function ScoreControlsBar({
  frame,
  focusCoord,
  isPinned,
  highlightMode,
  onModeChange,
  onFocusBest,
}: {
  readonly frame: ScenicTraceFrame;
  readonly focusCoord: readonly [number, number];
  readonly isPinned: boolean;
  readonly highlightMode: HighlightMode;
  readonly onModeChange: (mode: HighlightMode) => void;
  readonly onFocusBest: () => void;
}) {
  const [r, c] = focusCoord;
  const dists = CARDINAL_DIRS.map((d) => frame.sightlines.distanceAt(r, c, d));
  const score = frame.sightlines.scenicScore(r, c);
  return (
    <div className="meta-row" style={{ justifyContent: 'space-between' }}>
      <span className="badge" style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}>
        {isPinned ? 'Pinned' : 'Champion'} ({r},{c}): <code>{dists.join(' × ')} = {score}</code>
      </span>
      <div className="playback-buttons">
        <button type="button" className={highlightMode === 'scanned' ? 'primary' : undefined} onClick={() => onModeChange('scanned')}>Scanned</button>
        <button type="button" className={highlightMode === 'ridges' ? 'primary' : undefined} onClick={() => onModeChange('ridges')}>Ridges</button>
        <button type="button" onClick={onFocusBest} disabled={!isPinned}>Focus Best</button>
      </div>
    </div>
  );
}

function ScenicCanvas({
  forest,
  frame,
  highlightMode,
  focusCoord,
  onSelectCoord,
}: {
  readonly forest: ForestGrid;
  readonly frame: ScenicTraceFrame;
  readonly highlightMode: HighlightMode;
  readonly focusCoord: readonly [number, number];
  readonly onSelectCoord: (coord: readonly [number, number] | null) => void;
}) {
  return (
    <CanopySightlineSvg
      forest={forest}
      sightlines={frame.sightlines}
      mode="scenic"
      isCellHighlighted={(r, c) => isCellActive(frame, highlightMode, r, c)}
      wavefront={frame.isComplete ? null : { dir: CARDINAL_DIR.UP, coord: frame.scannedRow }}
      selectedCoord={focusCoord}
      onSelectCoord={onSelectCoord}
    />
  );
}

/** Interactive row-major scenic-score champion scanner and 4-way sightline inspector. */
export function ScenicScoreVisualizer({ rawInput }: VisualizerProps) {
  const [pinnedCoord, setPinnedCoord] = useState<readonly [number, number] | null>(null);
  const [highlightMode, setHighlightMode] = useState<HighlightMode>('ridges');
  const state = useMemo(() => buildTraceResult(rawInput), [rawInput]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, rawInput, 200);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>;
  }
  const validPinned = pinnedCoord && state.forest.inBounds(pinnedCoord[0], pinnedCoord[1]) ? pinnedCoord : null;
  const focusCoord: readonly [number, number] = validPinned ?? [frame.bestRow, frame.bestCol];

  return (
    <div>
      <TelemetryHeader frame={frame} />
      <ScoreControlsBar frame={frame} focusCoord={focusCoord} isPinned={validPinned !== null} highlightMode={highlightMode} onModeChange={setHighlightMode} onFocusBest={() => setPinnedCoord(null)} />
      <ScenicCanvas forest={state.forest} frame={frame} highlightMode={highlightMode} focusCoord={focusCoord} onSelectCoord={setPinnedCoord} />
      <PlaybackControls step={playback.step} totalSteps={frames.length} isPlaying={playback.isPlaying} speedMs={playback.speedMs} onTogglePlay={() => handleTogglePlay(playback, frames.length - 1)} onStepChange={(next) => handleStepChange(playback, next)} onSpeedChange={playback.setSpeedMs} />
    </div>
  );
}
