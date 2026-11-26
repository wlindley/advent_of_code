import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import { type LanGraph, type LanPartySnapshot, parseLanGraph } from '../index';
import { LanGraphSvg } from './LanGraphSvg';

export interface LanPartyVisualizerProps {
  readonly rawInput: string;
  readonly cacheKey: string;
  readonly buildTrace: (graph: LanGraph) => readonly LanPartySnapshot[];
  readonly summaryLabel: string;
  readonly formatAnswer: (snapshot: LanPartySnapshot) => string;
}

type TraceState =
  | { readonly ok: true; readonly frames: readonly LanPartySnapshot[] }
  | { readonly ok: false; readonly message: string };

function buildTraceState(
  rawInput: string,
  buildTrace: (graph: LanGraph) => readonly LanPartySnapshot[],
): TraceState {
  try {
    return { ok: true, frames: buildTrace(parseLanGraph(rawInput)) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function LanHud({
  snapshot,
  summaryLabel,
  formatAnswer,
}: {
  readonly snapshot: LanPartySnapshot;
  readonly summaryLabel: string;
  readonly formatAnswer: (snapshot: LanPartySnapshot) => string;
}) {
  const done = snapshot.isComplete;
  const phaseColor = done ? 'var(--ok)' : 'var(--accent)';
  return (
    <div className="meta-row" style={{ color: 'var(--text)' }}>
      <span className="badge">
        Cliques: <code>{snapshot.revealedCount} / {snapshot.totalCliques}</code>
      </span>
      <span className="badge" style={{ borderColor: phaseColor, color: phaseColor }}>
        Phase: <code>{snapshot.phase}</code>
      </span>
      <span className="badge">
        Max size: <code>{snapshot.largestRevealedSize}</code>
      </span>
      <span className={done ? 'badge status-solved' : 'badge'} style={done ? { borderColor: 'var(--gold)' } : undefined}>
        {summaryLabel}: <strong className={done ? 'gold' : undefined}><code>{formatAnswer(snapshot)}</code></strong>
      </span>
    </div>
  );
}

function CliqueTable({ snapshot }: { readonly snapshot: LanPartySnapshot }) {
  const cliques = snapshot.cliques;
  const maxRows = 10;
  const anchor = Math.max(0, snapshot.revealedCount - 1);
  const start = Math.max(0, Math.min(cliques.length - maxRows, anchor - 4));
  const slice = cliques.slice(start, start + maxRows);
  return (
    <div className="table-scroll" style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}>
      <table className="quality-table">
        <thead>
          <tr><th>#</th><th>Clique Password</th><th>Size</th><th>Has t*</th></tr>
        </thead>
        <tbody>
          {slice.length === 0 ? (
            <tr><td colSpan={4} className="muted">No matching cliques found.</td></tr>
          ) : (
            slice.map((clique, offset) => {
              const index = start + offset;
              const revealed = index < snapshot.revealedCount;
              const active = index === snapshot.revealedCount - 1;
              return (
                <tr key={clique.password} style={{ background: active ? 'rgba(9, 105, 218, 0.09)' : undefined, opacity: revealed ? 1 : 0.45 }}>
                  <td><code>#{index + 1}</code></td>
                  <td><code>{clique.password}</code></td>
                  <td><code>{clique.size}</code></td>
                  <td><code>{clique.hasNodeStartingWith('t') ? 'yes' : 'no'}</code></td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

/** Shared interactive LAN Party visualizer parameterized by trace builder and answer formatter. */
export function LanPartyVisualizer({
  rawInput,
  cacheKey,
  buildTrace,
  summaryLabel,
  formatAnswer,
}: LanPartyVisualizerProps) {
  const state = useMemo(() => buildTraceState(rawInput, buildTrace), [rawInput, buildTrace]);
  const totalSteps = state.ok ? state.frames.length : 0;
  const playback = usePlayback(totalSteps, `${rawInput}::${cacheKey}`, 260);
  if (!state.ok) return <p className="error-text">Unable to visualize input: {state.message}</p>;
  const snapshot = state.frames[playback.step];
  if (!snapshot) return <p className="error-text">Unable to visualize input: No trace frames</p>;

  return (
    <div className="stack">
      <LanHud snapshot={snapshot} summaryLabel={summaryLabel} formatAnswer={formatAnswer} />
      <LanGraphSvg snapshot={snapshot} />
      <CliqueTable snapshot={snapshot} />
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
