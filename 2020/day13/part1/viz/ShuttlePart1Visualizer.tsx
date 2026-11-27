import { useMemo } from 'react';
import { PlaybackControls, usePlayback, type VisualizerProps } from '../../../../shared/viz';
import {
  computeMaxWait,
  computePart1Bars,
  computeWaitBarRatio,
  DEFAULT_MAX_TRACE_STEPS,
  type EarliestBusFrame,
  type Part1BarDatum,
} from '../../shared';
import { solver } from '../domain';

const SVG_WIDTH = 720;
const BAR_LEFT = 120;
const BAR_WIDTH = 390;
const TOP_PAD = 34;
const ROW_H = 30;
const BOTTOM_PAD = 22;

type TraceResult =
  | { readonly ok: true; readonly frames: readonly EarliestBusFrame[] }
  | { readonly ok: false; readonly message: string };

function buildTrace(rawInput: string): TraceResult {
  try {
    const schedule = solver.parse(rawInput);
    return { ok: true, frames: solver.trace(schedule, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function pickBarColor(bar: Part1BarDatum): string {
  if (bar.isBest) return 'var(--ok)';
  if (bar.isCurrent) return 'var(--accent)';
  if (bar.isEvaluated) return 'var(--muted)';
  return 'var(--border)';
}

function ShuttleKpiBadges({ frame }: { readonly frame: EarliestBusFrame }) {
  const stepClass = frame.isFinal ? 'status-solved' : 'status-in_progress';
  return (
    <div className="meta-row">
      <span className={`badge ${stepClass}`}>
        {`Bus ${frame.step} / ${frame.schedule.activeCount}${frame.isFinal ? ' · Final' : ''}`}
      </span>
      <span className="badge">{`t0: ${frame.schedule.earliestTimestamp}`}</span>
      <span className="badge">{`Current: #${frame.currentBus.id} (+${frame.currentWait}m)`}</span>
      <span className="badge status-solved">{`Best: #${frame.bestBus.id} (+${frame.bestWait}m)`}</span>
      <span className={`badge ${frame.isFinal ? 'status-solved' : ''}`}>
        {`Product: ${frame.product}`}
      </span>
    </div>
  );
}

function TimetableBarRow({ bar, rowIndex }: { readonly bar: Part1BarDatum; readonly rowIndex: number }) {
  const y = TOP_PAD + rowIndex * ROW_H;
  const barW = Math.max(4, Math.round(bar.ratio * BAR_WIDTH));
  const fill = pickBarColor(bar);
  const weight = bar.isBest || bar.isCurrent ? 700 : 500;
  return (
    <g>
      <text x={BAR_LEFT - 10} y={y + 15} textAnchor="end" fontSize={12} fontWeight={weight} fill="var(--text)">
        {`Bus ${bar.bus.id}`}
      </text>
      <rect x={BAR_LEFT} y={y + 2} width={BAR_WIDTH} height={18} rx={4} fill="var(--surface)" stroke="var(--border)" />
      <rect x={BAR_LEFT} y={y + 2} width={barW} height={18} rx={4} fill={fill} />
      <text x={BAR_LEFT + BAR_WIDTH + 10} y={y + 15} fontSize={11} fontWeight={weight} fill="var(--text)">
        {`+${bar.wait}m (dep ${bar.departure})`}
      </text>
    </g>
  );
}

function DepartureTimetableSvg({ frame }: { readonly frame: EarliestBusFrame }) {
  const bars = computePart1Bars(frame);
  const maxWait = computeMaxWait(frame.schedule);
  const bestX = BAR_LEFT + Math.round(computeWaitBarRatio(frame.bestWait, maxWait) * BAR_WIDTH);
  const svgHeight = TOP_PAD + bars.length * ROW_H + BOTTOM_PAD;
  return (
    <svg className="chart-svg" viewBox={`0 0 ${SVG_WIDTH} ${svgHeight}`} role="img" aria-label="Shuttle departure wait timetable">
      <text x={BAR_LEFT} y={18} fontSize={11} fill="var(--muted)">{`0m (t0=${frame.schedule.earliestTimestamp})`}</text>
      <text x={BAR_LEFT + BAR_WIDTH} y={18} textAnchor="end" fontSize={11} fill="var(--muted)">{`Max wait: +${maxWait}m`}</text>
      {bars.map((bar, idx) => (
        <TimetableBarRow key={bar.bus.id.toString()} bar={bar} rowIndex={idx} />
      ))}
      <line x1={bestX} y1={TOP_PAD - 6} x2={bestX} y2={svgHeight - BOTTOM_PAD + 4} stroke="var(--gold)" strokeWidth={2} strokeDasharray="4 3" />
      <text x={bestX} y={svgHeight - 6} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--gold)">
        {`Best wait: +${frame.bestWait}m`}
      </text>
    </svg>
  );
}

/** Interactive Part 1 departure wait timetable visualizer for AoC 2020 Day 13. */
export function ShuttlePart1Visualizer({ rawInput }: VisualizerProps) {
  const state = useMemo(() => buildTrace(rawInput), [rawInput]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, rawInput, 350);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return (
      <div className="stack">
        <p className="error-text">{`Unable to visualize input: ${state.ok ? 'No trace frames' : state.message}`}</p>
      </div>
    );
  }

  return (
    <div className="stack">
      <ShuttleKpiBadges frame={frame} />
      <DepartureTimetableSvg frame={frame} />
      <PlaybackControls
        step={playback.step}
        totalSteps={frames.length}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={playback.togglePlay}
        onStepChange={playback.setStep}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
