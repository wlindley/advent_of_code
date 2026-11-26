import { useMemo } from 'react';
import {
  PlaybackControls,
  usePlayback,
  type PlaybackState,
  type VisualizerProps,
} from '../../../../shared/viz';
import type { LineCalibration } from '../../shared';
import { DEFAULT_MAX_TRACE_STEPS, solver, type CalibrationTraceFrame } from '../domain';

type TraceState =
  | { readonly ok: true; readonly frames: readonly CalibrationTraceFrame[]; readonly totalLines: number }
  | { readonly ok: false; readonly message: string };

const CHIP_BASE = {
  display: 'inline-block',
  padding: '0.05rem 0.35rem',
  borderRadius: '4px',
  fontWeight: 700,
  background: 'var(--surface)',
  margin: '0 0.1rem',
} as const;

function buildTrace(rawInput: string): TraceState {
  try {
    const doc = solver.parse(rawInput);
    const frames = solver.trace!(doc, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, frames, totalLines: doc.lineCount };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function togglePlayback(playback: PlaybackState, totalFrames: number): void {
  if (!playback.isPlaying && playback.step >= totalFrames - 1) {
    playback.setStep(0);
  }
  playback.togglePlay();
}

function selectStep(playback: PlaybackState, nextStep: number): void {
  if (playback.isPlaying) playback.togglePlay();
  playback.setStep(nextStep);
}

function renderHighlightedLine(cal: LineCalibration) {
  const { text, first, last, isSingleDigit } = cal;
  const firstText = text.slice(first.start, first.end);
  return (
    <div style={{ padding: '0.85rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', overflowX: 'auto' }}>
      <code style={{ fontSize: '1.1rem', color: 'var(--text)', whiteSpace: 'pre' }}>
        <span className="muted">{text.slice(0, first.start)}</span>
        <span style={{ ...CHIP_BASE, border: `2px solid ${isSingleDigit ? 'var(--gold)' : 'var(--accent)'}`, color: isSingleDigit ? 'var(--gold)' : 'var(--accent)' }}>
          {firstText}
        </span>
        {!isSingleDigit && (
          <>
            <span className="muted">{text.slice(first.end, last.start)}</span>
            <span style={{ ...CHIP_BASE, border: '2px solid var(--ok)', color: 'var(--ok)' }}>
              {text.slice(last.start, last.end)}
            </span>
          </>
        )}
        <span className="muted">{text.slice(last.end)}</span>
      </code>
    </div>
  );
}

function renderHistoryWindow(
  frames: readonly CalibrationTraceFrame[],
  activeIndex: number,
  playback: PlaybackState,
) {
  const start = Math.max(0, Math.min(activeIndex - 3, frames.length - 6));
  const slice = frames.slice(start, start + 6);
  return (
    <div className="meta-row" style={{ marginTop: '0.75rem' }}>
      {slice.map((item, offset) => {
        const idx = start + offset;
        const active = idx === activeIndex;
        return (
          <button
            key={item.calibration.lineNumber}
            type="button"
            onClick={() => selectStep(playback, idx)}
            style={{
              fontSize: '0.8rem',
              borderColor: active ? 'var(--accent)' : 'var(--border)',
              fontWeight: active ? 700 : 500,
              color: active ? 'var(--accent)' : 'var(--text)',
            }}
          >
            L{item.calibration.lineNumber}: {item.calibration.value}
          </button>
        );
      })}
    </div>
  );
}

export function CalibrationScannerVisualizer({ rawInput }: VisualizerProps) {
  const traceState = useMemo(() => buildTrace(rawInput), [rawInput]);
  const frames = traceState.ok ? traceState.frames : [];
  const playback = usePlayback(frames.length, rawInput, 280);

  if (!traceState.ok) {
    return <p className="error-text">Unable to visualize input: {traceState.message}</p>;
  }

  const frame = frames[playback.step]!;
  const cal = frame.calibration;
  return (
    <div>
      <div className="meta-row">
        <span className="badge">Line {cal.lineNumber} / {frame.totalLines}</span>
        <span className="badge status-solved">
          Digits: <code>{cal.first.value}</code> + <code>{cal.last.value}</code> → <strong>{cal.value}</strong>
          {cal.isSingleDigit && ' (reused)'}
        </span>
        <span className="badge">Running Sum: <strong className="gold">{frame.runningSum}</strong></span>
        {traceState.totalLines > frames.length && (
          <span className="muted">Sampled {frames.length} of {traceState.totalLines} lines</span>
        )}
      </div>
      {renderHighlightedLine(cal)}
      {renderHistoryWindow(frames, playback.step, playback)}
      <PlaybackControls
        step={playback.step}
        totalSteps={frames.length}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={() => togglePlayback(playback, frames.length)}
        onStepChange={(next) => selectStep(playback, next)}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
