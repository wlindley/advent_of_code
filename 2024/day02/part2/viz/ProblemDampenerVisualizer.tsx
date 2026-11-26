import { useMemo } from 'react';
import { sampleTraceIndices } from '../../../../shared/core';
import { PlaybackControls, usePlayback, type PlaybackState, type VisualizerProps } from '../../../../shared/viz';
import { DampenerEvaluation, DEFAULT_MAX_TRACE_STEPS, solver, type DampenerTraceFrame } from '../domain';
import { DampenedProfileSvg } from './DampenedProfileSvg';

const MAX_OVERVIEW_BARS = 72;
const MAX_WINDOW_ROWS = 5;

function rowBadge(ev: DampenerEvaluation, isDone: boolean): { readonly label: string; readonly color: string } {
  if (!isDone) return { label: 'pending', color: 'var(--muted)' };
  if (ev.outcome.kind === 'native-safe') return { label: 'native', color: 'var(--ok)' };
  if (ev.outcome.kind === 'dampened-safe') return { label: `drop [${ev.outcome.removedIndex}]`, color: 'var(--accent)' };
  return { label: 'unsafe', color: 'var(--gold)' };
}

function DampenedWindowRow({ evaluation, idx, y, activeIdx }: {
  readonly evaluation: DampenerEvaluation; readonly idx: number; readonly y: number; readonly activeIdx: number;
}) {
  const isActive = idx === activeIdx;
  const isDone = idx <= activeIdx;
  const badge = rowBadge(evaluation, isDone);
  const stroke = isActive ? 'var(--gold)' : isDone && evaluation.isSafe ? 'var(--ok)' : 'var(--border)';
  const levels = evaluation.report.levels;
  const preview = levels.slice(0, 6).join(' ') + (levels.length > 6 ? ' …' : '');
  return (
    <g>
      <rect x={16} y={y - 11} width={288} height={20} rx={5} fill="var(--surface)" stroke={stroke} strokeWidth={isActive ? 2 : 1} />
      <text x={24} y={y + 3} fontSize={10} fontWeight={700} fill={isActive ? 'var(--accent)' : 'var(--muted)'}>#{idx + 1}</text>
      <text x={58} y={y + 3} fontSize={10} fill="var(--text)">{preview}</text>
      <text x={296} y={y + 3} textAnchor="end" fontSize={10} fontWeight={700} fill={badge.color}>{badge.label}</text>
    </g>
  );
}

function DampenedOverviewStrip({ evaluations, scannedCount }: {
  readonly evaluations: readonly DampenerEvaluation[]; readonly scannedCount: number;
}) {
  const indices = sampleTraceIndices(evaluations.length, MAX_OVERVIEW_BARS);
  const colW = indices.length > 0 ? 288 / indices.length : 288;
  const activeIdx = scannedCount - 1;
  return (
    <g>
      <rect x={16} y={158} width={288} height={34} rx={4} fill="var(--bg)" stroke="var(--border)" />
      {indices.map((idx, slot) => {
        const ev = evaluations[idx]!;
        const isActive = idx === activeIdx;
        const scanned = idx < scannedCount;
        const fill = isActive ? 'var(--gold)' : !scanned ? 'var(--border)' : ev.outcome.kind === 'native-safe' ? 'var(--ok)' : ev.outcome.kind === 'dampened-safe' ? 'var(--accent)' : 'var(--muted)';
        const h = Math.min(26, Math.max(6, ev.report.length * 3));
        return <rect key={idx} x={18 + slot * colW} y={189 - h} width={Math.max(2, colW - 1)} height={h} rx={1} fill={fill} opacity={scanned ? 0.9 : 0.45} />;
      })}
    </g>
  );
}

function DampenedScanWindowSvg({ evaluations, scannedCount }: {
  readonly evaluations: readonly DampenerEvaluation[]; readonly scannedCount: number;
}) {
  const activeIdx = scannedCount - 1;
  const start = Math.max(0, Math.min(evaluations.length - MAX_WINDOW_ROWS, Math.max(0, activeIdx) - 2));
  const rows = evaluations.slice(start, Math.min(evaluations.length, start + MAX_WINDOW_ROWS));
  return (
    <svg viewBox="0 0 320 216" width={320} height={216} role="img" aria-label="Dampener scan window and overview strip" style={{ maxWidth: '100%', display: 'block' }}>
      <text x={16} y={15} fontSize={11} fontWeight={700} fill="var(--muted)">Dampener Scan Window ({evaluations.length} total)</text>
      {rows.map((evaluation, offset) => (
        <DampenedWindowRow key={start + offset} evaluation={evaluation} idx={start + offset} y={38 + offset * 24} activeIdx={activeIdx} />
      ))}
      <DampenedOverviewStrip evaluations={evaluations} scannedCount={scannedCount} />
      <text x={160} y={208} textAnchor="middle" fontSize={10} fill="var(--muted)">Overview (green = native, blue = dampened, gold = active)</text>
    </svg>
  );
}

function KpiRow({ frame }: { readonly frame: DampenerTraceFrame }) {
  const solvedClass = frame.scannedCount === frame.totalReports ? 'status-solved' : '';
  return (
    <div className="meta-row">
      <span className="badge">Scanned: {frame.scannedCount} / {frame.totalReports}</span>
      <span className="badge">Native Safe: {frame.nativeSafeCount}</span>
      <span className="badge">Dampened Safe: {frame.dampenedSafeCount}</span>
      <span className="badge">Unsafe: {frame.unsafeCount}</span>
      <span className={`badge ${solvedClass}`}>Total Safe: {frame.totalSafeCount}</span>
    </div>
  );
}

function parseDampenerState(rawInput: string) {
  try {
    const reports = solver.parse(rawInput);
    const evaluations = reports.map(DampenerEvaluation.evaluate);
    const frames = solver.trace!(reports, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true as const, evaluations, frames };
  } catch (error) {
    return { ok: false as const, message: error instanceof Error ? error.message : String(error) };
  }
}

function handleTogglePlay(playback: PlaybackState, totalSteps: number) {
  if (!playback.isPlaying && playback.step >= totalSteps - 1) playback.setStep(0);
  playback.togglePlay();
}

function handleStepChange(playback: PlaybackState, next: number) {
  if (playback.isPlaying) playback.togglePlay();
  playback.setStep(next);
}

export function ProblemDampenerVisualizer({ rawInput }: VisualizerProps) {
  const state = useMemo(() => parseDampenerState(rawInput), [rawInput]);
  const frames: readonly DampenerTraceFrame[] = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, rawInput, 260);
  if (!state.ok) return <p className="error-text">Unable to visualize input: {state.message}</p>;

  const frame = frames[playback.step]!;
  return (
    <div>
      <KpiRow frame={frame} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', margin: '0.5rem 0' }}>
        <DampenedProfileSvg evaluation={frame.activeEvaluation} />
        <DampenedScanWindowSvg evaluations={state.evaluations} scannedCount={frame.scannedCount} />
      </div>
      <PlaybackControls
        step={playback.step} totalSteps={frames.length} isPlaying={playback.isPlaying} speedMs={playback.speedMs}
        onTogglePlay={() => handleTogglePlay(playback, frames.length)}
        onStepChange={(next) => handleStepChange(playback, next)}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
