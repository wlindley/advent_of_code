import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  CustomsTraceFrame,
  DEFAULT_MAX_TRACE_STEPS,
  GroupConsensusPolicy,
  parseCustomsBatch,
  traceCustomsBatch,
} from '../index';
import { CustomsMatrixSvg } from './CustomsMatrixSvg';

export interface CustomsVisualizerProps {
  readonly rawInput: string;
  readonly policy: GroupConsensusPolicy;
}

type TraceState =
  | { readonly ok: true; readonly frames: readonly CustomsTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildCustomsTrace(rawInput: string, policy: GroupConsensusPolicy): TraceState {
  try {
    const batch = parseCustomsBatch(rawInput);
    const frames = traceCustomsBatch(batch, policy, DEFAULT_MAX_TRACE_STEPS);
    return { ok: true, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function TelemetryRow({ policy, frame }: {
  readonly policy: GroupConsensusPolicy;
  readonly frame: CustomsTraceFrame;
}) {
  return (
    <div className="meta-row">
      <span className="badge">{policy.label}</span>
      <span className="badge">Group {frame.groupNumber} / {frame.totalGroups}</span>
      <span className="badge">Group count: {frame.consensus.count}</span>
      <span className="badge">Letters: {frame.consensus.letters || '—'}</span>
      <span className="badge status-solved">Running sum: {frame.runningSum}</span>
    </div>
  );
}

/** Interactive group bitmask consensus visualizer shared across Day 6 parts. */
export function CustomsVisualizer({ rawInput, policy }: CustomsVisualizerProps) {
  const state = useMemo(() => buildCustomsTrace(rawInput, policy), [rawInput, policy]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, `${policy.id}:${rawInput}`, 220);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return (
      <div className="stack">
        <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>
      </div>
    );
  }

  return (
    <div className="stack">
      <TelemetryRow policy={policy} frame={frame} />
      <CustomsMatrixSvg frame={frame} policyId={policy.id} />
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
