import { useMemo, useState } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, usePlayback, type PlaybackState } from '../../../../shared/viz';
import { DEFAULT_MAX_TRACE_STEPS, type KeepAwaySetup, type KeepAwayTraceFrame } from '../index';
import { ThrowNetworkSvg } from './ThrowNetworkSvg';

export interface KeepAwayVisualizerProps {
  readonly rawInput: string;
  readonly solver: PuzzleSolver<KeepAwaySetup, bigint, KeepAwayTraceFrame>;
  readonly reliefLabel: string;
}

type VizState =
  | { readonly ok: true; readonly setup: KeepAwaySetup; readonly frames: readonly KeepAwayTraceFrame[] }
  | { readonly ok: false; readonly message: string };

const MAX_SHOWN_ITEMS = 8;

function buildVizState(
  rawInput: string,
  solver: PuzzleSolver<KeepAwaySetup, bigint, KeepAwayTraceFrame>,
): VizState {
  try {
    const setup = solver.parse(rawInput);
    const frames = solver.trace?.(setup, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) ?? [];
    return { ok: true, setup, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function handleTogglePlay(playback: PlaybackState, lastStep: number): void {
  if (!playback.isPlaying && playback.step >= lastStep) playback.setStep(0);
  playback.togglePlay();
}

function handleStepChange(playback: PlaybackState, nextStep: number): void {
  if (playback.isPlaying) playback.togglePlay();
  playback.setStep(nextStep);
}

function formatQueuePreview(queue: readonly bigint[]): string {
  if (queue.length === 0) return '(empty)';
  const shown = queue.slice(0, MAX_SHOWN_ITEMS).map(String).join(', ');
  const extra = queue.length - MAX_SHOWN_ITEMS;
  return extra > 0 ? `${shown}, … (+${extra} more)` : shown;
}

function KpiBadges({ setup, frame, reliefLabel, frameCount }: {
  readonly setup: KeepAwaySetup;
  readonly frame: KeepAwayTraceFrame;
  readonly reliefLabel: string;
  readonly frameCount: number;
}) {
  const [top0, top1] = frame.topTwoIndices;
  return (
    <div className="meta-row" style={{ marginBottom: '0.6rem' }}>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Round: <code>{frame.round} / {frame.totalRounds}</code>
      </span>
      <span className="badge">Relief: <code>{reliefLabel}</code></span>
      <span className="badge">Common mod: <code>{setup.commonModulus.toString()}</code></span>
      <span className="badge">Top 2: <code>M{top0} &amp; M{top1}</code></span>
      <span className={`badge ${frame.isComplete ? 'status-solved' : ''}`}>
        Monkey Business: <strong>{frame.monkeyBusiness.toString()}</strong>
      </span>
      {frameCount < frame.totalRounds + 1 && (
        <span className="muted">Sampled {frameCount} of {frame.totalRounds + 1} rounds</span>
      )}
    </div>
  );
}

function MonkeyLedger({ setup, frame, selectedMonkey, onSelectMonkey }: {
  readonly setup: KeepAwaySetup;
  readonly frame: KeepAwayTraceFrame;
  readonly selectedMonkey: number | null;
  readonly onSelectMonkey: (id: number) => void;
}) {
  const [top0, top1] = frame.topTwoIndices;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
      <div className="eyebrow">Monkey Inspection &amp; Queue Ledger</div>
      {setup.monkeys.map((m) => {
        const isTop0 = m.id === top0;
        const isTop1 = m.id === top1;
        const isSelected = m.id === selectedMonkey;
        const borderColor = isSelected ? 'var(--accent)' : isTop0 ? 'var(--gold)' : 'var(--border)';
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onSelectMonkey(m.id)}
            style={{
              textAlign: 'left',
              padding: '0.5rem 0.65rem',
              borderRadius: '8px',
              border: `1px solid ${borderColor}`,
              background: isSelected ? 'var(--bg)' : 'var(--surface)',
              color: 'var(--text)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
              <strong>
                Monkey {m.id}{' '}
                {isTop0 && <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>#1</span>}
                {isTop1 && <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>#2</span>}
              </strong>
              <span className="nowrap" style={{ fontSize: '0.84rem' }}>
                Inspected: <strong>{frame.counts[m.id]}</strong>
              </span>
            </div>
            <div className="muted" style={{ fontSize: '0.78rem', marginTop: '0.15rem' }}>
              <code>{m.operation.expression}</code> · <code>% {m.divisor.toString()}</code> → T:M{m.trueTarget} / F:M{m.falseTarget}
            </div>
            <div style={{ fontSize: '0.8rem', marginTop: '0.2rem', wordBreak: 'break-word' }}>
              Items ({frame.queues[m.id]!.length}): <code>{formatQueuePreview(frame.queues[m.id]!)}</code>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/** Interactive Keep Away round visualizer showing throw network and queue ledger. */
export function KeepAwayVisualizer({ rawInput, solver, reliefLabel }: KeepAwayVisualizerProps) {
  const state = useMemo(() => buildVizState(rawInput, solver), [rawInput, solver]);
  const frameCount = state.ok ? state.frames.length : 0;
  const playback = usePlayback(frameCount, rawInput, 220);
  const [selectedMonkey, setSelectedMonkey] = useState<number | null>(null);

  if (!state.ok) return <p className="error-text">Cannot visualize input: {state.message}</p>;
  const frame = state.frames[playback.step];
  if (!frame) return <p className="muted">No trace frames available.</p>;

  const activeSelected = selectedMonkey !== null && selectedMonkey < state.setup.monkeyCount ? selectedMonkey : null;
  const toggleMonkey = (id: number) => setSelectedMonkey((prev) => (prev === id ? null : id));

  return (
    <div>
      <PlaybackControls
        step={playback.step}
        totalSteps={frameCount}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={() => handleTogglePlay(playback, frameCount - 1)}
        onStepChange={(next) => handleStepChange(playback, next)}
        onSpeedChange={playback.setSpeedMs}
      />
      <KpiBadges setup={state.setup} frame={frame} reliefLabel={reliefLabel} frameCount={frameCount} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '0.9rem', alignItems: 'start' }}>
        <ThrowNetworkSvg setup={state.setup} frame={frame} selectedMonkey={activeSelected} onSelectMonkey={toggleMonkey} />
        <MonkeyLedger setup={state.setup} frame={frame} selectedMonkey={activeSelected} onSelectMonkey={toggleMonkey} />
      </div>
    </div>
  );
}
