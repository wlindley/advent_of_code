import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import { type MarketOptimizationResult, type MarketSnapshot, parseBuyerSeeds } from '../index';
import { MarketChartSvg } from './MarketChartSvg';

export interface MonkeyMarketVisualizerProps {
  readonly rawInput: string;
  readonly cacheKey: string;
  readonly buildTrace: (seeds: readonly number[]) => readonly MarketSnapshot[];
}

type TraceState =
  | { readonly ok: true; readonly frames: readonly MarketSnapshot[] }
  | { readonly ok: false; readonly message: string };

function buildTraceState(
  rawInput: string,
  buildTrace: (seeds: readonly number[]) => readonly MarketSnapshot[],
): TraceState {
  try {
    return { ok: true, frames: buildTrace(parseBuyerSeeds(rawInput)) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function MarketHud({ snapshot }: { readonly snapshot: MarketSnapshot }) {
  const done = snapshot.isComplete;
  const phaseColor = done ? 'var(--ok)' : 'var(--accent)';
  const best = snapshot.optimization?.bestCandidate ?? null;
  return (
    <div className="meta-row" style={{ color: 'var(--text)' }}>
      <span className="badge">Buyers: <code>{snapshot.revealedBuyerCount} / {snapshot.totalBuyers}</code></span>
      <span className="badge" style={{ borderColor: phaseColor, color: phaseColor }}>
        Phase: <code>{snapshot.phase}</code>
      </span>
      <span className="badge">
        Active: <code>#{snapshot.activeBuyer.buyerIndex + 1} ({snapshot.activeBuyer.initialSecret})</code>
      </span>
      <span className={done ? 'badge status-solved' : 'badge'} style={done ? { borderColor: 'var(--gold)' } : undefined}>
        Secret Sum: <strong className={done ? 'gold' : undefined}>
          <code>{snapshot.revealedSecretSum.toString()} / {snapshot.totalFinalSecret.toString()}</code>
        </strong>
      </span>
      {best !== null && (
        <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
          Best: <code>[{best.label}]</code> = <strong>{best.totalBananas}</strong>
        </span>
      )}
    </div>
  );
}

function BuyerTable({ snapshot }: { readonly snapshot: MarketSnapshot }) {
  const buyers = snapshot.result.buyers;
  const maxRows = 10;
  const start = Math.max(0, Math.min(buyers.length - maxRows, snapshot.activeBuyerIndex - 4));
  const slice = buyers.slice(start, start + maxRows);
  return (
    <div className="table-scroll" style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}>
      <table className="quality-table">
        <thead>
          <tr><th>Buyer</th><th>Initial Secret</th><th>{snapshot.result.steps}th Secret</th><th>Final Price</th></tr>
        </thead>
        <tbody>
          {slice.map((b) => {
            const revealed = b.buyerIndex < snapshot.revealedBuyerCount;
            const active = b.buyerIndex === snapshot.activeBuyerIndex;
            const bg = active ? 'rgba(9, 105, 218, 0.09)' : undefined;
            return (
              <tr key={b.buyerIndex} style={{ background: bg, opacity: revealed ? 1 : 0.45 }}>
                <td><code>#{b.buyerIndex + 1}</code></td>
                <td><code>{b.initialSecret}</code></td>
                <td><code>{revealed ? b.finalSecret : '—'}</code></td>
                <td><code>{revealed ? b.finalPrice : '—'}</code></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function LeaderboardTable({ optimization }: { readonly optimization: MarketOptimizationResult }) {
  return (
    <div className="table-scroll" style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}>
      <table className="quality-table">
        <thead>
          <tr><th>Rank</th><th>4-Delta Sequence</th><th>Total Bananas</th><th>Matched Buyers</th></tr>
        </thead>
        <tbody>
          {optimization.topCandidates.map((cand, idx) => (
            <tr key={cand.key} style={idx === 0 ? { background: 'rgba(154, 103, 0, 0.09)' } : undefined}>
              <td><code>#{idx + 1}</code></td>
              <td><code>[{cand.label}]</code></td>
              <td><strong className={idx === 0 ? 'gold' : undefined}><code>{cand.totalBananas}</code></strong></td>
              <td><code>{cand.matchedBuyers} / {optimization.buyerCount}</code></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Shared interactive Monkey Market visualizer parameterized by trace builder. */
export function MonkeyMarketVisualizer({ rawInput, cacheKey, buildTrace }: MonkeyMarketVisualizerProps) {
  const state = useMemo(() => buildTraceState(rawInput, buildTrace), [rawInput, buildTrace]);
  const totalSteps = state.ok ? state.frames.length : 0;
  const playback = usePlayback(totalSteps, `${rawInput}::${cacheKey}`, 240);
  if (!state.ok) return <p className="error-text">Unable to visualize input: {state.message}</p>;
  const snapshot = state.frames[playback.step];
  if (!snapshot) return <p className="error-text">Unable to visualize input: No trace frames</p>;

  return (
    <div className="stack">
      <MarketHud snapshot={snapshot} />
      <MarketChartSvg snapshot={snapshot} />
      <BuyerTable snapshot={snapshot} />
      {snapshot.optimization !== null && <LeaderboardTable optimization={snapshot.optimization} />}
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
