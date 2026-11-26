import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  parsePassportBatch,
  tracePassportScan,
  type PassportTraceFrame,
  type PassportValidationPolicy,
} from '../index';
import { PassportCard } from './PassportCard';

export interface PassportScanVisualizerProps {
  readonly rawInput: string;
  readonly policy: PassportValidationPolicy;
}

type ScanTraceState =
  | { readonly ok: true; readonly totalRecords: number; readonly frames: readonly PassportTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildScanTrace(rawInput: string, policy: PassportValidationPolicy): ScanTraceState {
  try {
    const batch = parsePassportBatch(rawInput);
    const frames = tracePassportScan(batch, policy, DEFAULT_MAX_TRACE_STEPS);
    return { ok: true, totalRecords: batch.size, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function ScanMetaRow({ policy, totalRecords, frame }: {
  readonly policy: PassportValidationPolicy;
  readonly totalRecords: number;
  readonly frame: PassportTraceFrame;
}) {
  return (
    <div className="meta-row">
      <span className="badge">{policy.label}</span>
      <span className="badge">Passports: {totalRecords}</span>
      <span className="badge">Record #{frame.recordIndex + 1} / {frame.totalRecords}</span>
      <span className="badge status-solved">Valid so far: {frame.validSoFar}</span>
    </div>
  );
}

/** Interactive step-by-step passport batch scan visualizer shared across Day 4 parts. */
export function PassportScanVisualizer({ rawInput, policy }: PassportScanVisualizerProps) {
  const state = useMemo(() => buildScanTrace(rawInput, policy), [rawInput, policy]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, `${policy.id}:${rawInput}`, 240);
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
      <ScanMetaRow policy={policy} totalRecords={state.totalRecords} frame={frame} />
      <PassportCard frame={frame} />
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
