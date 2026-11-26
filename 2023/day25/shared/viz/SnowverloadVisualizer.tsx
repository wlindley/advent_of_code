import { useMemo } from 'react';
import { PlaybackControls, type PlaybackState, usePlayback } from '../../../../shared/viz';
import {
  buildMinCutTrace,
  DEFAULT_MAX_TRACE_STEPS,
  type MinCutTraceFrame,
  parseWiringGraph,
  type WiringGraph,
} from '../index';
import { SnowverloadCanvas } from './SnowverloadCanvas';

export interface SnowverloadVisualizerProps {
  readonly rawInput: string;
}

type VizData =
  | { readonly ok: true; readonly graph: WiringGraph; readonly frames: readonly MinCutTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildVizData(rawInput: string): VizData {
  try {
    const graph = parseWiringGraph(rawInput);
    const frames = buildMinCutTrace(graph, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, graph, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function formatStatus(graph: WiringGraph, frame: MinCutTraceFrame): string {
  const s = graph.labelOf(frame.result.source);
  const t = graph.labelOf(frame.probeTarget);
  const wires = frame.result.cutEdges.map((e) => `${graph.labelOf(e.u)}–${graph.labelOf(e.v)}`).join(', ');
  if (frame.phase === 'overview') return `Overview: ${graph.vertexCount} components, ${graph.edgeCount} wires`;
  if (frame.phase === 'probe') {
    return frame.probeFlow === 0
      ? `Probe #${frame.probeIndex + 1}: max-flow ${s} -> ${t} yields 3-edge cut`
      : `Probe #${frame.probeIndex + 1}: ${s} -> ${t} reached flow ${frame.probeFlow} (>= 4, same cluster)`;
  }
  if (frame.phase === 'augment') return `Flow decomposition: ${frame.activePathCount} / 3 edge-disjoint paths (${s} -> ${t})`;
  if (frame.phase === 'residual-cut') return `Residual cut saturated across 3 wires: ${wires}`;
  return `Severed [${wires}] -> ${frame.result.sizeS} x ${frame.result.sizeT} = ${frame.result.product}`;
}

function togglePlayback(playback: PlaybackState, totalFrames: number): void {
  if (!playback.isPlaying && playback.step >= totalFrames - 1) playback.setStep(0);
  playback.togglePlay();
}

function jumpToStep(playback: PlaybackState, nextStep: number): void {
  if (playback.isPlaying) playback.togglePlay();
  playback.setStep(nextStep);
}

/** Interactive Edmonds-Karp 3-edge min-cut visualizer using PlaybackControls. */
export function SnowverloadVisualizer({ rawInput }: SnowverloadVisualizerProps) {
  const data = useMemo(() => buildVizData(rawInput), [rawInput]);
  const totalFrames = data.ok ? data.frames.length : 0;
  const playback = usePlayback(totalFrames, rawInput, 380);
  const frame = data.ok ? data.frames[playback.step] : undefined;

  if (!data.ok) return <p className="error-text" role="alert">Invalid wiring diagram: {data.message}</p>;
  if (!frame) return <p className="muted">No trace frames available.</p>;

  const { result } = frame;
  const bannerColor = frame.phase === 'severed' ? 'var(--ok)' : frame.phase === 'residual-cut' ? 'var(--gold)' : 'var(--accent)';

  return (
    <div className="stack">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
        <span className="badge">Nodes: <strong>{data.graph.vertexCount}</strong></span>
        <span className="badge">Wires: <strong>{data.graph.edgeCount}</strong></span>
        <span className="badge">Probes: <strong>{result.probesRun}</strong></span>
        <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
          Side S: <strong>{result.sizeS}</strong>
        </span>
        <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
          Side T: <strong>{result.sizeT}</strong>
        </span>
        <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
          Product: <strong>{result.product}</strong>
        </span>
      </div>
      <div
        style={{
          padding: '0.45rem 0.7rem',
          borderRadius: '6px',
          border: `1px solid ${bannerColor}`,
          background: 'var(--surface)',
          color: 'var(--text)',
          fontWeight: 600,
          fontSize: '0.88rem',
        }}
      >
        {formatStatus(data.graph, frame)}
      </div>
      <SnowverloadCanvas graph={data.graph} frame={frame} />
      <PlaybackControls
        step={playback.step}
        totalSteps={totalFrames}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={() => togglePlayback(playback, totalFrames)}
        onStepChange={(next) => jumpToStep(playback, next)}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
