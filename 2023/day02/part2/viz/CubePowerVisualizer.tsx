import { useMemo } from 'react';
import {
  PlaybackControls,
  usePlayback,
  type PlaybackState,
  type VisualizerProps,
} from '../../../../shared/viz';
import { CUBE_COLORS, type CubeBag, type CubeColor } from '../../shared';
import { DEFAULT_MAX_TRACE_STEPS, solver, type CubePowerTraceFrame } from '../domain';

type TraceState =
  | { readonly ok: true; readonly frames: readonly CubePowerTraceFrame[]; readonly totalGames: number }
  | { readonly ok: false; readonly message: string };

const LANE_COLOR: Record<CubeColor, string> = {
  red: 'var(--err)',
  green: 'var(--ok)',
  blue: 'var(--accent)',
};

const BAR_X = 68;
const BAR_W = 360;

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
  if (!playback.isPlaying && playback.step >= totalFrames - 1) playback.setStep(0);
  playback.togglePlay();
}

function selectStep(playback: PlaybackState, nextStep: number): void {
  if (playback.isPlaying) playback.togglePlay();
  playback.setStep(nextStep);
}

function renderBagLane(color: CubeColor, count: number, maxScale: number, row: number) {
  const y = 10 + row * 32;
  const fillW = (count / maxScale) * BAR_W;
  return (
    <g key={color} transform={`translate(0, ${y})`}>
      <text x={4} y={14} fontSize={12} fontWeight={700} fill="var(--text)" style={{ textTransform: 'uppercase' }}>
        {color}
      </text>
      <rect x={BAR_X} y={1} width={BAR_W} height={18} rx={4} fill="var(--bg)" stroke="var(--border)" />
      <rect x={BAR_X} y={1} width={fillW} height={18} rx={4} fill={LANE_COLOR[color]} opacity={0.82} />
      <text x={BAR_X + BAR_W + 10} y={14} fontSize={12} fontWeight={700} fill="var(--text)">
        {count} min
      </text>
    </g>
  );
}

function renderMinimumBagChart(bag: CubeBag) {
  const maxScale = Math.max(1, bag.red, bag.green, bag.blue);
  return (
    <div style={{ padding: '0.6rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <svg viewBox="0 0 500 104" style={{ width: '100%', maxWidth: 620, display: 'block' }} role="img" aria-label="Minimum required cube counts per color">
        {CUBE_COLORS.map((color, idx) => renderBagLane(color, bag[color], maxScale, idx))}
      </svg>
      <div style={{ marginTop: '0.35rem', fontSize: '0.92rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--text)' }}>
        Power: {bag.red} &times; {bag.green} &times; {bag.blue} = <strong className="gold">{bag.power}</strong>
      </div>
    </div>
  );
}

function renderRevealsStrip(reveals: readonly CubeBag[], minBag: CubeBag) {
  return (
    <div className="meta-row" style={{ marginTop: '0.6rem' }}>
      {reveals.map((reveal, idx) => (
        <span key={idx} className="badge" style={{ background: 'var(--surface)', fontVariantNumeric: 'tabular-nums' }}>
          R{idx + 1}:{' '}
          {CUBE_COLORS.map((c, ci) => {
            const isPeak = minBag[c] > 0 && reveal[c] === minBag[c];
            return (
              <span key={c} style={{ color: isPeak ? 'var(--gold)' : 'var(--text)', fontWeight: isPeak ? 700 : 500 }}>
                {ci > 0 ? ' · ' : ''}{reveal[c]}{c[0]!.toUpperCase()}{isPeak ? '▲' : ''}
              </span>
            );
          })}
        </span>
      ))}
    </div>
  );
}

function renderPowerBar(
  item: CubePowerTraceFrame,
  idx: number,
  maxPower: number,
  slotW: number,
  barW: number,
  active: boolean,
  playback: PlaybackState,
) {
  const h = Math.max(3, (item.power / maxPower) * 58);
  return (
    <rect
      key={item.game.id}
      x={idx * slotW}
      y={61 - h}
      width={barW}
      height={h}
      rx={1.5}
      fill={active ? 'var(--gold)' : 'var(--accent)'}
      opacity={active ? 1 : 0.55}
      style={{ cursor: 'pointer' }}
      onClick={() => selectStep(playback, idx)}
    >
      <title>{`Game #${item.game.id}: power ${item.power}`}</title>
    </rect>
  );
}

function renderPowerChart(frames: readonly CubePowerTraceFrame[], activeIndex: number, playback: PlaybackState) {
  const maxPower = Math.max(1, ...frames.map((item) => item.power));
  const slotW = 500 / Math.max(1, frames.length);
  const barW = Math.max(1.5, slotW - (frames.length > 80 ? 0.5 : 3));
  return (
    <div style={{ marginTop: '0.5rem', padding: '0.45rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <div className="muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Sampled Game Powers (click a bar to inspect)</div>
      <svg viewBox="0 0 500 64" style={{ width: '100%', maxWidth: 620, display: 'block' }} role="img" aria-label="Sampled game powers bar chart">
        {frames.map((item, idx) => renderPowerBar(item, idx, maxPower, slotW, barW, idx === activeIndex, playback))}
      </svg>
    </div>
  );
}

function renderStatusBadges(frame: CubePowerTraceFrame, sampledCount: number, totalGames: number) {
  return (
    <div className="meta-row">
      <span className="badge">Game #{frame.game.id} ({frame.gameIndex + 1} / {frame.totalGames})</span>
      <span className="badge">Power: <strong>{frame.power}</strong></span>
      <span className="badge status-solved">Running Power Sum: <strong className="gold">{frame.runningPowerSum}</strong></span>
      {totalGames > sampledCount && <span className="muted">Sampled {sampledCount} of {totalGames} games</span>}
    </div>
  );
}

export function CubePowerVisualizer({ rawInput }: VisualizerProps) {
  const traceState = useMemo(() => buildTrace(rawInput), [rawInput]);
  const frames = traceState.ok ? traceState.frames : [];
  const playback = usePlayback(frames.length, rawInput, 280);

  if (!traceState.ok) {
    return <p className="error-text">Unable to visualize input: {traceState.message}</p>;
  }
  const frame = frames[playback.step]!;
  return (
    <div>
      {renderStatusBadges(frame, frames.length, traceState.totalGames)}
      {renderMinimumBagChart(frame.minimumBag)}
      {renderRevealsStrip(frame.game.reveals, frame.minimumBag)}
      {renderPowerChart(frames, playback.step, playback)}
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
