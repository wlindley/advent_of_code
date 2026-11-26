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
  padding: '0.05rem 0.3rem',
  borderRadius: '4px',
  fontWeight: 700,
  background: 'var(--surface)',
  margin: '0 0.08rem',
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

function handleTogglePlay(playback: PlaybackState, totalFrames: number): void {
  if (!playback.isPlaying && playback.step >= totalFrames - 1) {
    playback.setStep(0);
  }
  playback.togglePlay();
}

function selectStep(playback: PlaybackState, nextStep: number): void {
  if (playback.isPlaying) playback.togglePlay();
  playback.setStep(nextStep);
}

function renderSpanChip(slice: string, colorVar: string, margin?: string) {
  return (
    <span style={{ ...CHIP_BASE, margin: margin ?? CHIP_BASE.margin, border: `2px solid ${colorVar}`, color: colorVar }}>
      {slice}
    </span>
  );
}

function renderHighlightedLine(cal: LineCalibration) {
  const { text, first, last, isSingleDigit } = cal;
  const hasOverlap = !isSingleDigit && first.end > last.start;
  return (
    <div style={{ padding: '0.85rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', overflowX: 'auto' }}>
      <code style={{ fontSize: '1.08rem', color: 'var(--text)', whiteSpace: 'pre' }}>
        <span className="muted">{text.slice(0, first.start)}</span>
        {isSingleDigit && renderSpanChip(text.slice(first.start, first.end), 'var(--gold)')}
        {!isSingleDigit && !hasOverlap && (
          <>
            {renderSpanChip(text.slice(first.start, first.end), 'var(--accent)')}
            <span className="muted">{text.slice(first.end, last.start)}</span>
            {renderSpanChip(text.slice(last.start, last.end), 'var(--ok)')}
          </>
        )}
        {hasOverlap && (
          <>
            {renderSpanChip(text.slice(first.start, last.start), 'var(--accent)', '0')}
            {renderSpanChip(text.slice(last.start, first.end), 'var(--gold)', '0')}
            {renderSpanChip(text.slice(first.end, last.end), 'var(--ok)', '0')}
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

function renderTelemetryRow(frame: CalibrationTraceFrame, sampledCount: number, totalLines: number) {
  const cal = frame.calibration;
  const firstToken = cal.text.slice(cal.first.start, cal.first.end);
  const lastToken = cal.text.slice(cal.last.start, cal.last.end);
  const hasOverlap = !cal.isSingleDigit && cal.first.end > cal.last.start;
  return (
    <div className="meta-row">
      <span className="badge">Line {cal.lineNumber} / {frame.totalLines}</span>
      <span className="badge status-solved">
        Tokens: <code>{firstToken}</code> ({cal.first.value}) + <code>{lastToken}</code> ({cal.last.value}) → <strong>{cal.value}</strong>
        {cal.isSingleDigit && ' (reused)'}
        {hasOverlap && ' (overlap)'}
      </span>
      <span className="badge">Running Sum: <strong className="gold">{frame.runningSum}</strong></span>
      {totalLines > sampledCount && (
        <span className="muted">Sampled {sampledCount} of {totalLines} lines</span>
      )}
    </div>
  );
}

export function SpelledCalibrationVisualizer({ rawInput }: VisualizerProps) {
  const traceState = useMemo(() => buildTrace(rawInput), [rawInput]);
  const frames = traceState.ok ? traceState.frames : [];
  const playback = usePlayback(frames.length, rawInput, 280);

  if (!traceState.ok) {
    return <p className="error-text">Unable to visualize input: {traceState.message}</p>;
  }

  const frame = frames[playback.step]!;
  return (
    <div>
      {renderTelemetryRow(frame, frames.length, traceState.totalLines)}
      {renderHighlightedLine(frame.calibration)}
      {renderHistoryWindow(frames, playback.step, playback)}
      <PlaybackControls
        step={playback.step}
        totalSteps={frames.length}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={() => handleTogglePlay(playback, frames.length)}
        onStepChange={(next) => selectStep(playback, next)}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
