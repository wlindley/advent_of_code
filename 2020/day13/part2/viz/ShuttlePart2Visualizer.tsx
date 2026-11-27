import { useMemo } from 'react';
import { PlaybackControls, usePlayback, type VisualizerProps } from '../../../../shared/viz';
import {
  computePart2Rows,
  DEFAULT_MAX_TRACE_STEPS,
  type CrtLockFrame,
  type Part2RowDatum,
} from '../../shared';
import { solver } from '../domain';

const SVG_WIDTH = 720;
const BAR_LEFT = 120;
const BAR_WIDTH = 390;
const TOP_PAD = 34;
const ROW_H = 30;
const BOTTOM_PAD = 18;

type TraceResult =
  | { readonly ok: true; readonly frames: readonly CrtLockFrame[] }
  | { readonly ok: false; readonly message: string };

function buildTrace(rawInput: string): TraceResult {
  try {
    const schedule = solver.parse(rawInput);
    return { ok: true, frames: solver.trace(schedule, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function formatCompactBigInt(value: bigint): string {
  const digits = value.toString();
  if (digits.length <= 12) return digits;
  return `${digits[0]}.${digits.slice(1, 4)}e+${digits.length - 1}`;
}

function pickRowColor(rowIndex: number, activeIndex: number): string {
  if (rowIndex < activeIndex) return 'var(--ok)';
  if (rowIndex === activeIndex) return 'var(--accent)';
  return 'var(--border)';
}

function CrtKpiBadges({ frame }: { readonly frame: CrtLockFrame }) {
  const stepClass = frame.isFinal ? 'status-solved' : 'status-in_progress';
  return (
    <div className="meta-row">
      <span className={`badge ${stepClass}`}>
        {`Lock ${frame.step} / ${frame.schedule.activeCount}${frame.isFinal ? ' · Final' : ''}`}
      </span>
      <span className="badge">{`Bus #${frame.currentBus.id} (+${frame.currentBus.offset}m)`}</span>
      <span className="badge">{`Modulus: ${frame.modulus} (${frame.modulusBits}-bit)`}</span>
      <span className={`badge ${frame.isFinal ? 'status-solved' : ''}`}>
        {`Timestamp t: ${frame.timestamp}`}
      </span>
    </div>
  );
}

function CrtLockBarRow({
  row,
  rowIndex,
  activeIndex,
}: {
  readonly row: Part2RowDatum;
  readonly rowIndex: number;
  readonly activeIndex: number;
}) {
  const y = TOP_PAD + rowIndex * ROW_H;
  const barW = Math.max(4, Math.round(row.logRatio * BAR_WIDTH));
  const fill = pickRowColor(rowIndex, activeIndex);
  const weight = rowIndex === activeIndex ? 700 : 500;
  return (
    <g>
      <text x={BAR_LEFT - 10} y={y + 15} textAnchor="end" fontSize={12} fontWeight={weight} fill="var(--text)">
        {`#${row.bus.id} (+${row.bus.offset})`}
      </text>
      <rect x={BAR_LEFT} y={y + 2} width={BAR_WIDTH} height={18} rx={4} fill="var(--surface)" stroke="var(--border)" />
      <rect x={BAR_LEFT} y={y + 2} width={barW} height={18} rx={4} fill={fill} />
      <text x={BAR_LEFT + BAR_WIDTH + 10} y={y + 15} fontSize={11} fontWeight={weight} fill="var(--text)">
        {`M=${formatCompactBigInt(row.modulus)} (${row.modulusBits}b)`}
      </text>
    </g>
  );
}

function CrtModulusLockSvg({ rows, activeIndex }: { readonly rows: readonly Part2RowDatum[]; readonly activeIndex: number }) {
  const finalRow = rows[rows.length - 1]!;
  const svgHeight = TOP_PAD + rows.length * ROW_H + BOTTOM_PAD;
  return (
    <svg className="chart-svg" viewBox={`0 0 ${SVG_WIDTH} ${svgHeight}`} role="img" aria-label="CRT incremental modulus locking progression">
      <text x={BAR_LEFT} y={18} fontSize={11} fill="var(--muted)">{'log₂(M) = 0'}</text>
      <text x={BAR_LEFT + BAR_WIDTH} y={18} textAnchor="end" fontSize={11} fill="var(--muted)">{`Final: ${finalRow.modulusBits} bits`}</text>
      {rows.map((row, idx) => (
        <CrtLockBarRow key={row.step} row={row} rowIndex={idx} activeIndex={activeIndex} />
      ))}
    </svg>
  );
}

/** Interactive Part 2 CRT modulus locking visualizer for AoC 2020 Day 13. */
export function ShuttlePart2Visualizer({ rawInput }: VisualizerProps) {
  const state = useMemo(() => buildTrace(rawInput), [rawInput]);
  const frames = state.ok ? state.frames : [];
  const rows = useMemo(() => computePart2Rows(frames), [frames]);
  const playback = usePlayback(frames.length, rawInput, 350);
  const frame = frames[playback.step];

  if (!state.ok || !frame || rows.length === 0) {
    return (
      <div className="stack">
        <p className="error-text">{`Unable to visualize input: ${state.ok ? 'No trace frames' : state.message}`}</p>
      </div>
    );
  }

  return (
    <div className="stack">
      <CrtKpiBadges frame={frame} />
      <CrtModulusLockSvg rows={rows} activeIndex={playback.step} />
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
