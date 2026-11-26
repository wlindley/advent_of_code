import { PlaybackControls, type PlaybackState } from '../../../../shared/viz';
import type { SmokeBasinPolicy, SmokeBasinTraceFrame } from '../index';

export interface SmokeBasinTelemetryProps {
  readonly policy: SmokeBasinPolicy;
  readonly frame: SmokeBasinTraceFrame;
  readonly totalSteps: number;
  readonly answer: number;
  readonly playback: PlaybackState;
}

function StepDetailBadge({ frame }: { readonly frame: SmokeBasinTraceFrame }) {
  if (frame.kind === 'low-point-risk') {
    const active = frame.activeLowPoint;
    return (
      <>
        <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
          Low Points: <strong>{frame.revealedLowPointCount}</strong> / {frame.analysis.lowPoints.length}
        </span>
        <span className="badge">
          Active:{' '}
          <strong>
            {active === null ? 'None' : `(${active.row}, ${active.col}) h=${active.height} -> +${active.riskLevel}`}
          </strong>
        </span>
      </>
    );
  }
  const formula = frame.topBasins.map((b) => b.revealedSize).join(' x ');
  return (
    <>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Wave: <strong>{frame.waveDepth}</strong> / {frame.analysis.maxWaveDepth}
      </span>
      <span className="badge">
        Flooded: <strong>{frame.revealedCellCount}</strong> | Top: <strong>{formula}</strong>
      </span>
    </>
  );
}

/** Policy telemetry badges and playback controls for Smoke Basin visualizers. */
export function SmokeBasinTelemetry({ policy, frame, totalSteps, answer, playback }: SmokeBasinTelemetryProps) {
  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div className="meta-row" style={{ margin: 0, justifyContent: 'space-between' }}>
        <div className="meta-row" style={{ margin: 0 }}>
          <span className="badge">{policy.label}</span>
          <StepDetailBadge frame={frame} />
          <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
            Running {policy.metricLabel}: <strong>{frame.runningTotal.toLocaleString()}</strong>
          </span>
        </div>
        <span className="badge status-solved">
          Final Answer: <strong>{answer.toLocaleString()}</strong>
        </span>
      </div>
      <PlaybackControls
        step={playback.step}
        totalSteps={totalSteps}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={playback.togglePlay}
        onStepChange={playback.setStep}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
