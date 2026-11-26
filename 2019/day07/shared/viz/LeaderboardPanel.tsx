import type { ReactNode } from 'react';
import {
  formatPhaseTuple,
  formatSignalValue,
  normalizeSignalRatio,
  type AmplifierTraceFrame,
  type LeaderboardEntry,
} from '../index';

interface LeaderboardPanelProps {
  readonly frame: AmplifierTraceFrame;
}

function renderEntryRow(
  entry: LeaderboardEntry,
  rank: number,
  minSignal: bigint,
  maxSignal: bigint,
): ReactNode {
  const ratio = normalizeSignalRatio(entry.run.thrusterSignal, minSignal, maxSignal);
  const pct = Math.max(4, Math.round(ratio * 100));
  const barColor = rank === 1 ? 'var(--gold)' : 'var(--accent)';
  return (
    <div
      key={entry.permutationIndex}
      style={{ display: 'grid', gridTemplateColumns: '2.2rem 7.5rem 1fr auto', gap: '0.6rem', alignItems: 'center' }}
    >
      <span className="muted" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
        #{rank}
      </span>
      <code style={{ fontSize: '0.82rem' }}>[{formatPhaseTuple(entry.run.phases)}]</code>
      <div style={{ height: '10px', background: 'var(--bg)', borderRadius: '999px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: barColor }} />
      </div>
      <code style={{ fontSize: '0.82rem', fontWeight: rank === 1 ? 700 : 500 }}>
        {formatSignalValue(entry.run.thrusterSignal)}
      </code>
    </div>
  );
}

/** Displays permutation sweep progress, current vs best signal, and top-5 leaderboard. */
export function LeaderboardPanel({ frame }: LeaderboardPanelProps) {
  return (
    <section className="card" style={{ marginBottom: 0 }}>
      <div className="meta-row" style={{ marginTop: 0 }}>
        <span className="badge">
          Permutation {frame.permutationIndex + 1} / {frame.totalPermutations}
        </span>
        <span className="badge">
          Current [{formatPhaseTuple(frame.run.phases)}]: <code>{formatSignalValue(frame.run.thrusterSignal)}</code>
        </span>
        <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
          Best [{formatPhaseTuple(frame.bestEntry.run.phases)}]:{' '}
          <code>{formatSignalValue(frame.bestEntry.run.thrusterSignal)}</code>
        </span>
      </div>
      <div className="stack" style={{ gap: '0.4rem' }}>
        {frame.topEntries.map((entry, idx) =>
          renderEntryRow(entry, idx + 1, frame.minSignal, frame.maxSignal),
        )}
      </div>
    </section>
  );
}
