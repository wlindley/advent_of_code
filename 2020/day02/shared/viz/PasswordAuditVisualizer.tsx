import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  parsePasswordDatabase,
  tracePasswordAudit,
  type AuditTraceFrame,
  type PasswordValidationPolicy,
} from '../index';
import { PasswordStrip } from './PasswordStrip';

export interface PasswordAuditVisualizerProps {
  readonly rawInput: string;
  readonly policy: PasswordValidationPolicy;
}

type AuditTraceState =
  | { readonly ok: true; readonly totalEntries: number; readonly frames: readonly AuditTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildAuditTrace(rawInput: string, policy: PasswordValidationPolicy): AuditTraceState {
  try {
    const database = parsePasswordDatabase(rawInput);
    const frames = tracePasswordAudit(database, policy, DEFAULT_MAX_TRACE_STEPS);
    return { ok: true, totalEntries: database.size, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function AuditMetaRow({ policy, totalEntries, frame }: { policy: PasswordValidationPolicy; totalEntries: number; frame: AuditTraceFrame }) {
  return (
    <div className="meta-row">
      <span className="badge">{policy.name}</span>
      <span className="badge">Entries: {totalEntries}</span>
      <span className="badge">Record #{frame.entryIndex + 1} / {frame.totalEntries}</span>
      <span className="badge status-solved">Valid so far: {frame.validSoFar}</span>
    </div>
  );
}

export function PasswordAuditVisualizer({ rawInput, policy }: PasswordAuditVisualizerProps) {
  const state = useMemo(() => buildAuditTrace(rawInput, policy), [rawInput, policy]);
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
      <AuditMetaRow policy={policy} totalEntries={state.totalEntries} frame={frame} />
      <PasswordStrip frame={frame} />
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
