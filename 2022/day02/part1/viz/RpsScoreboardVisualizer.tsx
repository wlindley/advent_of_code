import { useMemo } from 'react';
import {
  PlaybackControls,
  usePlayback,
  type PlaybackState,
  type VisualizerProps,
} from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  evaluateOutcome,
  Outcome,
  OUTCOME_LABELS,
  Shape,
  SHAPE_LABELS,
  type MatchupSummary,
  type ResolvedRound,
  type StrategyTraceFrame,
} from '../../shared';
import { solver } from '../domain';

const SHAPES: readonly Shape[] = [Shape.Rock, Shape.Paper, Shape.Scissors];
const OPP_CODES = ['A', 'B', 'C'] as const;
const PLY_CODES = ['X', 'Y', 'Z'] as const;

type TraceResult =
  | { readonly ok: true; readonly frames: readonly StrategyTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildTraceResult(rawInput: string): TraceResult {
  try {
    const rounds = solver.parse(rawInput);
    const frames = solver.trace!(rounds, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function outcomeColor(outcome: Outcome): string {
  if (outcome === Outcome.Win) return 'var(--ok)';
  if (outcome === Outcome.Draw) return 'var(--accent)';
  return 'var(--err)';
}

function handleTogglePlay(playback: PlaybackState, lastStep: number): void {
  if (!playback.isPlaying && playback.step >= lastStep) playback.setStep(0);
  playback.togglePlay();
}

function handleStepChange(playback: PlaybackState, nextStep: number): void {
  if (playback.isPlaying) playback.togglePlay();
  playback.setStep(nextStep);
}

function TelemetryHeader({ frame }: { readonly frame: StrategyTraceFrame }) {
  const { currentRound: cur, summary } = frame;
  const color = outcomeColor(cur.outcome);
  return (
    <div className="meta-row">
      <span className="badge">Round: <code>{cur.round.roundNumber} / {frame.totalRounds}</code></span>
      <span className="badge" style={{ borderColor: color, color }}>
        {cur.round.opponentCode} ({SHAPE_LABELS[cur.opponentShape]}) vs {cur.round.responseCode} ({SHAPE_LABELS[cur.playerShape]}) → {OUTCOME_LABELS[cur.outcome]} (+{cur.totalScore})
      </span>
      <span className="badge status-solved">Total: <strong className="gold">{summary.totalScore}</strong></span>
      <span className="badge">W {summary.wins} · D {summary.draws} · L {summary.losses}</span>
      {frame.totalRounds > frame.totalSteps && (
        <span className="muted">Sampled {frame.totalSteps} of {frame.totalRounds} rounds</span>
      )}
    </div>
  );
}

function MatchupCell({ opp, ply, active, count }: {
  readonly opp: Shape;
  readonly ply: Shape;
  readonly active: boolean;
  readonly count: number;
}) {
  const outcome = evaluateOutcome(opp, ply);
  const pts = ply + 1 + outcome * 3;
  const color = outcomeColor(outcome);
  return (
    <td style={{
      padding: '0.5rem 0.65rem',
      border: active ? `2px solid ${color}` : '1px solid var(--border)',
      background: active ? 'var(--bg)' : 'var(--surface)',
      borderRadius: 6,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 700, color }}>{OUTCOME_LABELS[outcome]} (+{pts})</div>
      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)' }}>{count}×</div>
      <div className="muted" style={{ fontSize: '0.75rem' }}>={count * pts} pts</div>
    </td>
  );
}

function MatchupMatrix({ summary, currentRound }: {
  readonly summary: MatchupSummary;
  readonly currentRound: ResolvedRound;
}) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', padding: '0.75rem', margin: '0.5rem 0', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 6 }}>
        <thead>
          <tr>
            <th className="muted" style={{ textAlign: 'left', fontSize: '0.8rem' }}>Opp \ You</th>
            {SHAPES.map((ply) => (
              <th key={ply} style={{ fontSize: '0.85rem', color: 'var(--text)' }}>
                {PLY_CODES[ply]} · {SHAPE_LABELS[ply]} (+{ply + 1})
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SHAPES.map((opp) => (
            <tr key={opp}>
              <th style={{ textAlign: 'left', fontSize: '0.85rem', color: 'var(--text)', whiteSpace: 'nowrap' }}>
                {OPP_CODES[opp]} · {SHAPE_LABELS[opp]}
              </th>
              {SHAPES.map((ply) => (
                <MatchupCell
                  key={ply} opp={opp} ply={ply}
                  active={currentRound.opponentShape === opp && currentRound.playerShape === ply}
                  count={summary.countOf(opp, ply)}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RpsScoreboardVisualizer({ rawInput }: VisualizerProps) {
  const state = useMemo(() => buildTraceResult(rawInput), [rawInput]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, rawInput, 260);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>;
  }
  return (
    <div>
      <TelemetryHeader frame={frame} />
      <MatchupMatrix summary={frame.summary} currentRound={frame.currentRound} />
      <PlaybackControls
        step={playback.step} totalSteps={frames.length} isPlaying={playback.isPlaying} speedMs={playback.speedMs}
        onTogglePlay={() => handleTogglePlay(playback, frames.length - 1)}
        onStepChange={(next) => handleStepChange(playback, next)}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
