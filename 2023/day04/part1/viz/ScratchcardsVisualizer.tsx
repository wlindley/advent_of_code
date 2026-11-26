import { useMemo } from 'react';
import { PlaybackControls, usePlayback, type PlaybackState, type VisualizerProps } from '../../../../shared/viz';
import { DEFAULT_MAX_TRACE_STEPS, solver, type ScratchcardTraceFrame } from '../domain';

type TraceState =
  | { readonly ok: true; readonly frames: readonly ScratchcardTraceFrame[]; readonly totalCards: number }
  | { readonly ok: false; readonly message: string };

const BOX_STYLE = { padding: '0.55rem 0.75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)' };

function buildTrace(rawInput: string): TraceState {
  try {
    const cards = solver.parse(rawInput);
    const frames = solver.trace!(cards, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, frames, totalCards: cards.length };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function togglePlayback(playback: PlaybackState, totalFrames: number): void {
  if (!playback.isPlaying && playback.step >= totalFrames - 1) playback.setStep(0);
  playback.togglePlay();
}

function selectStep(playback: PlaybackState, nextStep: number): void {
  if (playback.isPlaying) playback.togglePlay();
  playback.setStep(nextStep);
}

function renderBadgeStrip(frame: ScratchcardTraceFrame, totalCards: number, sampledCount: number) {
  return (
    <div className="meta-row">
      <span className="badge">Card #{frame.card.id} ({frame.cardIndex + 1} / {totalCards})</span>
      <span className={`badge ${frame.matchCount > 0 ? 'status-solved' : ''}`}>
        {frame.matchCount} {frame.matchCount === 1 ? 'match' : 'matches'} (+{frame.cardPoints} pts)
      </span>
      <span className="badge">Winning Cards: <strong>{frame.winningCardCount}</strong></span>
      <span className="badge">Running Total: <strong className="gold">{frame.runningTotal}</strong></span>
      {totalCards > sampledCount && <span className="muted">Sampled {sampledCount} of {totalCards} cards</span>}
    </div>
  );
}

function renderNumberRow(label: string, numbers: readonly number[], matchedSet: ReadonlySet<number>) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.35rem' }}>
      <span className="eyebrow" style={{ minWidth: 70, fontWeight: 700, color: 'var(--text)' }}>{label}</span>
      {numbers.map((num, idx) => {
        const hit = matchedSet.has(num);
        const style = {
          fontVariantNumeric: 'tabular-nums',
          background: hit ? 'var(--surface)' : 'var(--bg)',
          borderColor: hit ? 'var(--ok)' : 'var(--border)',
          borderWidth: hit ? 2 : 1,
          color: hit ? 'var(--ok)' : 'var(--text)',
          fontWeight: hit ? 700 : 500,
        };
        return <span key={`${idx}-${num}`} className="badge" style={style}>{num}</span>;
      })}
    </div>
  );
}

function renderCardBoard(frame: ScratchcardTraceFrame) {
  const matchedSet = new Set(frame.matchingNumbers);
  return (
    <div style={{ ...BOX_STYLE, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
      {renderNumberRow('Winning', frame.card.winningNumbers, matchedSet)}
      {renderNumberRow('Owned', frame.card.ownedNumbers, matchedSet)}
    </div>
  );
}

function renderLadderNode(value: string, idx: number, active: boolean, peak: boolean) {
  const x = 8 + idx * 72;
  const stroke = peak ? 'var(--gold)' : active ? 'var(--ok)' : 'var(--border)';
  const textFill = peak ? 'var(--gold)' : active ? 'var(--ok)' : 'var(--muted)';
  return (
    <g key={idx}>
      {idx > 0 && <line x1={x - 18} y1={24} x2={x - 2} y2={24} stroke={active ? 'var(--ok)' : 'var(--border)'} strokeWidth={2} />}
      <rect x={x} y={8} width={52} height={32} rx={6} fill={peak || active ? 'var(--surface)' : 'var(--bg)'} stroke={stroke} strokeWidth={peak ? 2.2 : 1.4} />
      <text x={x + 26} y={28} textAnchor="middle" fontSize={12} fontWeight={active ? 700 : 500} fill={textFill}>{value}</text>
    </g>
  );
}

function renderDoublingLadder(matchCount: number, cardPoints: number) {
  const visible = Math.max(4, Math.min(matchCount, 6));
  const labels = Array.from({ length: visible }, (_, i) => (matchCount > 6 && i === visible - 1 ? `${cardPoints}` : `${2 ** i}`));
  const peakIdx = Math.min(matchCount, visible) - 1;
  return (
    <div style={{ ...BOX_STYLE, marginTop: '0.55rem' }}>
      <svg viewBox="0 0 540 48" style={{ width: '100%', maxWidth: 620, display: 'block' }} role="img" aria-label="Doubling points ladder">
        {labels.map((lbl, idx) => renderLadderNode(lbl, idx, idx < matchCount, idx === peakIdx && matchCount > 0))}
        <text x={528} y={28} textAnchor="end" fontSize={12} fontWeight={700} fill={matchCount > 0 ? 'var(--gold)' : 'var(--muted)'}>= {cardPoints} pts</text>
      </svg>
    </div>
  );
}

function renderJumpStrip(frames: readonly ScratchcardTraceFrame[], activeIndex: number, playback: PlaybackState) {
  const start = Math.max(0, Math.min(activeIndex - 2, frames.length - 6));
  return (
    <div className="meta-row" style={{ marginTop: '0.5rem' }}>
      {frames.slice(start, start + 6).map((item, offset) => {
        const idx = start + offset;
        const active = idx === activeIndex;
        const style = { fontSize: '0.8rem', borderColor: active ? 'var(--accent)' : 'var(--border)', fontWeight: active ? 700 : 500, color: active ? 'var(--accent)' : 'var(--text)' };
        return <button key={item.card.id} type="button" onClick={() => selectStep(playback, idx)} style={style}>C{item.card.id} ({item.matchCount}m)</button>;
      })}
    </div>
  );
}

export function ScratchcardsVisualizer({ rawInput }: VisualizerProps) {
  const traceState = useMemo(() => buildTrace(rawInput), [rawInput]);
  const frames = traceState.ok ? traceState.frames : [];
  const playback = usePlayback(frames.length, rawInput, 260);
  if (!traceState.ok) return <p className="error-text">Unable to visualize input: {traceState.message}</p>;
  if (frames.length === 0) return <p className="muted">No scratchcards to visualize.</p>;
  const frame = frames[playback.step]!;
  return (
    <div>
      {renderBadgeStrip(frame, traceState.totalCards, frames.length)}
      {renderCardBoard(frame)}
      {renderDoublingLadder(frame.matchCount, frame.cardPoints)}
      {renderJumpStrip(frames, playback.step, playback)}
      <PlaybackControls
        step={playback.step}
        totalSteps={frames.length}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={() => togglePlayback(playback, frames.length)}
        onStepChange={(next) => selectStep(playback, next)}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
