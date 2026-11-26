import { useEffect, useMemo, useState } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, usePlayback, type PlaybackState } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS, expandedGalaxyCoords, type CosmicExpansionTraceFrame,
  type ExpandedGalaxyCoord, type GalaxyCoord, type UniverseMap,
} from '../index';
import { StarfieldCanvas } from './StarfieldCanvas';

export interface CosmicExpansionVisualizerProps {
  readonly rawInput: string;
  readonly expansionFactor: bigint;
  readonly solver: PuzzleSolver<UniverseMap, bigint, CosmicExpansionTraceFrame>;
}

type VizData =
  | {
      readonly ok: true;
      readonly universe: UniverseMap;
      readonly galaxies: readonly GalaxyCoord[];
      readonly expanded: readonly ExpandedGalaxyCoord[];
      readonly rowCounts: readonly number[];
      readonly colCounts: readonly number[];
      readonly emptyRows: number;
      readonly emptyCols: number;
      readonly frames: readonly CosmicExpansionTraceFrame[];
    }
  | { readonly ok: false; readonly message: string };

function buildVizData(
  rawInput: string, expansionFactor: bigint,
  solver: PuzzleSolver<UniverseMap, bigint, CosmicExpansionTraceFrame>,
): VizData {
  try {
    const universe = solver.parse(rawInput);
    const frames = solver.trace?.(universe, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) ?? [];
    const rowCounts = universe.rowCounts();
    const colCounts = universe.colCounts();
    return {
      ok: true, universe, galaxies: universe.galaxies(),
      expanded: expandedGalaxyCoords(universe, expansionFactor),
      rowCounts, colCounts,
      emptyRows: rowCounts.filter((c) => c === 0).length,
      emptyCols: colCounts.filter((c) => c === 0).length,
      frames,
    };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function togglePlayback(playback: PlaybackState, totalFrames: number): void {
  if (!playback.isPlaying && playback.step >= totalFrames - 1) playback.setStep(0);
  playback.togglePlay();
}

function nextSelection(current: readonly number[], clicked: number): readonly number[] {
  if (current.includes(clicked)) return current.filter((idx) => idx !== clicked);
  return current.length >= 2 ? [current[1]!, clicked] : [...current, clicked];
}

function countRiftsBetween(counts: readonly number[], a: number, b: number): number {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  let rifts = 0;
  for (let i = lo + 1; i < hi; i += 1) if (counts[i] === 0) rifts += 1;
  return rifts;
}

function absDiffBigInt(a: bigint, b: bigint): bigint {
  return a >= b ? a - b : b - a;
}

function PairInspector({ data, selectedIndices, onClear }: {
  readonly data: Extract<VizData, { readonly ok: true }>;
  readonly selectedIndices: readonly number[];
  readonly onClear: () => void;
}) {
  if (selectedIndices.length !== 2) {
    return (
      <span className="muted" style={{ fontSize: '0.84rem' }}>
        {selectedIndices.length === 1
          ? `Selected #${selectedIndices[0]! + 1} — click 1 more galaxy to inspect its expanded Manhattan path.`
          : 'Click any 2 galaxies on the starfield to inspect their expanded Manhattan distance.'}
      </span>
    );
  }
  const [i, j] = [selectedIndices[0]!, selectedIndices[1]!];
  const [gA, gB, eA, eB] = [data.galaxies[i]!, data.galaxies[j]!, data.expanded[i]!, data.expanded[j]!];
  const base = Math.abs(gA.row - gB.row) + Math.abs(gA.col - gB.col);
  const rifts = countRiftsBetween(data.rowCounts, gA.row, gB.row) + countRiftsBetween(data.colCounts, gA.col, gB.col);
  const dist = absDiffBigInt(eA.row, eB.row) + absDiffBigInt(eA.col, eB.col);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
      <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
        Pair #{i + 1}↔#{j + 1}: base {base} + {rifts} rifts = <strong>{dist.toString()}</strong>
      </span>
      <button type="button" onClick={onClear}>Clear Pair</button>
    </div>
  );
}

function TelemetryBar({ data, expansionFactor, activeFrame }: {
  readonly data: Extract<VizData, { readonly ok: true }>;
  readonly expansionFactor: bigint;
  readonly activeFrame: CosmicExpansionTraceFrame;
}) {
  const axisLabel = activeFrame.axis === 'row' ? 'Row' : 'Col';
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
      <span className="badge">Grid: <strong>{data.universe.rows}×{data.universe.cols}</strong></span>
      <span className="badge">Galaxies: <strong>{data.galaxies.length}</strong></span>
      <span className="badge">Rifts: <strong>{data.emptyRows}R / {data.emptyCols}C</strong></span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Expansion: <strong>×{expansionFactor.toString()}</strong>
      </span>
      <span className="badge" style={{ borderColor: activeFrame.isEmptyRift ? 'var(--accent)' : 'var(--border)' }}>
        {axisLabel} #{activeFrame.index} ({activeFrame.isEmptyRift ? 'Rift' : 'Slice'}):{' '}
        <strong>
          {activeFrame.prefixGalaxies} × {activeFrame.suffixGalaxies} × {activeFrame.stepWidth.toString()} = +{activeFrame.stepContribution.toString()}
        </strong>
      </span>
      <span className="badge">Row Sum: <strong>{activeFrame.rowTotal.toString()}</strong></span>
      <span className="badge">Col Sum: <strong>{activeFrame.colTotal.toString()}</strong></span>
      <span className="badge" style={{ borderColor: 'var(--gold)' }}>
        Total: <strong className="gold">{activeFrame.runningTotal.toString()}</strong>
      </span>
    </div>
  );
}

/** Shared interactive starfield & axis-sweep visualizer for Day 11 Part 1 and Part 2. */
export function CosmicExpansionVisualizer({ rawInput, expansionFactor, solver }: CosmicExpansionVisualizerProps) {
  const [selectedIndices, setSelectedIndices] = useState<readonly number[]>([]);
  const data = useMemo(() => buildVizData(rawInput, expansionFactor, solver), [rawInput, expansionFactor, solver]);
  const frames = data.ok ? data.frames : [];
  const playback = usePlayback(frames.length, rawInput, 140);
  const activeFrame = frames[playback.step];

  useEffect(() => { setSelectedIndices([]); }, [rawInput, expansionFactor]);

  if (!data.ok) return <p className="error-text">Unable to visualize input: {data.message}</p>;
  if (!activeFrame) return <p className="muted">No expansion sweep steps to visualize.</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', color: 'var(--text)' }}>
      <TelemetryBar data={data} expansionFactor={expansionFactor} activeFrame={activeFrame} />
      <StarfieldCanvas
        universe={data.universe} galaxies={data.galaxies} rowCounts={data.rowCounts}
        colCounts={data.colCounts} activeFrame={activeFrame} selectedIndices={selectedIndices}
        onSelectGalaxy={(idx) => setSelectedIndices((prev) => nextSelection(prev, idx))}
      />
      <PairInspector data={data} selectedIndices={selectedIndices} onClear={() => setSelectedIndices([])} />
      <PlaybackControls
        step={playback.step} totalSteps={frames.length} isPlaying={playback.isPlaying} speedMs={playback.speedMs}
        onTogglePlay={() => togglePlayback(playback, frames.length)}
        onStepChange={(next) => { if (playback.isPlaying) playback.togglePlay(); playback.setStep(next); }}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
