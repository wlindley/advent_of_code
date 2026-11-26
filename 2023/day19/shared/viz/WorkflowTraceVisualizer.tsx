import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, type PlaybackState, usePlayback } from '../../../../shared/viz';
import { DEFAULT_MAX_TRACE_STEPS, type WorkflowTraceFrame } from '../index';
import { AxisGaugeBars } from './AxisGaugeBars';

export interface WorkflowTraceVisualizerProps<TInput = unknown, TAnswer = unknown> {
  readonly rawInput: string;
  readonly solver: PuzzleSolver<TInput, TAnswer, WorkflowTraceFrame>;
  readonly partLabel: string;
}

type VizData =
  | { readonly ok: true; readonly answerText: string; readonly frames: readonly WorkflowTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildVizData<TInput, TAnswer>(
  rawInput: string,
  solver: PuzzleSolver<TInput, TAnswer, WorkflowTraceFrame>,
): VizData {
  try {
    const parsed = solver.parse(rawInput);
    const answerText = String(solver.solve(parsed));
    const frames = solver.trace?.(parsed, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) ?? [];
    return { ok: true, answerText, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function togglePlayback(playback: PlaybackState, totalFrames: number): void {
  if (!playback.isPlaying && playback.step >= totalFrames - 1) playback.setStep(0);
  playback.togglePlay();
}

function jumpToStep(playback: PlaybackState, nextStep: number): void {
  if (playback.isPlaying) playback.togglePlay();
  playback.setStep(nextStep);
}

function TelemetryBadges({
  frame,
  step,
  totalFrames,
  answerText,
  partLabel,
}: {
  readonly frame: WorkflowTraceFrame;
  readonly step: number;
  readonly totalFrames: number;
  readonly answerText: string;
  readonly partLabel: string;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        <strong>{partLabel}</strong>
      </span>
      <span className="badge">
        Frame: <strong>{step + 1} / {totalFrames}</strong> (raw {frame.stepIndex + 1}/{frame.totalRawSteps})
      </span>
      {frame.partIndex !== null && (
        <span className="badge">
          Part: <strong>{frame.partIndex + 1} / {frame.partTotal}</strong>
        </span>
      )}
      <span className="badge">
        Workflow: <strong>{frame.workflowName}</strong>
      </span>
      {frame.mode === 'part-routing' ? (
        <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
          Running Sum: <strong>{frame.runningAcceptedSum}</strong>
        </span>
      ) : (
        <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
          Accepted: <strong>{frame.runningAcceptedCombinations.toString()}</strong>
        </span>
      )}
      <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
        Answer: <strong>{answerText}</strong>
      </span>
    </div>
  );
}

function BreadcrumbAndRule({ frame }: { readonly frame: WorkflowTraceFrame }) {
  const ruleLabel = frame.activeRule
    ? `Rule ${frame.activeRule.format()}`
    : frame.outcome
      ? `Terminal ${frame.outcome === 'A' ? 'Accepted (A)' : 'Rejected (R)'}`
      : `Fallback → ${frame.nextTarget}`;
  const bannerColor = frame.outcome === 'A' ? 'var(--ok)' : frame.outcome === 'R' ? 'var(--err)' : 'var(--accent)';

  return (
    <div className="stack" style={{ gap: '0.45rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center', fontSize: '0.85rem' }}>
        <span className="muted">Path:</span>
        {frame.path.map((node, idx) => (
          <span key={`${node}-${idx}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            {idx > 0 && <span className="muted">→</span>}
            <code className="badge" style={node === 'A' ? { borderColor: 'var(--ok)', color: 'var(--ok)' } : node === 'R' ? { borderColor: 'var(--err)', color: 'var(--err)' } : undefined}>
              {node}
            </code>
          </span>
        ))}
      </div>
      <div
        style={{
          padding: '0.45rem 0.7rem',
          borderRadius: '6px',
          border: `1px solid ${bannerColor}`,
          background: 'var(--surface)',
          color: bannerColor,
          fontWeight: 600,
          fontSize: '0.88rem',
        }}
      >
        {ruleLabel}
      </div>
    </div>
  );
}

/** Shared interactive workflow routing & hyperrectangle split visualizer for Day 19 Parts 1 & 2. */
export function WorkflowTraceVisualizer<TInput, TAnswer>({
  rawInput,
  solver,
  partLabel,
}: WorkflowTraceVisualizerProps<TInput, TAnswer>) {
  const data = useMemo(() => buildVizData(rawInput, solver), [rawInput, solver]);
  const totalFrames = data.ok ? data.frames.length : 0;
  const playback = usePlayback(totalFrames, rawInput, 180);
  const activeFrame = data.ok ? data.frames[playback.step] : undefined;

  if (!data.ok) return <p className="error-text" role="alert">Invalid workflow input: {data.message}</p>;
  if (!activeFrame) return <p className="muted">No trace frames available to visualize.</p>;

  return (
    <div className="stack">
      <TelemetryBadges frame={activeFrame} step={playback.step} totalFrames={totalFrames} answerText={data.answerText} partLabel={partLabel} />
      <BreadcrumbAndRule frame={activeFrame} />
      <AxisGaugeBars box={activeFrame.box} activeRule={activeFrame.activeRule} outcome={activeFrame.outcome} />
      <PlaybackControls
        step={playback.step}
        totalSteps={totalFrames}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={() => togglePlayback(playback, totalFrames)}
        onStepChange={(s) => jumpToStep(playback, s)}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
