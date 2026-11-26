import { useMemo } from 'react';
import { PlaybackControls, usePlayback, type VisualizerProps } from '../../../../shared/viz';
import {
  buildValveTimeline,
  CompressedValveNetwork,
  findOptimalSchedule,
  parseValveNetwork,
  type AgentRoute,
  type ValveTimelineFrame,
} from '../../shared';
import { ValveNetworkSvg } from '../../shared/viz/ValveNetworkSvg';
import { PART1_TIME_LIMIT } from '../domain';

const LEGEND_ITEMS: ReadonlyArray<readonly [string, string]> = [
  ['You (Route / Marker)', 'var(--accent)'],
  ['Opened Valve', 'var(--ok)'],
  ['Closed Valve', 'var(--border)'],
  ['Peak Pressure', 'var(--gold)'],
];

type VizState =
  | {
      readonly ok: true;
      readonly compressed: CompressedValveNetwork;
      readonly routes: readonly AgentRoute[];
      readonly frames: readonly ValveTimelineFrame[];
    }
  | { readonly ok: false; readonly message: string };

function buildVizState(rawInput: string): VizState {
  try {
    const network = parseValveNetwork(rawInput);
    const compressed = CompressedValveNetwork.fromNetwork(network);
    const schedule = findOptimalSchedule(compressed, PART1_TIME_LIMIT);
    const routes: readonly AgentRoute[] = [{ label: 'You', schedule }];
    const frames = buildValveTimeline(compressed, routes, PART1_TIME_LIMIT);
    return { ok: true, compressed, routes, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function PressureKpis({ frame, positiveCount }: { readonly frame: ValveTimelineFrame; readonly positiveCount: number }) {
  const you = frame.agents[0];
  return (
    <div className="meta-row">
      <span className="badge">Minute: <code>{frame.minute} / {frame.timeLimit}</code></span>
      <span className="badge">Open Valves: <code>{you ? you.openedCount : 0} / {positiveCount}</code></span>
      <span className="badge">Active Flow: <code>{frame.activeFlowRate}/min</code></span>
      <span className="badge status-solved">
        Cumulative Pressure: <strong className="gold"><code>{frame.cumulativePressure}</code></strong>
      </span>
    </div>
  );
}

function ValveLegend() {
  return (
    <div className="meta-row">
      {LEGEND_ITEMS.map(([label, color]) => (
        <span key={label} className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block' }} />
          {label}
        </span>
      ))}
    </div>
  );
}

/** Interactive minute-by-minute visualizer for Part 1 single-agent valve opening. */
export function ValvePressureVisualizer({ rawInput }: VisualizerProps) {
  const state = useMemo(() => buildVizState(rawInput), [rawInput]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, rawInput, 220);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>;
  }

  return (
    <div className="stack">
      <PressureKpis frame={frame} positiveCount={state.compressed.positiveCount} />
      <ValveNetworkSvg compressed={state.compressed} routes={state.routes} frame={frame} />
      <ValveLegend />
      <PlaybackControls
        step={playback.step}
        totalSteps={frames.length}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={() => {
          if (!playback.isPlaying && playback.step >= frames.length - 1) playback.setStep(0);
          playback.togglePlay();
        }}
        onStepChange={(nextStep) => {
          if (playback.isPlaying) playback.togglePlay();
          playback.setStep(nextStep);
        }}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
