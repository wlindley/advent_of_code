import { useMemo } from 'react';
import {
  PlaybackControls,
  usePlayback,
  type PlaybackState,
  type VisualizerProps,
} from '../../../../shared/viz';
import { CUBE_COLORS, type CubeBag, type CubeColor } from '../../shared';
import { DEFAULT_MAX_TRACE_STEPS, solver, type CubeGameTraceFrame } from '../domain';

type TraceState =
  | { readonly ok: true; readonly frames: readonly CubeGameTraceFrame[]; readonly totalGames: number }
  | { readonly ok: false; readonly message: string };

const LANE_COLOR: Record<CubeColor, string> = {
  red: 'var(--err)',
  green: 'var(--ok)',
  blue: 'var(--accent)',
};

const BAR_X = 72;
const BAR_W = 350;

function buildTrace(rawInput: string): TraceState {
  try {
    const games = solver.parse(rawInput);
    const frames = solver.trace!(games, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, frames, totalGames: games.length };
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

function renderLane(color: CubeColor, peak: number, limit: number, maxScale: number, row: number) {
  const y = 12 + row * 36;
  const fillW = (peak / maxScale) * BAR_W;
  const limitX = BAR_X + (limit / maxScale) * BAR_W;
  const over = peak > limit;
  return (
    <g key={color} transform={`translate(0, ${y})`}>
      <text x={4} y={15} fontSize={12} fontWeight={700} fill="var(--text)" style={{ textTransform: 'uppercase' }}>
        {color}
      </text>
      <rect x={BAR_X} y={1} width={BAR_W} height={20} rx={4} fill="var(--bg)" stroke="var(--border)" />
      <rect x={BAR_X} y={1} width={fillW} height={20} rx={4} fill={LANE_COLOR[color]} opacity={over ? 0.92 : 0.72} />
      <line x1={limitX} y1={-3} x2={limitX} y2={25} stroke="var(--text)" strokeWidth={1.75} strokeDasharray="3 2" />
      <text x={BAR_X + BAR_W + 10} y={15} fontSize={12} fontWeight={over ? 700 : 600} fill={over ? 'var(--err)' : 'var(--text)'}>
        {peak} / {limit} {over ? 'OVER' : ''}
      </text>
    </g>
  );
}

function renderPeakChart(peak: CubeBag, limits: CubeBag) {
  const maxScale = Math.max(20, peak.red, peak.green, peak.blue, limits.red, limits.green, limits.blue);
  return (
    <div style={{ padding: '0.6rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <svg viewBox="0 0 540 120" style={{ width: '100%', maxWidth: 640, display: 'block' }} role="img" aria-label="Peak cube counts versus bag limits">
        {CUBE_COLORS.map((color, idx) => renderLane(color, peak[color], limits[color], maxScale, idx))}
      </svg>
    </div>
  );
}

function renderRevealsStrip(reveals: readonly CubeBag[], limits: CubeBag) {
  return (
    <div className="meta-row" style={{ marginTop: '0.65rem' }}>
      {reveals.map((reveal, idx) => {
        const fits = reveal.fitsWithin(limits);
        return (
          <span
            key={idx}
            className={`badge ${fits ? '' : 'status-blocked'}`}
            style={{ background: 'var(--bg)', fontVariantNumeric: 'tabular-nums' }}
          >
            R{idx + 1}:{' '}
            {CUBE_COLORS.map((c, ci) => (
              <span key={c} style={{ color: reveal[c] > limits[c] ? 'var(--err)' : 'var(--text)', fontWeight: reveal[c] > limits[c] ? 700 : 500 }}>
                {ci > 0 ? ' · ' : ''}{reveal[c]}{c[0]!.toUpperCase()}
              </span>
            ))}
          </span>
        );
      })}
    </div>
  );
}

function renderHistoryWindow(frames: readonly CubeGameTraceFrame[], activeIndex: number, playback: PlaybackState) {
  const start = Math.max(0, Math.min(activeIndex - 3, frames.length - 6));
  const slice = frames.slice(start, start + 6);
  return (
    <div className="meta-row" style={{ marginTop: '0.5rem' }}>
      {slice.map((item, offset) => {
        const idx = start + offset;
        const active = idx === activeIndex;
        return (
          <button
            key={item.game.id}
            type="button"
            onClick={() => selectStep(playback, idx)}
            style={{
              fontSize: '0.8rem',
              borderColor: active ? 'var(--accent)' : 'var(--border)',
              fontWeight: active ? 700 : 500,
              color: active ? 'var(--accent)' : 'var(--text)',
            }}
          >
            G{item.game.id} {item.isPossible ? '✓' : '✕'}
          </button>
        );
      })}
    </div>
  );
}

export function CubeConundrumVisualizer({ rawInput }: VisualizerProps) {
  const traceState = useMemo(() => buildTrace(rawInput), [rawInput]);
  const frames = traceState.ok ? traceState.frames : [];
  const playback = usePlayback(frames.length, rawInput, 280);

  if (!traceState.ok) {
    return <p className="error-text">Unable to visualize input: {traceState.message}</p>;
  }
  const frame = frames[playback.step]!;
  return (
    <div>
      <div className="meta-row">
        <span className="badge">Game #{frame.game.id} ({frame.gameIndex + 1} / {frame.totalGames})</span>
        <span className={`badge ${frame.isPossible ? 'status-solved' : 'status-blocked'}`}>
          {frame.isPossible ? 'Possible' : `Impossible (${frame.exceededColors.join(', ')})`}
        </span>
        <span className="badge">Possible: <strong>{frame.possibleCount}</strong></span>
        <span className="badge">Running Sum: <strong className="gold">{frame.runningSum}</strong></span>
        {traceState.totalGames > frames.length && (
          <span className="muted">Sampled {frames.length} of {traceState.totalGames} games</span>
        )}
      </div>
      {renderPeakChart(frame.peakBag, frame.limits)}
      {renderRevealsStrip(frame.game.reveals, frame.limits)}
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
