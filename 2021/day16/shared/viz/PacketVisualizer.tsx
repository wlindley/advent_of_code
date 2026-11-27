import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  traceTransmission,
  type PacketSolver,
  type PacketTraceFrame,
} from '../index';
import { BitSpanStrip } from './BitSpanStrip';
import { PacketAstTree } from './PacketAstTree';
import { PacketTelemetry } from './PacketTelemetry';

export interface PacketVisualizerProps {
  readonly rawInput: string;
  readonly solver: PacketSolver;
}

type PacketModel =
  | { readonly ok: true; readonly answerText: string; readonly frames: readonly PacketTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildPacketModel(rawInput: string, solver: PacketSolver): PacketModel {
  try {
    const stream = solver.parse(rawInput);
    const transmission = solver.analyze(stream);
    const answer = solver.policy.compute(transmission.root);
    const frames = traceTransmission(transmission, solver.policy, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, answerText: solver.formatAnswer(answer), frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

/** Interactive BITS packet decoder and post-order reduction visualizer. */
export function PacketVisualizer({ rawInput, solver }: PacketVisualizerProps) {
  const model = useMemo(() => buildPacketModel(rawInput, solver), [rawInput, solver]);
  const frames = model.ok ? model.frames : [];
  const playback = usePlayback(frames.length, `${solver.policy.mode}:${rawInput}`, 160);
  const activeFrame = frames[playback.step] ?? null;

  if (!model.ok || activeFrame === null) {
    return (
      <div className="stack">
        <p className="error-text">
          Unable to visualize transmission: {model.ok ? 'No trace frames available' : model.message}
        </p>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="card" style={{ marginBottom: 0 }}>
        <PacketTelemetry frame={activeFrame} answerText={model.answerText} />
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
      <BitSpanStrip frame={activeFrame} />
      <PacketAstTree frame={activeFrame} />
    </div>
  );
}
