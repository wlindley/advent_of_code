import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  type AdapterArraySolver,
  type AdapterChain,
  type AdapterTraceFrame,
  computeChainViewport,
  DEFAULT_MAX_TRACE_STEPS,
  DEFAULT_VIEWPORT_SLOTS,
} from '../index';
import { AdapterChainChart } from './AdapterChainChart';

export interface AdapterChainVisualizerProps {
  readonly rawInput: string;
  readonly solver: AdapterArraySolver;
}

type TraceState =
  | { readonly ok: true; readonly chain: AdapterChain; readonly frames: readonly AdapterTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildChainTrace(rawInput: string, solver: AdapterArraySolver): TraceState {
  try {
    const chain = solver.parse(rawInput);
    const frames = solver.trace(chain, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, chain, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function TelemetryStrip({
  solver,
  chain,
  frame,
}: {
  readonly solver: AdapterArraySolver;
  readonly chain: AdapterChain;
  readonly frame: AdapterTraceFrame;
}) {
  const statusClass = frame.isComplete ? 'status-solved' : 'status-in_progress';
  if (frame.phase === 'differences') {
    const { histogram } = frame;
    const fromJ = chain.joltageAt(frame.fromIndex);
    const toJ = chain.joltageAt(frame.activeIndex);
    return (
      <div className="stack" style={{ gap: '0.45rem' }}>
        <div className="meta-row">
          <span className="badge">{solver.policy.label}</span>
          <span className="badge">{`Step ${frame.step} / ${frame.totalSteps}`}</span>
          <span className="badge">{`Transition: ${fromJ}J -> ${toJ}J (+${frame.delta}J)`}</span>
          <span className="badge">{`1J: ${histogram.diff1} | 2J: ${histogram.diff2} | 3J: ${histogram.diff3}`}</span>
          <span className={`badge ${statusClass}`}>{`${solver.policy.metricLabel}: ${histogram.part1Product.toString()}`}</span>
        </div>
        <div className="meta-row">
          <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>+1J</span>
          <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>+2J</span>
          <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>+3J</span>
        </div>
      </div>
    );
  }
  const activeJ = chain.joltageAt(frame.activeIndex);
  return (
    <div className="meta-row">
      <span className="badge">{solver.policy.label}</span>
      <span className="badge">{`Node ${frame.step} / ${frame.totalSteps}`}</span>
      <span className="badge">{`#${frame.activeIndex}: ${activeJ}J (preds: ${frame.predecessorIndices.length})`}</span>
      <span className={`badge ${statusClass}`}>{`${frame.isComplete ? solver.policy.metricLabel : 'Ways'}: ${frame.ways.toString()}`}</span>
    </div>
  );
}

/** Shared interactive adapter-chain visualizer for Day 10 parts. */
export function AdapterChainVisualizer({ rawInput, solver }: AdapterChainVisualizerProps) {
  const state = useMemo(() => buildChainTrace(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, `${solver.policy.id}:${rawInput}`, 180);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return (
      <div className="stack">
        <p className="error-text">{`Unable to visualize input: ${state.ok ? 'No trace frames' : state.message}`}</p>
      </div>
    );
  }

  const viewport = computeChainViewport(state.chain, frame, DEFAULT_VIEWPORT_SLOTS);

  return (
    <div className="stack">
      <TelemetryStrip solver={solver} chain={state.chain} frame={frame} />
      <AdapterChainChart viewport={viewport} frame={frame} />
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
