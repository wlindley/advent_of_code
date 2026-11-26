import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  MAX_ORDERED_PREVIEW,
  PebbleLine,
  type PebbleTraceFrame,
  type RuleCounts,
  type StoneBucket,
} from '../index';
import { GrowthChartSvg } from './GrowthChartSvg';

export interface PebbleEvolutionVisualizerProps {
  readonly rawInput: string;
  readonly solver: PuzzleSolver<PebbleLine, bigint, PebbleTraceFrame>;
  readonly blinkCount: number;
  readonly title?: string;
}

type VizState =
  | { readonly ok: true; readonly answer: bigint; readonly frames: readonly PebbleTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildVizState(
  rawInput: string,
  solver: PuzzleSolver<PebbleLine, bigint, PebbleTraceFrame>,
): VizState {
  try {
    const line = solver.parse(rawInput);
    const answer = solver.solve(line);
    const frames = solver.trace ? solver.trace(line, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) : [];
    return { ok: true, answer, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function safePercent(part: bigint, total: bigint): number {
  if (total <= 0n) return 0;
  return Number((part * 1000n) / total) / 10;
}

function StatusBadges({
  frame,
  blinkCount,
  answer,
}: {
  readonly frame: PebbleTraceFrame;
  readonly blinkCount: number;
  readonly answer: bigint;
}) {
  return (
    <div className="meta-row">
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Blink: <code>{frame.blink} / {blinkCount}</code>
      </span>
      <span className="badge">
        Total Stones: <strong style={{ color: 'var(--text)' }}><code>{frame.totalStones.toString()}</code></strong>
      </span>
      <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
        Distinct Labels: <code>{frame.distinctStones}</code>
      </span>
      <span className="badge status-solved">
        Final ({blinkCount}): <strong className="gold"><code>{answer.toString()}</code></strong>
      </span>
    </div>
  );
}

function OrderedPreviewRibbon({ preview }: { readonly preview: readonly bigint[] | null }) {
  if (preview === null) {
    return (
      <p className="muted" style={{ margin: '0.45rem 0', fontSize: '0.82rem' }}>
        Ordered line exceeded {MAX_ORDERED_PREVIEW.toString()} stones; tracking exact histogram &amp; dominant buckets.
      </p>
    );
  }
  return (
    <div style={{ margin: '0.5rem 0', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.35rem' }}>
        Ordered Pebble Line ({preview.length} stones)
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
        {preview.map((stone, idx) => (
          <span key={idx} className="badge" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
            <code>{stone.toString()}</code>
          </span>
        ))}
      </div>
    </div>
  );
}

function RuleBreakdownBar({ ruleCounts }: { readonly ruleCounts: RuleCounts }) {
  const total = ruleCounts.zero + ruleCounts.split + ruleCounts.scale;
  const zeroPct = safePercent(ruleCounts.zero, total);
  const splitPct = safePercent(ruleCounts.split, total);
  const scalePct = safePercent(ruleCounts.scale, total);
  return (
    <div style={{ margin: '0.6rem 0', padding: '0.55rem', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}>
      <div className="meta-row" style={{ margin: '0 0 0.35rem', fontSize: '0.78rem' }}>
        <strong>Last Blink Rules</strong>
        <span style={{ color: 'var(--gold)' }}>0→1: {ruleCounts.zero.toString()} ({zeroPct.toFixed(1)}%)</span>
        <span style={{ color: 'var(--accent)' }}>Split: {ruleCounts.split.toString()} ({splitPct.toFixed(1)}%)</span>
        <span style={{ color: 'var(--ok)' }}>×2024: {ruleCounts.scale.toString()} ({scalePct.toFixed(1)}%)</span>
      </div>
      <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', background: 'var(--border)' }}>
        <div style={{ width: `${zeroPct}%`, background: 'var(--gold)' }} />
        <div style={{ width: `${splitPct}%`, background: 'var(--accent)' }} />
        <div style={{ width: `${scalePct}%`, background: 'var(--ok)' }} />
      </div>
    </div>
  );
}

function TopBucketsList({ buckets }: { readonly buckets: readonly StoneBucket[] }) {
  return (
    <div style={{ margin: '0.6rem 0', padding: '0.55rem', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.35rem' }}>
        Top {buckets.length} Dominant Stone Labels
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.35rem', fontSize: '0.8rem' }}>
        {buckets.map((bucket) => (
          <div key={bucket.stone.toString()} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0.45rem', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg)' }}>
            <code>{bucket.stone.toString()}</code>
            <strong style={{ color: 'var(--accent)' }}>×{bucket.count.toString()}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Shared interactive visualizer for Plutonian Pebbles evolution across blinks. */
export function PebbleEvolutionVisualizer({
  rawInput,
  solver,
  blinkCount,
  title,
}: PebbleEvolutionVisualizerProps) {
  const state = useMemo(() => buildVizState(rawInput, solver), [rawInput, solver]);
  const totalSteps = state.ok ? state.frames.length : 0;
  const playback = usePlayback(totalSteps, `${rawInput}::${blinkCount}`, 220);

  if (!state.ok) return <p className="error-text">Unable to visualize input: {state.message}</p>;
  const frame = state.frames[playback.step];
  if (!frame) return null;

  return (
    <div>
      {title ? <h3 style={{ margin: '0 0 0.4rem', fontSize: '0.98rem' }}>{title}</h3> : null}
      <StatusBadges frame={frame} blinkCount={blinkCount} answer={state.answer} />
      <GrowthChartSvg frames={state.frames} activeIndex={playback.step} />
      <OrderedPreviewRibbon preview={frame.orderedPreview} />
      <RuleBreakdownBar ruleCounts={frame.ruleCounts} />
      <TopBucketsList buckets={frame.topBuckets} />
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
