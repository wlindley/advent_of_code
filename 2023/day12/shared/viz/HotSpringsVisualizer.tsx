import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, usePlayback, type PlaybackState } from '../../../../shared/viz';
import {
  buildArrangementDpTable,
  DEFAULT_MAX_TRACE_STEPS,
  reconstructWitness,
  type HotSpringsTraceFrame,
  type SpringRecord,
} from '../index';
import { DpHeatmapSvg } from './DpHeatmapSvg';

export interface HotSpringsVisualizerProps {
  readonly rawInput: string;
  readonly unfoldFactor: number;
  readonly solver: PuzzleSolver<readonly SpringRecord[], bigint, HotSpringsTraceFrame>;
}

type VizData =
  | { readonly ok: true; readonly totalRows: number; readonly frames: readonly HotSpringsTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildVizData(
  rawInput: string,
  solver: PuzzleSolver<readonly SpringRecord[], bigint, HotSpringsTraceFrame>,
): VizData {
  try {
    const records = solver.parse(rawInput);
    const frames = solver.trace?.(records, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) ?? [];
    return { ok: true, totalRows: records.length, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function togglePlayback(playback: PlaybackState, totalFrames: number): void {
  if (!playback.isPlaying && playback.step >= totalFrames - 1) playback.setStep(0);
  playback.togglePlay();
}

function witnessCharColor(patternChar: string, witnessChar: string): string {
  if (patternChar === '?') return witnessChar === '#' ? 'var(--ok)' : 'var(--muted)';
  return witnessChar === '#' ? 'var(--accent)' : 'var(--text)';
}

function WitnessRow({ pattern, witness }: { readonly pattern: string; readonly witness: string | null }) {
  if (witness === null) return <span className="error-text">impossible (0 arrangements)</span>;
  return (
    <>
      {Array.from(witness, (ch, idx) => (
        <span key={idx} style={{ color: witnessCharColor(pattern[idx]!, ch), fontWeight: ch === '#' ? 700 : 400 }}>
          {ch}
        </span>
      ))}
    </>
  );
}

function PatternWitnessStrip({ record, witness }: { readonly record: SpringRecord; readonly witness: string | null }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '0.65rem 0.75rem', background: 'var(--bg)', overflowX: 'auto' }}>
      <div className="muted" style={{ fontSize: '0.78rem', marginBottom: '0.35rem' }}>
        Groups: <strong>[{record.groups.join(', ')}]</strong> · Length: <strong>{record.length}</strong> · Wildcards: <strong>{record.wildcardCount}</strong>
      </div>
      <pre style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.45 }}>
        <div><span className="muted">Pattern </span>{record.pattern}</div>
        <div><span className="muted">Witness </span><WitnessRow pattern={record.pattern} witness={witness} /></div>
      </pre>
    </div>
  );
}

function TelemetryBadges({ totalRows, unfoldFactor, frame }: {
  readonly totalRows: number;
  readonly unfoldFactor: number;
  readonly frame: HotSpringsTraceFrame;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
      <span className="badge">Rows: <strong>{totalRows}</strong></span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>Unfold: <strong>×{unfoldFactor}</strong></span>
      <span className="badge">Row: <strong>#{frame.rowIndex + 1} / {frame.totalRows}</strong></span>
      <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>Ways: <strong>{frame.arrangements.toString()}</strong></span>
      <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>Cumulative: <strong>{frame.cumulativeTotal.toString()}</strong></span>
    </div>
  );
}

/** Interactive suffix-DP visualizer for Hot Springs condition records. */
export function HotSpringsVisualizer({ rawInput, unfoldFactor, solver }: HotSpringsVisualizerProps) {
  const data = useMemo(() => buildVizData(rawInput, solver), [rawInput, solver]);
  const totalFrames = data.ok ? data.frames.length : 0;
  const playback = usePlayback(totalFrames, `${rawInput}:${unfoldFactor}`, 220);

  const activeFrame = data.ok ? data.frames[playback.step] : undefined;
  const activeInspection = useMemo(() => {
    if (!activeFrame) return null;
    const table = buildArrangementDpTable(activeFrame.record);
    return { table, witness: reconstructWitness(activeFrame.record, table) };
  }, [activeFrame]);

  if (!data.ok) {
    return <p className="error-text" role="alert">Invalid Hot Springs input: {data.message}</p>;
  }
  if (!activeFrame || !activeInspection) {
    return <p className="muted">No spring condition records available to visualize.</p>;
  }

  return (
    <div className="stack">
      <TelemetryBadges totalRows={data.totalRows} unfoldFactor={unfoldFactor} frame={activeFrame} />
      <PatternWitnessStrip record={activeFrame.record} witness={activeInspection.witness} />
      <DpHeatmapSvg record={activeFrame.record} table={activeInspection.table} frames={data.frames} activeFrameIndex={playback.step} onSelectFrame={playback.setStep} />
      <PlaybackControls
        step={playback.step}
        totalSteps={totalFrames}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={() => togglePlayback(playback, totalFrames)}
        onStepChange={playback.setStep}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
