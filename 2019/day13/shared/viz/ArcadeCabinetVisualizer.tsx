import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  ArcadeSolver,
  DEFAULT_MAX_TRACE_STEPS,
  RAINBOW_BAND_COLORS,
  buildArcadeSvgLayout,
  type ArcadePolicy,
  type ArcadeSvgLayout,
  type ArcadeTraceFrame,
} from '../index';

interface ArcadeCabinetVisualizerProps<TAnswer> {
  readonly rawInput: string;
  readonly solver: ArcadeSolver<TAnswer>;
}

type VizState =
  | { readonly ok: true; readonly frames: readonly ArcadeTraceFrame[]; readonly finalAnswer: string }
  | { readonly ok: false; readonly message: string };

function buildVizState<TAnswer>(rawInput: string, solver: ArcadeSolver<TAnswer>): VizState {
  try {
    const program = solver.parse(rawInput);
    const frames = solver.trace(program, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    const finalAnswer = solver.policy.formatFrameAnswer(frames[frames.length - 1]!);
    return { ok: true, frames, finalAnswer };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function ArcadeHudBadges<TAnswer>({
  policy,
  frame,
  layout,
  finalAnswer,
}: {
  readonly policy: ArcadePolicy<TAnswer>;
  readonly frame: ArcadeTraceFrame;
  readonly layout: ArcadeSvgLayout;
  readonly finalAnswer: string;
}) {
  return (
    <div className="meta-row" style={{ margin: 0 }}>
      <span className="badge">{policy.label}</span>
      <span className="badge">Step {frame.stepIndex} / {frame.totalSteps}</span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Blocks: {layout.blockCount}
      </span>
      <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
        Score: {frame.score}
      </span>
      <span className="badge">Tilt: {layout.tiltLabel}</span>
      <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
        Answer: {finalAnswer}
      </span>
    </div>
  );
}

function ArcadeScoreBanner({ score, finalScore }: { readonly score: number; readonly finalScore: string }) {
  return (
    <div
      className="card"
      style={{
        margin: 0,
        padding: '0.6rem 0.9rem',
        background: 'var(--surface)',
        borderColor: 'var(--gold)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span className="eyebrow" style={{ margin: 0 }}>Segment Score Display</span>
      <strong style={{ fontFamily: 'monospace', fontSize: '1.1rem', color: 'var(--text)' }}>
        {score} (Final: {finalScore})
      </strong>
    </div>
  );
}

function ArcadeScreenSvg({ layout, frame }: { readonly layout: ArcadeSvgLayout; readonly frame: ArcadeTraceFrame }) {
  return (
    <div className="card" style={{ margin: 0, padding: '0.75rem', background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.82rem', color: 'var(--text)' }}>
        <span>{layout.statusSummary}</span>
        <span className="muted">
          Screen {layout.bounds.width}×{layout.bounds.height} · Walls {layout.wallCount} · Phase {frame.phase}
        </span>
      </div>
      <svg
        viewBox={layout.viewBox}
        role="img"
        aria-label="Care Package arcade cabinet screen"
        style={{ width: '100%', maxHeight: '420px', display: 'block', background: '#0f172a', borderRadius: '6px', border: '1px solid var(--border)' }}
      >
        {layout.wallPath ? <path d={layout.wallPath} fill="#475569" /> : null}
        {RAINBOW_BAND_COLORS.map((color, idx) =>
          layout.blockBandPaths[idx] ? <path key={color} d={layout.blockBandPaths[idx]} fill={color} /> : null,
        )}
        {layout.paddlePath ? <path d={layout.paddlePath} fill="#e2e8f0" /> : null}
        {layout.ballTrailPoints ? (
          <polyline points={layout.ballTrailPoints} fill="none" stroke="#38bdf8" strokeWidth={1.6} strokeOpacity={0.7} strokeLinecap="round" strokeLinejoin="round" />
        ) : null}
        {layout.ballCenter ? (
          <circle cx={layout.ballCenter.x} cy={layout.ballCenter.y} r={5.5} fill="#fef08a" stroke="#ffffff" strokeWidth={1} />
        ) : null}
      </svg>
    </div>
  );
}

/** Interactive arcade cabinet visualizer for AoC 2019 Day 13 Parts 1 and 2. */
export function ArcadeCabinetVisualizer<TAnswer>({ rawInput, solver }: ArcadeCabinetVisualizerProps<TAnswer>) {
  const state = useMemo(() => buildVizState(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, `${solver.policy.id}:${rawInput}`, 60);

  if (!state.ok) {
    return (
      <div className="stack">
        <p className="error-text">Unable to visualize input: {state.message}</p>
      </div>
    );
  }

  const frame = frames[playback.step]!;
  const layout = buildArcadeSvgLayout(frame);

  return (
    <div className="stack">
      <ArcadeHudBadges policy={solver.policy} frame={frame} layout={layout} finalAnswer={state.finalAnswer} />
      {solver.policy.showScoreBanner ? <ArcadeScoreBanner score={frame.score} finalScore={state.finalAnswer} /> : null}
      <ArcadeScreenSvg layout={layout} frame={frame} />
      <PlaybackControls
        step={playback.step}
        totalSteps={frames.length}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={playback.togglePlay}
        onStepChange={playback.setStep}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
