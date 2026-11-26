import { useMemo, type ReactElement } from 'react';
import { PlaybackControls, usePlayback, type PlaybackState, type VisualizerProps } from '../../../../shared/viz';
import { DEFAULT_MAX_TRACE_STEPS, solver, type SeedJourneyFrame } from '../domain';

interface Bounds { readonly min: bigint; readonly max: bigint; }

type TraceState =
  | { readonly ok: true; readonly frames: readonly SeedJourneyFrame[]; readonly categories: readonly string[]; readonly totalSeeds: number; readonly bounds: Bounds }
  | { readonly ok: false; readonly message: string };

const BOX_STYLE = { padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)' };
const CHART_W = 760;
const PAD_X = 52;
const TOP_Y = 24;
const PLOT_H = 196;

function computeBounds(frames: readonly SeedJourneyFrame[]): Bounds {
  let min = frames[0]!.seed;
  let max = min;
  for (const frame of frames) {
    for (const val of frame.stageValues) {
      if (val < min) min = val;
      if (val > max) max = val;
    }
  }
  return { min, max };
}

function buildTrace(rawInput: string): TraceState {
  try {
    const almanac = solver.parse(rawInput);
    const frames = solver.trace!(almanac, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, frames, categories: almanac.categories, totalSeeds: almanac.seeds.length, bounds: computeBounds(frames) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

export function normalizeBigInt(value: bigint, min: bigint, max: bigint): number {
  return max === min ? 0.5 : Number(((value - min) * 1000n) / (max - min)) / 1000;
}

function formatCompact(value: bigint): string {
  const s = value.toString();
  return s.length <= 7 ? s : `${s[0]}.${s.slice(1, 3)}e${s.length - 1}`;
}

function axisX(index: number, count: number): number {
  return count <= 1 ? CHART_W / 2 : PAD_X + (index * (CHART_W - 2 * PAD_X)) / (count - 1);
}

function valueY(value: bigint, bounds: Bounds): number {
  return TOP_Y + PLOT_H - normalizeBigInt(value, bounds.min, bounds.max) * PLOT_H;
}

function buildPolylinePoints(values: readonly bigint[], bounds: Bounds): string {
  const pts: string[] = [];
  for (let i = 0; i < values.length; i += 1) pts.push(`${axisX(i, values.length).toFixed(1)},${valueY(values[i]!, bounds).toFixed(1)}`);
  return pts.join(' ');
}

function togglePlayback(playback: PlaybackState, totalFrames: number): void {
  if (!playback.isPlaying && playback.step >= totalFrames - 1) playback.setStep(0);
  playback.togglePlay();
}

function selectStep(playback: PlaybackState, nextStep: number): void {
  if (playback.isPlaying) playback.togglePlay();
  playback.setStep(nextStep);
}

function renderBadgeStrip(frame: SeedJourneyFrame, totalSeeds: number, sampledCount: number) {
  return (
    <div className="meta-row">
      <span className="badge">Seed #{frame.seedIndex + 1} / {totalSeeds}: <strong>{frame.seed.toString()}</strong></span>
      <span className={`badge ${frame.isNewBest ? 'status-solved' : ''}`}>Location: <strong>{frame.location.toString()}</strong></span>
      <span className="badge">{frame.matchedRuleCount} / {frame.transitions.length} rules matched</span>
      <span className="badge">Best: <strong className="gold">{frame.bestLocation.toString()}</strong> (seed {frame.bestSeed.toString()})</span>
      {totalSeeds > sampledCount && <span className="muted">Sampled {sampledCount} of {totalSeeds} seeds</span>}
    </div>
  );
}

function buildAxes(categories: readonly string[]): ReactElement[] {
  const axes: ReactElement[] = [];
  for (let i = 0; i < categories.length; i += 1) {
    const x = axisX(i, categories.length);
    axes.push(<g key={categories[i]}><line x1={x} y1={TOP_Y} x2={x} y2={TOP_Y + PLOT_H} stroke="var(--border)" strokeWidth={1.2} /><text x={x} y={248} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--text)">{categories[i]}</text></g>);
  }
  return axes;
}

function buildPastAndBestLines(frames: readonly SeedJourneyFrame[], step: number, bounds: Bounds): ReactElement[] {
  const lines: ReactElement[] = [];
  let bestFrame = frames[0]!;
  for (let i = 0; i < step; i += 1) {
    const f = frames[i]!;
    if (f.location < bestFrame.location) bestFrame = f;
    lines.push(<polyline key={f.seedIndex} fill="none" stroke="var(--border)" strokeOpacity={0.55} strokeWidth={1.5} points={buildPolylinePoints(f.stageValues, bounds)} />);
  }
  if (step > 0 && bestFrame.seedIndex !== frames[step]!.seedIndex) {
    lines.push(<polyline key="best" fill="none" stroke="var(--gold)" strokeWidth={2.2} strokeDasharray="5 3" points={buildPolylinePoints(bestFrame.stageValues, bounds)} />);
  }
  return lines;
}

function renderJourneySvg(frames: readonly SeedJourneyFrame[], step: number, categories: readonly string[], bounds: Bounds) {
  const active = frames[step]!;
  const stroke = active.isNewBest ? 'var(--gold)' : 'var(--accent)';
  const nodes: ReactElement[] = [];
  for (let i = 0; i < active.stageValues.length; i += 1) {
    const matched = i > 0 && !active.transitions[i - 1]!.isIdentity;
    nodes.push(<circle key={i} cx={axisX(i, active.stageValues.length)} cy={valueY(active.stageValues[i]!, bounds)} r={4.5} fill={matched ? stroke : 'var(--surface)'} stroke={stroke} strokeWidth={2} />);
  }
  return (
    <div style={{ ...BOX_STYLE, marginTop: '0.5rem' }}>
      <svg viewBox={`0 0 ${CHART_W} 260`} style={{ width: '100%', display: 'block' }} role="img" aria-label="Parallel-coordinates seed journey">
        <text x={6} y={TOP_Y + 6} fontSize={10} fill="var(--muted)">{formatCompact(bounds.max)}</text>
        <text x={6} y={TOP_Y + PLOT_H} fontSize={10} fill="var(--muted)">{formatCompact(bounds.min)}</text>
        {buildAxes(categories)}{buildPastAndBestLines(frames, step, bounds)}
        <polyline fill="none" stroke={stroke} strokeWidth={2.8} points={buildPolylinePoints(active.stageValues, bounds)} />
        {nodes}
      </svg>
    </div>
  );
}

function renderStagePills(frame: SeedJourneyFrame) {
  const pills: ReactElement[] = [];
  for (const t of frame.transitions) {
    const delta = t.isIdentity ? 'id' : `${t.delta >= 0n ? '+' : ''}${t.delta}`;
    const style = { fontSize: '0.78rem', fontVariantNumeric: 'tabular-nums', borderColor: t.isIdentity ? 'var(--border)' : 'var(--ok)', color: t.isIdentity ? 'var(--muted)' : 'var(--text)' };
    pills.push(<span key={t.mapIndex} className="badge" style={style}>{t.sourceCategory}→{t.destCategory}: {t.input.toString()}→{t.output.toString()} ({delta})</span>);
  }
  return <div className="meta-row" style={{ marginTop: '0.5rem' }}>{pills}</div>;
}

function renderJumpStrip(frames: readonly SeedJourneyFrame[], activeIndex: number, playback: PlaybackState) {
  const start = Math.max(0, Math.min(activeIndex - 2, frames.length - 6));
  const slice = frames.slice(start, start + 6);
  const buttons: ReactElement[] = [];
  for (let offset = 0; offset < slice.length; offset += 1) {
    const item = slice[offset]!;
    const idx = start + offset;
    const active = idx === activeIndex;
    const style = { fontSize: '0.8rem', borderColor: active ? 'var(--accent)' : 'var(--border)', fontWeight: active ? 700 : 500, color: active ? 'var(--accent)' : 'var(--text)' };
    buttons.push(<button key={item.seedIndex} type="button" onClick={() => selectStep(playback, idx)} style={style}>S{item.seedIndex + 1} ({formatCompact(item.location)})</button>);
  }
  return <div className="meta-row" style={{ marginTop: '0.5rem' }}>{buttons}</div>;
}

export function AlmanacJourneyVisualizer({ rawInput }: VisualizerProps) {
  const traceState = useMemo(() => buildTrace(rawInput), [rawInput]);
  const frames = traceState.ok ? traceState.frames : [];
  const playback = usePlayback(frames.length, rawInput, 320);
  if (!traceState.ok) return <p className="error-text">Unable to visualize input: {traceState.message}</p>;
  if (frames.length === 0) return <p className="muted">No seeds to visualize.</p>;
  const frame = frames[playback.step]!;
  return (
    <div>
      {renderBadgeStrip(frame, traceState.totalSeeds, frames.length)}
      {renderJourneySvg(frames, playback.step, traceState.categories, traceState.bounds)}
      {renderStagePills(frame)}
      {renderJumpStrip(frames, playback.step, playback)}
      <PlaybackControls step={playback.step} totalSteps={frames.length} isPlaying={playback.isPlaying} speedMs={playback.speedMs} onTogglePlay={() => togglePlayback(playback, frames.length)} onStepChange={(next) => selectStep(playback, next)} onSpeedChange={playback.setSpeedMs} />
    </div>
  );
}
