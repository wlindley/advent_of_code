import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  BagQueryPolicy,
  BagTraceFrame,
  DEFAULT_MAX_TRACE_STEPS,
  parseBagRuleGraph,
  traceBagQuery,
} from '../index';
import { HaversackGraphSvg } from './HaversackGraphSvg';

export interface HaversackVisualizerProps {
  readonly rawInput: string;
  readonly policy: BagQueryPolicy;
  readonly targetColor: string;
}

type TraceState =
  | { readonly ok: true; readonly frames: readonly BagTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildHaversackTrace(
  rawInput: string,
  policy: BagQueryPolicy,
  targetColor: string,
): TraceState {
  try {
    const graph = parseBagRuleGraph(rawInput);
    const frames = traceBagQuery(graph, policy, targetColor, DEFAULT_MAX_TRACE_STEPS);
    return { ok: true, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function TelemetryRow({
  policy,
  frame,
}: {
  readonly policy: BagQueryPolicy;
  readonly frame: BagTraceFrame;
}) {
  const maxDepth = Math.max(0, frame.totalLayers - 1);
  return (
    <div className="meta-row">
      <span className="badge">{policy.label}</span>
      <span className="badge">{`Target: ${frame.targetColor}`}</span>
      <span className="badge">{`Depth ${frame.revealedDepth} / ${maxDepth}`}</span>
      <span className="badge">{`Discovered: ${frame.discoveredNodeCount} / ${frame.totalRuleCount}`}</span>
      <span className="badge status-solved">{`${policy.metricLabel}: ${frame.runningTotal.toString()}`}</span>
    </div>
  );
}

/** Interactive layered bag-rule visualizer shared across Day 7 parts. */
export function HaversackVisualizer({ rawInput, policy, targetColor }: HaversackVisualizerProps) {
  const state = useMemo(
    () => buildHaversackTrace(rawInput, policy, targetColor),
    [rawInput, policy, targetColor],
  );
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, `${policy.id}:${rawInput}`, 240);
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
      <TelemetryRow policy={policy} frame={frame} />
      <HaversackGraphSvg frame={frame} edgeVerb={policy.edgeVerb} />
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
