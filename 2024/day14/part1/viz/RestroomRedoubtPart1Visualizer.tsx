import { useMemo } from 'react';
import { PlaybackControls, type VisualizerProps, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_REDOUBT_SPACE,
  type RedoubtSnapshot,
  type TorusSpace,
  parseRobots,
} from '../../shared';
import { RedoubtCanvas } from '../../shared/viz/RedoubtCanvas';
import { DEFAULT_MAX_TRACE_STEPS, PART1_SECONDS, traceRobotSwarm } from '../domain';

export interface RestroomRedoubtPart1VisualizerProps extends VisualizerProps {
  readonly space?: TorusSpace;
}

type VizState =
  | { readonly ok: true; readonly frames: readonly RedoubtSnapshot[] }
  | { readonly ok: false; readonly message: string };

const LEGEND: ReadonlyArray<readonly [string, string]> = [
  ['1 robot', '#0891b2'],
  ['2 robots', '#059669'],
  ['3+ robots', '#d97706'],
  ['Midline (excluded)', 'rgba(100, 116, 139, 0.25)'],
];

function buildPart1Trace(rawInput: string, space: TorusSpace): VizState {
  try {
    const robots = parseRobots(rawInput);
    const frames = traceRobotSwarm(robots, space, PART1_SECONDS, {
      maxSteps: DEFAULT_MAX_TRACE_STEPS,
    });
    return { ok: true, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function Part1Hud({ snapshot }: { readonly snapshot: RedoubtSnapshot }) {
  const [q1, q2, q3, q4] = snapshot.quadrants;
  const excluded = snapshot.totalRobots - (q1 + q2 + q3 + q4);
  return (
    <div className="meta-row" style={{ color: 'var(--text)' }}>
      <span className="badge">
        Space: <code>{snapshot.space.width}×{snapshot.space.height}</code>
      </span>
      <span className="badge">
        Robots: <code>{snapshot.totalRobots}</code>
      </span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        t: <code>{snapshot.second} / {PART1_SECONDS}s</code>
      </span>
      <span className="badge">
        Quadrants: <code>{q1} · {q2} · {q3} · {q4}</code> (midline: <code>{excluded}</code>)
      </span>
      <span
        className={snapshot.highlight ? 'badge status-solved' : 'badge'}
        style={snapshot.highlight ? { borderColor: 'var(--gold)' } : undefined}
      >
        Safety Factor:{' '}
        <strong className={snapshot.highlight ? 'gold' : undefined}>
          <code>{snapshot.safetyFactor}</code>
        </strong>
      </span>
    </div>
  );
}

/** Interactive step-by-step Restroom Redoubt Part 1 quadrant safety visualizer. */
export function RestroomRedoubtPart1Visualizer({
  rawInput,
  space = DEFAULT_REDOUBT_SPACE,
}: RestroomRedoubtPart1VisualizerProps) {
  const state = useMemo(() => buildPart1Trace(rawInput, space), [rawInput, space]);
  const totalSteps = state.ok ? state.frames.length : 0;
  const playback = usePlayback(totalSteps, `${rawInput}::${space.width}x${space.height}`, 120);

  if (!state.ok) {
    return <p className="error-text">Unable to visualize input: {state.message}</p>;
  }
  const snapshot = state.frames[playback.step];
  if (!snapshot) {
    return <p className="error-text">Unable to visualize input: No trace frames</p>;
  }

  return (
    <div>
      <Part1Hud snapshot={snapshot} />
      <div style={{ margin: '0.6rem 0' }}>
        <RedoubtCanvas snapshot={snapshot} showQuadrants />
      </div>
      <div className="meta-row" style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
        {LEGEND.map(([label, color]) => (
          <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span
              style={{
                width: 11,
                height: 11,
                borderRadius: 3,
                background: color,
                border: '1px solid var(--border)',
              }}
            />
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
        onStepChange={(next) => {
          if (playback.isPlaying) playback.togglePlay();
          playback.setStep(next);
        }}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
