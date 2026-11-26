import { useMemo, type ReactElement } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, usePlayback, type PlaybackState } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  DEFAULT_PARABOLA_SEGMENTS,
  ratioBigInt,
  sampleRaceParabola,
  type BoatRace,
  type ParabolaSample,
  type RaceSheet,
  type RaceTraceFrame,
} from '../index';

export interface RaceParabolaVisualizerProps {
  readonly rawInput: string;
  readonly solver: PuzzleSolver<RaceSheet, bigint, RaceTraceFrame>;
}

type TraceState =
  | { readonly ok: true; readonly frames: readonly RaceTraceFrame[]; readonly totalRaces: number }
  | { readonly ok: false; readonly message: string };

const CHART_W = 760;
const CHART_H = 270;
const PAD_L = 74;
const PLOT_W = CHART_W - PAD_L - 28;
const TOP_Y = 26;
const PLOT_H = 188;
const BASE_Y = TOP_Y + PLOT_H;
const BOX_STYLE = { padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)' };

function buildTrace(rawInput: string, solver: PuzzleSolver<RaceSheet, bigint, RaceTraceFrame>): TraceState {
  try {
    const sheet = solver.parse(rawInput);
    return { ok: true, frames: solver.trace!(sheet, { maxSteps: DEFAULT_MAX_TRACE_STEPS }), totalRaces: sheet.races.length };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function formatCompact(value: bigint): string {
  const s = value.toString();
  return s.length <= 7 ? s : `${s[0]}.${s.slice(1, 3)}e${s.length - 1}`;
}

function toSvgX(xRatio: number): number { return PAD_L + xRatio * PLOT_W; }
function toSvgY(yRatio: number): number { return BASE_Y - yRatio * PLOT_H; }

function togglePlayback(playback: PlaybackState, totalFrames: number): void {
  if (!playback.isPlaying && playback.step >= totalFrames - 1) playback.setStep(0);
  playback.togglePlay();
}

function selectStep(playback: PlaybackState, nextStep: number): void {
  if (playback.isPlaying) playback.togglePlay();
  playback.setStep(nextStep);
}

function buildCurvePoints(samples: readonly ParabolaSample[]): string {
  const pts: string[] = [];
  for (const s of samples) pts.push(`${toSvgX(s.xRatio).toFixed(1)},${toSvgY(s.yRatio).toFixed(1)}`);
  return pts.join(' ');
}

function buildWinningCapPoints(samples: readonly ParabolaSample[], recordY: number, xStart: number, xEnd: number): string {
  const pts: string[] = [`${xStart.toFixed(1)},${recordY.toFixed(1)}`];
  for (const s of samples) {
    if (s.isWinner) pts.push(`${toSvgX(s.xRatio).toFixed(1)},${toSvgY(s.yRatio).toFixed(1)}`);
  }
  pts.push(`${xEnd.toFixed(1)},${recordY.toFixed(1)}`);
  return pts.join(' ');
}

function renderBadgeStrip(frame: RaceTraceFrame, totalRaces: number, sampled: number) {
  const { race, winningRange } = frame;
  const rangeLabel = winningRange ? `[${formatCompact(winningRange.start)}..${formatCompact(winningRange.end)}]` : 'none';
  return (
    <div className="meta-row">
      <span className="badge">Race #{frame.raceIndex + 1} / {totalRaces}</span>
      <span className="badge">T: <strong>{formatCompact(race.time)}</strong></span>
      <span className="badge">Record: <strong>{formatCompact(race.recordDistance)}</strong></span>
      <span className="badge">Peak: <strong className="gold">{formatCompact(race.maxDistance)}</strong></span>
      <span className={`badge ${frame.hasWinners ? 'status-solved' : 'status-blocked'}`}>Ways: <strong>{formatCompact(frame.waysToWin)}</strong> ({rangeLabel})</span>
      <span className="badge">Product: <strong>{formatCompact(frame.runningProduct)}</strong></span>
      {totalRaces > sampled && <span className="muted">Sampled {sampled} of {totalRaces} races</span>}
    </div>
  );
}

function renderLatticeDots(race: BoatRace, samples: readonly ParabolaSample[]): ReactElement[] | null {
  if (race.time > BigInt(DEFAULT_PARABOLA_SEGMENTS)) return null;
  const dots: ReactElement[] = [];
  for (const s of samples) {
    dots.push(<circle key={s.holdTime.toString()} cx={toSvgX(s.xRatio)} cy={toSvgY(s.yRatio)} r={s.isWinner ? 4 : 3} fill={s.isWinner ? 'var(--ok)' : 'var(--surface)'} stroke={s.isWinner ? 'var(--ok)' : 'var(--border)'} strokeWidth={1.6} />);
  }
  return dots;
}

function renderWinningGuides(race: BoatRace, samples: readonly ParabolaSample[], recordY: number) {
  const range = race.winningRange;
  if (!range) return null;
  const xStart = toSvgX(ratioBigInt(range.start, race.time));
  const xEnd = toSvgX(ratioBigInt(range.end, race.time));
  return (
    <>
      <polygon points={buildWinningCapPoints(samples, recordY, xStart, xEnd)} fill="var(--ok)" fillOpacity={0.14} />
      <line x1={xStart} y1={recordY} x2={xStart} y2={BASE_Y} stroke="var(--ok)" strokeDasharray="3 3" strokeWidth={1.2} />
      <line x1={xEnd} y1={recordY} x2={xEnd} y2={BASE_Y} stroke="var(--ok)" strokeDasharray="3 3" strokeWidth={1.2} />
      <text x={(xStart + xEnd) / 2} y={BASE_Y + 18} textAnchor="middle" fontSize={10} fontWeight={600} fill="var(--ok)">{`${formatCompact(range.start)}..${formatCompact(range.end)}`}</text>
    </>
  );
}

function renderParabolaSvg(race: BoatRace, samples: readonly ParabolaSample[]) {
  const yMax = race.maxDistance > race.recordDistance ? race.maxDistance : race.recordDistance;
  const recordY = toSvgY(ratioBigInt(race.recordDistance, yMax));
  const peakX = toSvgX(ratioBigInt(race.peakHold, race.time));
  const peakY = toSvgY(ratioBigInt(race.maxDistance, yMax));
  return (
    <div style={{ ...BOX_STYLE, marginTop: '0.5rem' }}>
      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} style={{ width: '100%', display: 'block' }} role="img" aria-label="Boat distance parabola">
        <line x1={PAD_L} y1={TOP_Y} x2={PAD_L} y2={BASE_Y} stroke="var(--border)" strokeWidth={1.2} />
        <line x1={PAD_L} y1={BASE_Y} x2={PAD_L + PLOT_W} y2={BASE_Y} stroke="var(--border)" strokeWidth={1.2} />
        {renderWinningGuides(race, samples, recordY)}
        <line x1={PAD_L} y1={recordY} x2={PAD_L + PLOT_W} y2={recordY} stroke="var(--gold)" strokeDasharray="6 4" strokeWidth={1.6} />
        <polyline fill="none" stroke="var(--accent)" strokeWidth={2.5} points={buildCurvePoints(samples)} />
        {renderLatticeDots(race, samples)}
        <line x1={peakX} y1={peakY} x2={peakX} y2={BASE_Y} stroke="var(--gold)" strokeDasharray="2 3" strokeWidth={1} />
        <circle cx={peakX} cy={peakY} r={4.5} fill="var(--gold)" stroke="var(--surface)" strokeWidth={1.5} />
        <text x={PAD_L - 8} y={TOP_Y + 4} textAnchor="end" fontSize={10} fill="var(--muted)">{formatCompact(yMax)}</text>
        <text x={PAD_L - 8} y={recordY + 3} textAnchor="end" fontSize={10} fontWeight={600} fill="var(--gold)">D={formatCompact(race.recordDistance)}</text>
        <text x={PAD_L - 8} y={BASE_Y} textAnchor="end" fontSize={10} fill="var(--muted)">0</text>
        <text x={PAD_L} y={BASE_Y + 18} textAnchor="middle" fontSize={10} fill="var(--muted)">0</text>
        <text x={PAD_L + PLOT_W} y={BASE_Y + 18} textAnchor="middle" fontSize={10} fill="var(--muted)">{formatCompact(race.time)}</text>
        <text x={peakX} y={BASE_Y + 36} textAnchor="middle" fontSize={10} fontWeight={600} fill="var(--gold)">peak {formatCompact(race.peakHold)}</text>
      </svg>
    </div>
  );
}

function renderJumpStrip(frames: readonly RaceTraceFrame[], activeIndex: number, playback: PlaybackState) {
  if (frames.length <= 1) return null;
  const start = Math.max(0, Math.min(activeIndex - 3, frames.length - 8));
  const slice = frames.slice(start, start + 8);
  const buttons: ReactElement[] = [];
  for (let i = 0; i < slice.length; i += 1) {
    const item = slice[i]!;
    const idx = start + i;
    const active = idx === activeIndex;
    const style = { fontSize: '0.8rem', borderColor: active ? 'var(--accent)' : 'var(--border)', fontWeight: active ? 700 : 500, color: active ? 'var(--accent)' : 'var(--text)' };
    buttons.push(<button key={item.raceIndex} type="button" onClick={() => selectStep(playback, idx)} style={style}>R{item.raceIndex + 1} ({formatCompact(item.waysToWin)})</button>);
  }
  return <div className="meta-row" style={{ marginTop: '0.5rem' }}>{buttons}</div>;
}

export function RaceParabolaVisualizer({ rawInput, solver }: RaceParabolaVisualizerProps) {
  const traceState = useMemo(() => buildTrace(rawInput, solver), [rawInput, solver]);
  const frames = traceState.ok ? traceState.frames : [];
  const playback = usePlayback(frames.length, rawInput, 450);
  const activeFrame = frames[playback.step];
  const samples = useMemo(() => (activeFrame ? sampleRaceParabola(activeFrame.race, DEFAULT_PARABOLA_SEGMENTS) : []), [activeFrame]);
  if (!traceState.ok) return <p className="error-text">Unable to visualize input: {traceState.message}</p>;
  if (!activeFrame) return <p className="muted">No races to visualize.</p>;
  return (
    <div>
      {renderBadgeStrip(activeFrame, traceState.totalRaces, frames.length)}
      {renderParabolaSvg(activeFrame.race, samples)}
      {renderJumpStrip(frames, playback.step, playback)}
      <PlaybackControls step={playback.step} totalSteps={frames.length} isPlaying={playback.isPlaying} speedMs={playback.speedMs} onTogglePlay={() => togglePlayback(playback, frames.length)} onStepChange={(next) => selectStep(playback, next)} onSpeedChange={playback.setSpeedMs} />
    </div>
  );
}
