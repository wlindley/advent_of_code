import { useMemo, useState } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import { parseCalibrationInput, type CalibrationEquation } from '../equation';
import type { CalibrationOperator } from '../operator';
import {
  DEFAULT_MAX_TRACE_STEPS,
  DEFAULT_MAX_TREE_NODES,
  traceCalibration,
  type CalibrationTraceFrame,
} from '../search';
import { ReverseTreeSvg } from './ReverseTreeSvg';
import { VerificationRibbon } from './VerificationRibbon';

type FilterMode = 'all' | 'solvable' | 'unsolvable';

type VizState =
  | { readonly ok: true; readonly equations: readonly CalibrationEquation[]; readonly frames: readonly CalibrationTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildState(rawInput: string, operators: readonly CalibrationOperator[]): VizState {
  try {
    const equations = parseCalibrationInput(rawInput);
    const frames = traceCalibration(equations, operators, {
      maxSteps: DEFAULT_MAX_TRACE_STEPS,
      maxTreeNodes: DEFAULT_MAX_TREE_NODES,
    });
    return { ok: true, equations, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function KpiHeader({ frame }: { readonly frame: CalibrationTraceFrame }) {
  const { trace } = frame;
  const explored = BigInt(trace.visitedCount + trace.prunedCount);
  const naive = trace.naiveCombinations;
  const savedPct = naive > explored ? Number(((naive - explored) * 100n) / naive) : 0;
  return (
    <div className="meta-row">
      <span className="badge status-solved">Running Total: <strong className="gold"><code>{frame.runningTotal.toString()}</code></strong></span>
      <span className="badge">Equation <code>#{frame.equationIndex + 1} / {frame.totalEquations}</code></span>
      <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>Solved: <code>{frame.solvedSoFar}</code></span>
      <span className="badge" style={{ borderColor: 'var(--muted)', color: 'var(--muted)' }}>Unsolved: <code>{frame.unsolvedSoFar}</code></span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Explored: <code>{explored.toString()} / {naive.toString()}</code> ({savedPct}% pruned)
      </span>
    </div>
  );
}

function FilterTabs({ mode, onChange }: { readonly mode: FilterMode; readonly onChange: (next: FilterMode) => void }) {
  const tabs: readonly { readonly id: FilterMode; readonly label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'solvable', label: 'Solvable' },
    { id: 'unsolvable', label: 'Unsolvable' },
  ];
  return (
    <div className="meta-row" role="tablist" aria-label="Equation filter">
      {tabs.map((tab) => (
        <button key={tab.id} type="button" role="tab" aria-selected={mode === tab.id} className={mode === tab.id ? 'primary' : ''} onClick={() => onChange(tab.id)}>
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function EquationChipBar({
  frames,
  activeIndex,
  onSelect,
}: {
  readonly frames: readonly CalibrationTraceFrame[];
  readonly activeIndex: number;
  readonly onSelect: (index: number) => void;
}) {
  return (
    <div className="meta-row" style={{ maxHeight: 84, overflowY: 'auto', padding: '0.25rem 0' }}>
      {frames.map((item, idx) => {
        const active = idx === activeIndex;
        const border = active ? 'var(--accent)' : item.trace.solvable ? 'var(--ok)' : 'var(--border)';
        return (
          <button
            key={item.equationIndex}
            type="button"
            onClick={() => onSelect(idx)}
            style={{
              padding: '0.2rem 0.5rem', fontSize: '0.76rem', fontWeight: 600,
              borderColor: border, borderWidth: active ? 2 : 1,
              background: active ? 'var(--accent)' : 'var(--surface)',
              color: active ? 'var(--surface)' : item.trace.solvable ? 'var(--ok)' : 'var(--text)',
            }}
          >
            #{item.equationIndex + 1}: {item.trace.equation.target.toString()}
          </button>
        );
      })}
    </div>
  );
}

export interface BridgeRepairVisualizerProps {
  readonly rawInput: string;
  readonly operators: readonly CalibrationOperator[];
}

export function BridgeRepairVisualizer({ rawInput, operators }: BridgeRepairVisualizerProps) {
  const [filter, setFilter] = useState<FilterMode>('all');
  const state = useMemo(() => buildState(rawInput, operators), [rawInput, operators]);
  const filteredFrames = useMemo(() => {
    if (!state.ok) return [];
    if (filter === 'solvable') return state.frames.filter((f) => f.trace.solvable);
    if (filter === 'unsolvable') return state.frames.filter((f) => !f.trace.solvable);
    return state.frames;
  }, [state, filter]);
  const playback = usePlayback(filteredFrames.length, `${rawInput}::${filter}`, 420);
  const frame = filteredFrames[playback.step] ?? null;

  if (!state.ok) {
    return <p className="error-text">Unable to visualize input: {state.message}</p>;
  }
  return (
    <div>
      <FilterTabs mode={filter} onChange={setFilter} />
      {frame ? (
        <>
          <KpiHeader frame={frame} />
          <EquationChipBar frames={filteredFrames} activeIndex={playback.step} onSelect={(idx) => { if (playback.isPlaying) playback.togglePlay(); playback.setStep(idx); }} />
          <ReverseTreeSvg trace={frame.trace} />
          <VerificationRibbon trace={frame.trace} />
        </>
      ) : (
        <p className="muted">No sampled equations match the selected filter.</p>
      )}
      <PlaybackControls
        step={playback.step} totalSteps={filteredFrames.length} isPlaying={playback.isPlaying} speedMs={playback.speedMs}
        onTogglePlay={() => { if (!playback.isPlaying && playback.step >= filteredFrames.length - 1) playback.setStep(0); playback.togglePlay(); }}
        onStepChange={(next) => { if (playback.isPlaying) playback.togglePlay(); playback.setStep(next); }}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
