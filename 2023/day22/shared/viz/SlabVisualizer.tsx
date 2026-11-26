import { useEffect, useMemo, useState } from 'react';
import { PlaybackControls, type PlaybackState, usePlayback } from '../../../../shared/viz';
import {
  type Bounds3D,
  buildSlabTrace,
  DEFAULT_MAX_TRACE_STEPS,
  formatBrickLabel,
  parseBrickSnapshot,
  settleBricks,
  type SettledStack,
  type SlabTraceFrame,
  SupportGraph,
} from '../index';
import { SlabElevationCanvas } from './SlabElevationCanvas';

export interface SlabVisualizerProps {
  readonly rawInput: string;
  readonly mode: 'part1' | 'part2';
}

type VizData =
  | {
      readonly ok: true;
      readonly stack: SettledStack;
      readonly graph: SupportGraph;
      readonly initialBounds: Bounds3D;
      readonly frames: readonly SlabTraceFrame[];
      readonly totalFalls: number;
    }
  | { readonly ok: false; readonly message: string };

function buildVizData(rawInput: string): VizData {
  try {
    const snapshot = parseBrickSnapshot(rawInput);
    const stack = settleBricks(snapshot);
    const graph = new SupportGraph(stack);
    const frames = buildSlabTrace(stack, graph, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, stack, graph, initialBounds: snapshot.bounds, frames, totalFalls: graph.totalChainReactionFalls() };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function togglePlayback(playback: PlaybackState, totalFrames: number): void {
  if (!playback.isPlaying && playback.step >= totalFrames - 1) playback.setStep(0);
  playback.togglePlay();
}

function jumpToStep(playback: PlaybackState, nextStep: number): void {
  if (playback.isPlaying) playback.togglePlay();
  playback.setStep(nextStep);
}

function formatIndexList(indices: readonly number[], stack: SettledStack): string {
  if (indices.length === 0) return 'none';
  return indices.map((i) => formatBrickLabel(stack.bricks[i]!.id)).join(', ');
}

/** Interactive dual-projection sand slab settling and cascade visualizer. */
export function SlabVisualizer({ rawInput, mode }: SlabVisualizerProps) {
  const data = useMemo(() => buildVizData(rawInput), [rawInput]);
  const totalFrames = data.ok ? data.frames.length : 0;
  const playback = usePlayback(totalFrames, `${rawInput}:${mode}`, 160);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  useEffect(() => { setSelectedIndex(null); }, [rawInput, mode]);

  if (!data.ok) return <p className="error-text" role="alert">Invalid sand slabs: {data.message}</p>;
  const activeFrame = data.frames[playback.step];
  if (!activeFrame) return <p className="muted">No trace frames available to visualize.</p>;

  const effectiveSelected = activeFrame.isFinal && selectedIndex !== null && selectedIndex < data.stack.length ? selectedIndex : null;
  const cascadeIndices = effectiveSelected !== null ? data.graph.cascadeFrom(effectiveSelected) : [];
  const selectedBrick = effectiveSelected !== null ? data.stack.bricks[effectiveSelected]! : null;

  return (
    <div className="stack">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
        <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
          <strong>{mode === 'part1' ? 'Part 1: Safe Disintegration' : 'Part 2: Chain Reaction'}</strong>
        </span>
        <span className="badge">Bricks: <strong>{data.stack.length}</strong></span>
        <span className="badge">Total drop: <strong>{data.stack.totalDropDistance}</strong></span>
        <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
          Safe: <strong>{data.graph.safeCount}</strong>
        </span>
        <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
          Load-bearing: <strong>{data.graph.loadBearingCount}</strong>
        </span>
        {mode === 'part2' && (
          <span className="badge" style={{ borderColor: 'var(--err)', color: 'var(--err)' }}>
            Total chain falls: <strong>{data.totalFalls}</strong>
          </span>
        )}
      </div>
      <div style={{ padding: '0.45rem 0.7rem', borderRadius: '6px', border: '1px solid var(--accent)', background: 'var(--surface)', color: 'var(--text)', fontWeight: 600, fontSize: '0.88rem' }}>
        {activeFrame.caption}
      </div>
      <SlabElevationCanvas
        stack={data.stack} graph={data.graph} initialBounds={data.initialBounds}
        frame={activeFrame} selectedIndex={effectiveSelected} cascadeIndices={cascadeIndices}
        onSelectBrick={setSelectedIndex}
      />
      {activeFrame.isFinal && (
        <div style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '0.84rem', color: 'var(--text)' }}>
          {selectedBrick ? (
            <span>
              <strong>Brick {formatBrickLabel(selectedBrick.id)}</strong> (z={selectedBrick.zMin}..{selectedBrick.zMax}, {data.graph.isSafe(selectedBrick.index) ? 'safe' : 'load-bearing'}) — Supporters:{' '}
              {formatIndexList(data.graph.supportersOf(selectedBrick.index), data.stack)} · Direct dependents:{' '}
              {formatIndexList(data.graph.dependentsOf(selectedBrick.index), data.stack)} · Cascade falls:{' '}
              <strong>{cascadeIndices.length}</strong>
              {cascadeIndices.length > 0 ? ` (${formatIndexList(cascadeIndices, data.stack)})` : ''}
            </span>
          ) : (
            <span className="muted">Click any settled brick in the X-Z or Y-Z projection to inspect its support graph and disintegration cascade.</span>
          )}
        </div>
      )}
      <PlaybackControls
        step={playback.step} totalSteps={totalFrames} isPlaying={playback.isPlaying} speedMs={playback.speedMs}
        onTogglePlay={() => togglePlayback(playback, totalFrames)}
        onStepChange={(s) => jumpToStep(playback, s)}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
