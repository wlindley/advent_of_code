import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  type MonsterMessagesInput,
  type MonsterMessagesSolver,
  type MonsterTraceFrame,
} from '../index';
import { CykTriangle } from './CykTriangle';
import { SpanRibbon } from './SpanRibbon';

export interface MonsterMessagesVisualizerProps {
  readonly rawInput: string;
  readonly solver: MonsterMessagesSolver;
}

type TraceState =
  | { readonly ok: true; readonly input: MonsterMessagesInput; readonly frames: readonly MonsterTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildTraceState(rawInput: string, solver: MonsterMessagesSolver): TraceState {
  try {
    const input = solver.parse(rawInput);
    const frames = solver.trace(input, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, input, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function TelemetryBadges({
  solver,
  input,
  frame,
}: {
  readonly solver: MonsterMessagesSolver;
  readonly input: MonsterMessagesInput;
  readonly frame: MonsterTraceFrame;
}) {
  const { analysis } = frame;
  const r42Count = analysis.spans.filter((s) => s.role === 'rule42').length;
  const r31Count = analysis.spans.filter((s) => s.role === 'rule31').length;

  return (
    <div className="meta-row" style={{ margin: 0 }}>
      <span className="badge">{solver.policy.label}</span>
      <span className="badge">{`Rules: ${input.grammar.ruleCount}`}</span>
      <span className="badge">{`Msg ${frame.messageIndex + 1} / ${frame.messageCount}`}</span>
      <span className="badge">{`Step ${frame.stepIndex + 1} / ${frame.totalSteps}`}</span>
      <span
        className="badge"
        style={{
          borderColor: analysis.matched ? 'var(--ok)' : 'var(--err)',
          color: analysis.matched ? 'var(--ok)' : 'var(--err)',
        }}
      >
        {analysis.matched ? 'MATCH' : 'REJECT'}
      </span>
      <span className="badge status-solved">{`Matches: ${frame.cumulativeMatches}`}</span>
      {(r42Count > 0 || r31Count > 0) && (
        <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
          {`42x${r42Count} / 31x${r31Count}`}
        </span>
      )}
    </div>
  );
}

/** Interactive CYK parse-triangle and witness-span visualizer for Monster Messages. */
export function MonsterMessagesVisualizer({ rawInput, solver }: MonsterMessagesVisualizerProps) {
  const resetKey = `${solver.policy.id}:${rawInput}`;
  const state = useMemo(() => buildTraceState(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, resetKey, 240);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return (
      <div className="stack">
        <p className="error-text">
          {`Unable to visualize input: ${state.ok ? 'No trace frames' : state.message}`}
        </p>
      </div>
    );
  }

  return (
    <div className="stack">
      <TelemetryBadges solver={solver} input={state.input} frame={frame} />
      <SpanRibbon analysis={frame.analysis} />
      <CykTriangle triangleRows={frame.analysis.triangleRows} message={frame.analysis.message} />
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
