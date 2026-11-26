import { useMemo } from 'react';
import { PlaybackControls, type VisualizerProps, usePlayback } from '../../../../shared/viz';
import {
  type LinenLayout,
  type LinenTraceFrame,
  STRIPE_COLORS,
  buildLinenTrace,
  parseLinenLayout,
} from '../index';
import { LinenRibbon } from './LinenRibbon';

export interface LinenVisualizerProps extends VisualizerProps {
  readonly mode: 'possible' | 'arrangements';
}

type TraceState =
  | { readonly ok: true; readonly layout: LinenLayout; readonly frames: readonly LinenTraceFrame[] }
  | { readonly ok: false; readonly message: string };

const STRIPE_LEGEND: ReadonlyArray<readonly [string, string, string]> = [
  ['w (white)', '#f8fafc', '#64748b'],
  ['u (blue)', '#2563eb', '#1d4ed8'],
  ['b (black)', '#1e293b', '#0f172a'],
  ['r (red)', '#dc2626', '#b91c1c'],
  ['g (green)', '#16a34a', '#15803d'],
];

function buildTraceState(rawInput: string): TraceState {
  try {
    const layout = parseLinenLayout(rawInput);
    return { ok: true, layout, frames: buildLinenTrace(layout) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function LinenHud({ layout, frame, isLastFrame, mode }: {
  readonly layout: LinenLayout;
  readonly frame: LinenTraceFrame;
  readonly isLastFrame: boolean;
  readonly mode: 'possible' | 'arrangements';
}) {
  const statusColor = frame.analysis.possible ? 'var(--ok)' : 'var(--err)';
  const totalLabel = mode === 'possible'
    ? `${frame.cumulativePossible} / ${frame.designIndex + 1}`
    : frame.cumulativeArrangements.toString();

  return (
    <div className="meta-row" style={{ color: 'var(--text)' }}>
      <span className="badge">Patterns: <code>{layout.patternCount}</code></span>
      <span className="badge">Design: <code>{frame.designIndex + 1} / {frame.totalDesigns}</code></span>
      <span className="badge" style={{ borderColor: statusColor, color: statusColor }}>
        {frame.analysis.possible ? 'Possible' : 'Impossible'}
      </span>
      <span className="badge">Design Ways: <code>{frame.analysis.wayCount.toString()}</code></span>
      <span className={isLastFrame ? 'badge status-solved' : 'badge'} style={isLastFrame ? { borderColor: 'var(--gold)' } : undefined}>
        {mode === 'possible' ? 'Cumulative Possible: ' : 'Cumulative Arrangements: '}
        <strong className={isLastFrame ? 'gold' : undefined}><code>{totalLabel}</code></strong>
      </span>
    </div>
  );
}

function SampledDesignStrip({ frames, activeStep, onSelectStep }: {
  readonly frames: readonly LinenTraceFrame[];
  readonly activeStep: number;
  readonly onSelectStep: (idx: number) => void;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
      {frames.map((item, idx) => {
        const active = idx === activeStep;
        const label = item.analysis.design.length > 10 ? `${item.analysis.design.slice(0, 10)}…` : item.analysis.design;
        return (
          <button
            key={item.designIndex}
            type="button"
            onClick={() => onSelectStep(idx)}
            style={{
              padding: '0.2rem 0.5rem', fontSize: '0.76rem', color: 'var(--text)',
              borderColor: active ? 'var(--accent)' : item.analysis.possible ? 'var(--ok)' : 'var(--err)',
              borderWidth: active ? 2 : 1, fontWeight: active ? 700 : 500,
            }}
          >
            {item.analysis.possible ? '✓' : '✗'} #{item.designIndex + 1} <code>{label}</code>
          </button>
        );
      })}
    </div>
  );
}

/** Interactive design-by-design DP and witness visualizer for Day 19 Linen Layout. */
export function LinenVisualizer({ rawInput, mode }: LinenVisualizerProps) {
  const state = useMemo(() => buildTraceState(rawInput), [rawInput]);
  const totalSteps = state.ok ? state.frames.length : 0;
  const playback = usePlayback(totalSteps, `${rawInput}::${mode}`, 160);

  if (!state.ok) return <p className="error-text">Unable to visualize input: {state.message}</p>;
  const frame = state.frames[playback.step];
  if (!frame) return <p className="error-text">Unable to visualize input: No trace frames</p>;

  const jumpToStep = (next: number) => {
    if (playback.isPlaying) playback.togglePlay();
    playback.setStep(next);
  };

  return (
    <div className="stack">
      <LinenHud layout={state.layout} frame={frame} isLastFrame={playback.step === totalSteps - 1} mode={mode} />
      <LinenRibbon analysis={frame.analysis} />
      <SampledDesignStrip frames={state.frames} activeStep={playback.step} onSelectStep={jumpToStep} />
      <div className="meta-row" style={{ fontSize: '0.8rem', color: 'var(--text)' }}>
        {STRIPE_LEGEND.map(([label, bg, border], idx) => (
          <span key={STRIPE_COLORS[idx]} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: bg, border: `1.5px solid ${border}` }} />
            {label}
          </span>
        ))}
      </div>
      <PlaybackControls
        step={playback.step}
        totalSteps={totalSteps}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={() => {
          if (!playback.isPlaying && playback.step >= totalSteps - 1) playback.setStep(0);
          playback.togglePlay();
        }}
        onStepChange={jumpToStep}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
