import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  BoardingPass,
  BoardingTraceFrame,
  DEFAULT_MAX_TRACE_STEPS,
  SeatQueryPolicy,
  parseBoardingManifest,
  traceBoardingManifest,
} from '../index';
import { BspNarrowingPanel } from './BspNarrowingPanel';
import { CabinSvgMap } from './CabinSvgMap';

export interface BoardingVisualizerProps {
  readonly rawInput: string;
  readonly policy: SeatQueryPolicy;
}

type TraceState =
  | { readonly ok: true; readonly passes: readonly BoardingPass[]; readonly frames: readonly BoardingTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildBoardingTrace(rawInput: string, policy: SeatQueryPolicy): TraceState {
  try {
    const manifest = parseBoardingManifest(rawInput);
    const frames = traceBoardingManifest(manifest, policy, DEFAULT_MAX_TRACE_STEPS);
    return { ok: true, passes: manifest.passes, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function TelemetryRow({ policy, frame }: {
  readonly policy: SeatQueryPolicy;
  readonly frame: BoardingTraceFrame;
}) {
  return (
    <div className="meta-row">
      <span className="badge">{policy.label}</span>
      <span className="badge">Scanned: {frame.scannedCount} / {frame.totalPasses}</span>
      <span className="badge">Range: {frame.runningMinSeatId} .. {frame.runningMaxSeatId}</span>
      <span className="badge">Phase: {frame.phase === 'scan' ? 'Manifest Scan' : 'BSP Narrowing'}</span>
      <span className="badge status-solved">Target: #{frame.result.seatId}</span>
    </div>
  );
}

/** Interactive cabin scan and binary space partitioning visualizer shared across Day 5 parts. */
export function BoardingVisualizer({ rawInput, policy }: BoardingVisualizerProps) {
  const state = useMemo(() => buildBoardingTrace(rawInput, policy), [rawInput, policy]);
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
      <CabinSvgMap passes={state.passes} frame={frame} />
      <BspNarrowingPanel frame={frame} />
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
