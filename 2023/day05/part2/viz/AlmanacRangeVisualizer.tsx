import { useMemo, type ReactElement } from 'react';
import type { ClosedInterval } from '../../../../shared/core';
import { PlaybackControls, usePlayback, type PlaybackState, type VisualizerProps } from '../../../../shared/viz';
import { DEFAULT_MAX_TRACE_STEPS, solver, type FlowRibbon, type IntervalStageFrame } from '../domain';

interface Bounds { readonly min: bigint; readonly max: bigint; }

type TraceState =
  | { readonly ok: true; readonly frames: readonly IntervalStageFrame[]; readonly categories: readonly string[]; readonly bounds: Bounds }
  | { readonly ok: false; readonly message: string };

const CHART_W = 760;
const PAD_X = 52;
const TOP_Y = 24;
const PLOT_H = 196;
const MIN_BAND_PX = 2.5;
const MAX_SVG_RIBBONS_PER_STAGE = 240;
const BOX_STYLE = { padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)' };

function formatCompact(value: bigint): string {
  const s = value.toString();
  return s.length <= 7 ? s : `${s[0]}.${s.slice(1, 3)}e${s.length - 1}`;
}

export function normalizeBigInt(value: bigint, min: bigint, max: bigint): number {
  return max === min ? 0.5 : Number(((value - min) * 1000n) / (max - min)) / 1000;
}

function computeBounds(frames: readonly IntervalStageFrame[]): Bounds {
  let min = frames[0]!.ribbons[0]!.source.start;
  let max = min;
  for (const frame of frames) {
    for (const r of frame.ribbons) {
      for (const p of [r.source.start, r.source.end, r.destination.start, r.destination.end]) {
        if (p < min) min = p;
        if (p > max) max = p;
      }
    }
  }
  return { min, max };
}

function buildTrace(rawInput: string): TraceState {
  try {
    const almanac = solver.parse(rawInput);
    const frames = solver.trace!(almanac, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, frames, categories: almanac.categories, bounds: computeBounds(frames) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function axisX(index: number, count: number): number {
  return count <= 1 ? CHART_W / 2 : PAD_X + (index * (CHART_W - 2 * PAD_X)) / (count - 1);
}

function intervalBandY(iv: ClosedInterval, bounds: Bounds): readonly [number, number] {
  const yTop = TOP_Y + PLOT_H - normalizeBigInt(iv.end, bounds.min, bounds.max) * PLOT_H;
  const yBot = TOP_Y + PLOT_H - normalizeBigInt(iv.start, bounds.min, bounds.max) * PLOT_H;
  if (yBot - yTop >= MIN_BAND_PX) return [yTop, yBot];
  const mid = (yTop + yBot) / 2;
  const half = MIN_BAND_PX / 2;
  return [Math.max(TOP_Y, mid - half), Math.min(TOP_Y + PLOT_H, mid + half)];
}

function capRibbons(ribbons: readonly FlowRibbon[], minOut: bigint): readonly FlowRibbon[] {
  if (ribbons.length <= MAX_SVG_RIBBONS_PER_STAGE) return ribbons;
  const kept: FlowRibbon[] = [];
  const rest: FlowRibbon[] = [];
  for (const r of ribbons) {
    if (r.destination.start === minOut) kept.push(r);
    else rest.push(r);
  }
  const budget = Math.max(0, MAX_SVG_RIBBONS_PER_STAGE - kept.length);
  for (let i = 0; i < budget && i < rest.length; i += 1) kept.push(rest[Math.floor((i * rest.length) / budget)]!);
  return kept;
}

function ribbonPath(x1: number, x2: number, s: readonly [number, number], d: readonly [number, number]): string {
  const cx = (x1 + x2) / 2;
  return `M ${x1} ${s[0]} C ${cx} ${s[0]}, ${cx} ${d[0]}, ${x2} ${d[0]} L ${x2} ${d[1]} C ${cx} ${d[1]}, ${cx} ${s[1]}, ${x1} ${s[1]} Z`;
}

function renderStageRibbons(frame: IntervalStageFrame, count: number, bounds: Bounds, active: boolean): ReactElement[] {
  const x1 = axisX(frame.stageIndex, count);
  const x2 = axisX(frame.stageIndex + 1, count);
  const minOut = frame.minOutput;
  const list = capRibbons(frame.ribbons, minOut);
  const paths: ReactElement[] = [];
  for (let i = 0; i < list.length; i += 1) {
    const r = list[i]!;
    const isMin = r.destination.start === minOut;
    const fill = isMin ? 'var(--gold)' : r.isIdentity ? 'var(--muted)' : 'var(--accent)';
    const opacity = active ? (isMin ? 0.65 : r.isIdentity ? 0.25 : 0.45) : isMin ? 0.35 : 0.16;
    const d = ribbonPath(x1, x2, intervalBandY(r.source, bounds), intervalBandY(r.destination, bounds));
    paths.push(<path key={`${frame.stageIndex}-${i}`} d={d} fill={fill} fillOpacity={opacity} stroke={isMin ? 'var(--gold)' : 'none'} strokeWidth={isMin ? 1 : 0} />);
  }
  return paths;
}

function renderAxisBars(x: number, intervals: readonly ClosedInterval[], bounds: Bounds, color: string, keyPrefix: string): ReactElement[] {
  const bars: ReactElement[] = [];
  for (let i = 0; i < intervals.length; i += 1) {
    const [yTop, yBot] = intervalBandY(intervals[i]!, bounds);
    bars.push(<line key={`${keyPrefix}-${i}`} x1={x} y1={yTop} x2={x} y2={yBot} stroke={color} strokeWidth={4.5} strokeLinecap="round" />);
  }
  return bars;
}

function renderFlowSvg(frames: readonly IntervalStageFrame[], step: number, categories: readonly string[], bounds: Bounds) {
  const axes: ReactElement[] = [];
  for (let i = 0; i < categories.length; i += 1) {
    const x = axisX(i, categories.length);
    axes.push(<g key={categories[i]}><line x1={x} y1={TOP_Y} x2={x} y2={TOP_Y + PLOT_H} stroke="var(--border)" strokeWidth={1.2} /><text x={x} y={246} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--text)">{categories[i]}</text></g>);
  }
  const ribbons: ReactElement[] = [];
  const bars: ReactElement[] = [...renderAxisBars(axisX(frames[0]!.stageIndex, categories.length), frames[0]!.input.intervals, bounds, 'var(--text)', 'in0')];
  for (let i = 0; i <= step; i += 1) {
    const f = frames[i]!;
    ribbons.push(...renderStageRibbons(f, categories.length, bounds, i === step));
    bars.push(...renderAxisBars(axisX(f.stageIndex + 1, categories.length), f.output.intervals, bounds, i === step ? 'var(--gold)' : 'var(--accent)', `out-${i}`));
  }
  return (
    <div style={{ ...BOX_STYLE, marginTop: '0.5rem' }}>
      <svg viewBox={`0 0 ${CHART_W} 272`} style={{ width: '100%', display: 'block' }} role="img" aria-label="Interval split and ribbon flow across almanac stages">
        <text x={6} y={TOP_Y + 8} fontSize={10} fill="var(--muted)">{formatCompact(bounds.max)}</text>
        <text x={6} y={TOP_Y + PLOT_H} fontSize={10} fill="var(--muted)">{formatCompact(bounds.min)}</text>
        {axes}{ribbons}{bars}
      </svg>
    </div>
  );
}

function togglePlayback(playback: PlaybackState, totalFrames: number): void {
  if (!playback.isPlaying && playback.step >= totalFrames - 1) playback.setStep(0);
  playback.togglePlay();
}

function selectStep(playback: PlaybackState, nextStep: number): void {
  if (playback.isPlaying) playback.togglePlay();
  playback.setStep(nextStep);
}

function renderJumpStrip(frames: readonly IntervalStageFrame[], activeIdx: number, playback: PlaybackState) {
  const buttons: ReactElement[] = [];
  for (let i = 0; i < frames.length; i += 1) {
    const f = frames[i]!;
    const active = i === activeIdx;
    const style = { fontSize: '0.78rem', borderColor: active ? 'var(--accent)' : 'var(--border)', fontWeight: active ? 700 : 500, color: active ? 'var(--accent)' : 'var(--text)' };
    buttons.push(<button key={f.stageIndex} type="button" onClick={() => selectStep(playback, i)} style={style}>{f.stageIndex + 1}. {f.destCategory}</button>);
  }
  return <div className="meta-row" style={{ marginTop: '0.5rem' }}>{buttons}</div>;
}

export function AlmanacRangeVisualizer({ rawInput }: VisualizerProps) {
  const traceState = useMemo(() => buildTrace(rawInput), [rawInput]);
  const frames = traceState.ok ? traceState.frames : [];
  const playback = usePlayback(frames.length, rawInput, 650);
  if (!traceState.ok) return <p className="error-text">Unable to visualize input: {traceState.message}</p>;
  if (frames.length === 0) return <p className="muted">No stages to visualize.</p>;
  const frame = frames[playback.step]!;
  return (
    <div>
      <div className="meta-row">
        <span className="badge">Stage {frame.stageIndex + 1} / {frame.totalStages}: <strong>{frame.sourceCategory} → {frame.destCategory}</strong></span>
        <span className="badge">Bands: <strong>{frame.input.intervals.length}</strong> → <strong>{frame.output.intervals.length}</strong> ({frame.ribbons.length} ribbons)</span>
        <span className="badge">{frame.matchedRibbonCount} shifted, {frame.identityRibbonCount} identity</span>
        <span className="badge status-solved">Min Output: <strong className="gold">{frame.minOutput.toString()}</strong></span>
      </div>
      {renderFlowSvg(frames, playback.step, traceState.categories, traceState.bounds)}
      {renderJumpStrip(frames, playback.step, playback)}
      <PlaybackControls step={playback.step} totalSteps={frames.length} isPlaying={playback.isPlaying} speedMs={playback.speedMs} onTogglePlay={() => togglePlayback(playback, frames.length)} onStepChange={(next) => selectStep(playback, next)} onSpeedChange={playback.setSpeedMs} />
    </div>
  );
}
