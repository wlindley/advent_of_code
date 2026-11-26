import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_RECONSTRUCT_LENGTH,
  type KeypadConfig,
  type KeypadConundrumSnapshot,
  buildKeypadTrace,
  parseDoorCodes,
} from '../index';
import { KeypadSvg } from './KeypadSvg';

export interface KeypadConundrumVisualizerProps {
  readonly rawInput: string;
  readonly config: KeypadConfig;
}

type TraceState =
  | { readonly ok: true; readonly frames: readonly KeypadConundrumSnapshot[] }
  | { readonly ok: false; readonly message: string };

function buildTraceState(rawInput: string, config: KeypadConfig): TraceState {
  try {
    return { ok: true, frames: buildKeypadTrace(parseDoorCodes(rawInput), config) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function KeypadHud({ snapshot }: { readonly snapshot: KeypadConundrumSnapshot }) {
  const isComplete = snapshot.phase === 'complete';
  const phaseColor = isComplete ? 'var(--ok)' : 'var(--accent)';
  const total = snapshot.result.totalComplexity;
  return (
    <div className="meta-row" style={{ color: 'var(--text)' }}>
      <span className="badge">Codes: <code>{snapshot.revealedCodeCount} / {snapshot.result.entries.length}</code></span>
      <span className="badge">Robots: <code>D={snapshot.config.directionalRobots}</code></span>
      <span className="badge" style={{ borderColor: phaseColor, color: phaseColor }}>
        Phase: <code>{snapshot.phase}</code>
      </span>
      <span className="badge">
        Active: <code>{snapshot.activeEntry ? snapshot.activeEntry.code.raw : `depth ${snapshot.activeDepth}`}</code>
      </span>
      <span className={isComplete ? 'badge status-solved' : 'badge'} style={isComplete ? { borderColor: 'var(--gold)' } : undefined}>
        Complexity: <strong className={isComplete ? 'gold' : undefined}>
          <code>{snapshot.revealedComplexity.toString()} / {total.toString()}</code>
        </strong>
      </span>
    </div>
  );
}

function ComplexityTable({ snapshot }: { readonly snapshot: KeypadConundrumSnapshot }) {
  return (
    <div className="table-scroll" style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}>
      <table className="quality-table">
        <thead>
          <tr><th>Code</th><th>Numeric</th><th>Shortest Length</th><th>Complexity</th></tr>
        </thead>
        <tbody>
          {snapshot.result.entries.map((entry, idx) => {
            const revealed = idx < snapshot.revealedCodeCount;
            const bg = idx === snapshot.activeCodeIndex ? 'rgba(9, 105, 218, 0.09)' : undefined;
            return (
              <tr key={`${idx}-${entry.code.raw}`} style={{ background: bg, opacity: revealed ? 1 : 0.45 }}>
                <td><code>{entry.code.raw}</code></td>
                <td><code>{entry.code.numericValue.toString()}</code></td>
                <td><code>{revealed ? entry.shortestLength.toString() : '—'}</code></td>
                <td><code>{revealed ? entry.complexity.toString() : '—'}</code></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function LayerReadout({ snapshot }: { readonly snapshot: KeypadConundrumSnapshot }) {
  const entry = snapshot.activeEntry;
  if (!entry) {
    return (
      <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
        Precomputing optimal 5×5 directional transition costs at depth {snapshot.activeDepth} of {snapshot.config.directionalRobots}.
      </p>
    );
  }
  const boxStyle = { gap: '0.35rem', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)' };
  if (snapshot.activeLayers) {
    return (
      <div className="stack" style={boxStyle}>
        <span className="eyebrow">Expanded Command Chain for {entry.code.raw}</span>
        {snapshot.activeLayers.map((seq, idx) => (
          <div key={idx} style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
            <strong style={{ color: 'var(--accent)' }}>Layer {idx}</strong> ({seq.length}): <code>{seq}</code>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="stack" style={boxStyle}>
      <span className="eyebrow">Layer Chain Summary for {entry.code.raw}</span>
      <div style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
        <strong style={{ color: 'var(--accent)' }}>Layer 0</strong> ({snapshot.activeNumericSeq?.length ?? 0}): <code>{snapshot.activeNumericSeq}</code>
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
        Layer {snapshot.config.directionalRobots} exact length: <code>{entry.shortestLength.toString()}</code> (omitted past {DEFAULT_MAX_RECONSTRUCT_LENGTH} chars).
      </div>
    </div>
  );
}

/** Shared interactive Keypad Conundrum visualizer parameterized by `KeypadConfig`. */
export function KeypadConundrumVisualizer({ rawInput, config }: KeypadConundrumVisualizerProps) {
  const state = useMemo(() => buildTraceState(rawInput, config), [rawInput, config]);
  const totalSteps = state.ok ? state.frames.length : 0;
  const playback = usePlayback(totalSteps, `${rawInput}::${config.directionalRobots}`, 260);
  if (!state.ok) return <p className="error-text">Unable to visualize input: {state.message}</p>;
  const snapshot = state.frames[playback.step];
  if (!snapshot) return <p className="error-text">Unable to visualize input: No trace frames</p>;
  return (
    <div className="stack">
      <KeypadHud snapshot={snapshot} />
      <KeypadSvg snapshot={snapshot} />
      <ComplexityTable snapshot={snapshot} />
      <LayerReadout snapshot={snapshot} />
      <PlaybackControls
        step={playback.step}
        totalSteps={totalSteps}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={() => {
          if (!playback.isPlaying && playback.step >= totalSteps - 1) playback.setStep(0);
          playback.togglePlay();
        }}
        onStepChange={(next) => {
          if (playback.isPlaying) playback.togglePlay();
          playback.setStep(next);
        }}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
