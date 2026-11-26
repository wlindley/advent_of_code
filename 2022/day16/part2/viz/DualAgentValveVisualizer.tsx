import { useMemo } from 'react';
import { PlaybackControls, usePlayback, type VisualizerProps } from '../../../../shared/viz';
import {
  buildValveTimeline,
  CompressedValveNetwork,
  parseValveNetwork,
  type AgentRoute,
  type AgentSnapshot,
  type ValveTimelineFrame,
} from '../../shared';
import { ValveNetworkSvg } from '../../shared/viz/ValveNetworkSvg';
import { findOptimalDualAgentRoutes, PART2_TIME_LIMIT } from '../domain';

const LEGEND_ITEMS: ReadonlyArray<readonly [string, string]> = [
  ['You (Route / Marker)', 'var(--accent)'],
  ['Elephant (Route / Marker)', 'var(--gold)'],
  ['Opened Valve', 'var(--ok)'],
  ['Closed Valve', 'var(--border)'],
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
    const routes = findOptimalDualAgentRoutes(compressed, PART2_TIME_LIMIT);
    const frames = buildValveTimeline(compressed, routes, PART2_TIME_LIMIT);
    return { ok: true, compressed, routes, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function formatAgentStatus(agent: AgentSnapshot | undefined, compressed: CompressedValveNetwork): string {
  if (!agent) return '—';
  const target = compressed.nameAt(agent.toIndex);
  if (agent.status === 'moving') return `-> ${target}`;
  if (agent.status === 'opening') return `Open ${target}`;
  return `${target} (idle)`;
}

function DualAgentKpis({
  frame,
  compressed,
}: {
  readonly frame: ValveTimelineFrame;
  readonly compressed: CompressedValveNetwork;
}) {
  const you = frame.agents[0];
  const elephant = frame.agents[1];
  const openCount = (you ? you.openedCount : 0) + (elephant ? elephant.openedCount : 0);
  return (
    <div className="meta-row">
      <span className="badge">Minute: <code>{frame.minute} / {frame.timeLimit}</code></span>
      <span className="badge">Open Valves: <code>{openCount} / {compressed.positiveCount}</code></span>
      <span className="badge">You: <code>{formatAgentStatus(you, compressed)}</code></span>
      <span className="badge">Elephant: <code>{formatAgentStatus(elephant, compressed)}</code></span>
      <span className="badge">Active Flow: <code>{frame.activeFlowRate}/min</code></span>
      <span className="badge status-solved">
        Cumulative Pressure: <strong className="gold"><code>{frame.cumulativePressure}</code></strong>
      </span>
    </div>
  );
}

function DualAgentLegend() {
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

/** Interactive minute-by-minute visualizer for Part 2 dual-agent valve coordination. */
export function DualAgentValveVisualizer({ rawInput }: VisualizerProps) {
  const state = useMemo(() => buildVizState(rawInput), [rawInput]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, rawInput, 220);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>;
  }

  return (
    <div className="stack">
      <DualAgentKpis frame={frame} compressed={state.compressed} />
      <ValveNetworkSvg compressed={state.compressed} routes={state.routes} frame={frame} />
      <DualAgentLegend />
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
