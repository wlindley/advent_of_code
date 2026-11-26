import { useMemo } from 'react';
import { sampleTraceIndices } from '../../../../shared/core';
import { PlaybackControls, usePlayback, type VisualizerProps } from '../../../../shared/viz';
import { type Report } from '../../shared';
import { DEFAULT_MAX_TRACE_STEPS, solver, type ReportScanTraceFrame } from '../domain';

const MAX_OVERVIEW_BARS = 72;
const MAX_WINDOW_ROWS = 5;

function toPointX(idx: number, count: number): number {
  return count <= 1 ? 160 : 28 + (idx / (count - 1)) * 264;
}

function toPointY(val: number, minVal: number, span: number): number {
  return 168 - ((val - minVal) / span) * 116;
}

function ProfileElements({ levels, minVal, span, failIdx }: {
  readonly levels: readonly number[]; readonly minVal: number; readonly span: number; readonly failIdx: number | null;
}) {
  return (
    <g>
      {levels.map((val, idx) => {
        const x1 = toPointX(idx, levels.length);
        const y1 = toPointY(val, minVal, span);
        const hasNext = idx < levels.length - 1;
        const x2 = hasNext ? toPointX(idx + 1, levels.length) : x1;
        const y2 = hasNext ? toPointY(levels[idx + 1]!, minVal, span) : y1;
        const stepColor = failIdx === idx ? 'var(--gold)' : failIdx !== null && idx > failIdx ? 'var(--border)' : 'var(--ok)';
        const dotColor = failIdx === idx || failIdx === idx - 1 ? 'var(--gold)' : 'var(--accent)';
        return (
          <g key={idx}>
            {hasNext && <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stepColor} strokeWidth={failIdx === idx ? 3 : 2} />}
            <circle cx={x1} cy={y1} r={4.5} fill="var(--surface)" stroke={dotColor} strokeWidth={2} />
            <text x={x1} y={y1 - 9} textAnchor="middle" fontSize={10} fontWeight={600} fill="var(--text)">{val}</text>
          </g>
        );
      })}
    </g>
  );
}

function ReportProfileSvg({ report }: { readonly report: Report | null }) {
  const failure = report ? report.firstFailure() : null;
  const minVal = report && report.length > 0 ? Math.min(...report.levels) : 0;
  const maxVal = report && report.length > 0 ? Math.max(...report.levels) : 1;
  const statusLabel = !report ? 'Ready' : failure ? `Unsafe: ${failure.reason} (Δ${failure.delta})` : 'Safe';
  const statusColor = !report ? 'var(--muted)' : failure ? 'var(--gold)' : 'var(--ok)';
  return (
    <svg viewBox="0 0 320 216" width={320} height={216} role="img" aria-label="Active report level profile" style={{ maxWidth: '100%', display: 'block' }}>
      <rect x={12} y={24} width={296} height={168} rx={6} fill="var(--bg)" stroke="var(--border)" />
      <text x={16} y={15} fontSize={11} fontWeight={700} fill="var(--muted)">Active Report Profile</text>
      <text x={304} y={15} textAnchor="end" fontSize={11} fontWeight={700} fill={statusColor}>{statusLabel}</text>
      {report && report.length > 0 ? (
        <ProfileElements levels={report.levels} minVal={minVal} span={Math.max(1, maxVal - minVal)} failIdx={failure ? failure.index : null} />
      ) : (
        <text x={160} y={112} textAnchor="middle" fontSize={11} fill="var(--muted)">Step forward to inspect a report</text>
      )}
      <text x={160} y={208} textAnchor="middle" fontSize={10} fill="var(--muted)">Level sequence index (left → right)</text>
    </svg>
  );
}

function ScanWindowRow({ report, idx, y, activeIdx }: {
  readonly report: Report; readonly idx: number; readonly y: number; readonly activeIdx: number;
}) {
  const isActive = idx === activeIdx;
  const isDone = idx <= activeIdx;
  const status = !isDone ? 'pending' : report.isSafe ? 'safe' : report.firstFailure()!.reason;
  const stroke = isActive ? 'var(--gold)' : isDone && report.isSafe ? 'var(--ok)' : 'var(--border)';
  const badgeColor = !isDone ? 'var(--muted)' : report.isSafe ? 'var(--ok)' : 'var(--gold)';
  const preview = report.levels.slice(0, 6).join(' ') + (report.length > 6 ? ' …' : '');
  return (
    <g>
      <rect x={16} y={y - 11} width={288} height={20} rx={5} fill="var(--surface)" stroke={stroke} strokeWidth={isActive ? 2 : 1} />
      <text x={24} y={y + 3} fontSize={10} fontWeight={700} fill={isActive ? 'var(--accent)' : 'var(--muted)'}>#{idx + 1}</text>
      <text x={58} y={y + 3} fontSize={10} fill="var(--text)">{preview}</text>
      <text x={296} y={y + 3} textAnchor="end" fontSize={10} fontWeight={700} fill={badgeColor}>{status}</text>
    </g>
  );
}

function OverviewStrip({ reports, scannedCount }: { readonly reports: readonly Report[]; readonly scannedCount: number }) {
  const indices = sampleTraceIndices(reports.length, MAX_OVERVIEW_BARS);
  const colW = indices.length > 0 ? 288 / indices.length : 288;
  const activeIdx = scannedCount - 1;
  return (
    <g>
      <rect x={16} y={158} width={288} height={34} rx={4} fill="var(--bg)" stroke="var(--border)" />
      {indices.map((idx, slot) => {
        const rep = reports[idx]!;
        const isActive = idx === activeIdx;
        const scanned = idx < scannedCount;
        const fill = isActive ? 'var(--gold)' : !scanned ? 'var(--border)' : rep.isSafe ? 'var(--ok)' : 'var(--accent)';
        const h = Math.min(26, Math.max(6, rep.length * 3));
        return <rect key={idx} x={18 + slot * colW} y={189 - h} width={Math.max(2, colW - 1)} height={h} rx={1} fill={fill} opacity={scanned ? 0.9 : 0.45} />;
      })}
    </g>
  );
}

function ReportScanWindowSvg({ reports, scannedCount }: { readonly reports: readonly Report[]; readonly scannedCount: number }) {
  const activeIdx = scannedCount - 1;
  const start = Math.max(0, Math.min(reports.length - MAX_WINDOW_ROWS, Math.max(0, activeIdx) - 2));
  const rows = reports.slice(start, Math.min(reports.length, start + MAX_WINDOW_ROWS));
  return (
    <svg viewBox="0 0 320 216" width={320} height={216} role="img" aria-label="Report scan window and overview strip" style={{ maxWidth: '100%', display: 'block' }}>
      <text x={16} y={15} fontSize={11} fontWeight={700} fill="var(--muted)">Report Scan Window ({reports.length} total)</text>
      {rows.map((report, offset) => (
        <ScanWindowRow key={start + offset} report={report} idx={start + offset} y={38 + offset * 24} activeIdx={activeIdx} />
      ))}
      <OverviewStrip reports={reports} scannedCount={scannedCount} />
      <text x={160} y={208} textAnchor="middle" fontSize={10} fill="var(--muted)">72-bar sampled overview (green = safe, blue = unsafe, gold = active)</text>
    </svg>
  );
}

function parseTraceState(rawInput: string) {
  try {
    const reports = solver.parse(rawInput);
    return { ok: true as const, reports, frames: solver.trace!(reports, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) };
  } catch (error) {
    return { ok: false as const, message: error instanceof Error ? error.message : String(error) };
  }
}

export function ReportSafetyVisualizer({ rawInput }: VisualizerProps) {
  const state = useMemo(() => parseTraceState(rawInput), [rawInput]);
  const frames: readonly ReportScanTraceFrame[] = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, rawInput, 260);
  if (!state.ok) return <p className="error-text">Unable to visualize input: {state.message}</p>;

  const frame = frames[playback.step]!;
  return (
    <div>
      <div className="meta-row">
        <span className="badge">Scanned: {frame.scannedCount} / {frame.totalReports}</span>
        <span className="badge">{frame.activeReport ? `Report #${frame.scannedCount}: ${frame.activeReport.levels.join(' ')}` : 'Start (0 scanned)'}</span>
        <span className={`badge ${frame.scannedCount === frame.totalReports ? 'status-solved' : ''}`}>Safe Reports: {frame.safeCount}</span>
        {state.reports.length >= DEFAULT_MAX_TRACE_STEPS && <span className="muted">Sampled {frames.length} frames of {state.reports.length} reports</span>}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', margin: '0.5rem 0' }}>
        <ReportProfileSvg report={frame.activeReport} />
        <ReportScanWindowSvg reports={state.reports} scannedCount={frame.scannedCount} />
      </div>
      <PlaybackControls
        step={playback.step} totalSteps={frames.length} isPlaying={playback.isPlaying} speedMs={playback.speedMs}
        onTogglePlay={() => { if (!playback.isPlaying && playback.step >= frames.length - 1) playback.setStep(0); playback.togglePlay(); }}
        onStepChange={(next) => { if (playback.isPlaying) playback.togglePlay(); playback.setStep(next); }}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
