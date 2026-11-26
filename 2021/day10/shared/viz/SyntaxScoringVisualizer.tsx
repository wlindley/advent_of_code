import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import { DEFAULT_MAX_TRACE_STEPS, type SyntaxScoringSolver, type SyntaxTraceFrame } from '../index';
import { BracketLineStage } from './BracketLineStage';
import { OutcomePanel } from './OutcomePanel';

export interface SyntaxScoringVisualizerProps {
  readonly rawInput: string;
  readonly solver: SyntaxScoringSolver<SyntaxTraceFrame>;
}

type VisualizerModel =
  | { readonly ok: true; readonly answer: bigint; readonly frames: readonly SyntaxTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildModel(rawInput: string, solver: SyntaxScoringSolver<SyntaxTraceFrame>): VisualizerModel {
  try {
    const lines = solver.parse(rawInput);
    const answer = solver.solve(lines);
    const frames = solver.trace(lines, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, answer, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

/** Shared interactive Syntax Scoring visualizer parameterized by a `SyntaxScoringSolver`. */
export function SyntaxScoringVisualizer({ rawInput, solver }: SyntaxScoringVisualizerProps) {
  const model = useMemo(() => buildModel(rawInput, solver), [rawInput, solver]);
  const frames = model.ok ? model.frames : [];
  const playback = usePlayback(frames.length, `${solver.policy.id}:${rawInput}`, 220);
  const activeFrame = frames[playback.step] ?? null;

  if (!model.ok || activeFrame === null) {
    return (
      <div className="stack">
        <p className="error-text">
          Unable to visualize input: {model.ok ? 'No trace frames available' : model.message}
        </p>
      </div>
    );
  }

  const totalCount = activeFrame.kind === 'corruption-score'
    ? activeFrame.analysis.results.length
    : activeFrame.analysis.incompleteLines.length;
  const runningValue = activeFrame.kind === 'corruption-score'
    ? activeFrame.runningCorruptionScore
    : activeFrame.runningMedianScore;

  return (
    <div className="stack">
      <div className="card" style={{ marginBottom: 0 }}>
        <div className="meta-row" style={{ margin: 0, justifyContent: 'space-between' }}>
          <div className="meta-row" style={{ margin: 0 }}>
            <span className="badge">{solver.policy.label}</span>
            <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
              Inspected: <strong>{activeFrame.inspectedCount}</strong> / {totalCount}
            </span>
            <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
              {solver.policy.metricLabel}: <strong>{runningValue.toLocaleString()}</strong>
            </span>
          </div>
          <span className="badge status-solved">
            Final Answer: <strong>{model.answer.toLocaleString()}</strong>
          </span>
        </div>
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
      <BracketLineStage line={activeFrame.currentLine} />
      <OutcomePanel frame={activeFrame} />
    </div>
  );
}
