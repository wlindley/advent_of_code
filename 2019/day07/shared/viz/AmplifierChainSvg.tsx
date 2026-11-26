import { useId, type ReactNode } from 'react';
import {
  INITIAL_THRUSTER_INPUT,
  computeCircuitDiagramLayout,
  formatSignalValue,
  type AmplifierTraceFrame,
  type CircuitDiagramLayout,
  type CircuitNodeLayout,
  type CircuitWireLayout,
  type StageTelemetry,
} from '../index';

interface AmplifierChainSvgProps {
  readonly frame: AmplifierTraceFrame;
  readonly hasFeedbackLoop: boolean;
}

function wireSignalText(wireIndex: number, frame: AmplifierTraceFrame): string {
  if (wireIndex === 0) {
    return formatSignalValue(INITIAL_THRUSTER_INPUT);
  }
  const sourceStage = frame.run.stages[wireIndex - 1]!;
  const signal = sourceStage.lastEmittedSignal;
  return signal === null ? '—' : formatSignalValue(signal);
}

function renderWire(
  wire: CircuitWireLayout,
  index: number,
  frame: AmplifierTraceFrame,
  markerId: string,
): ReactNode {
  const isFinal = index === 5;
  const stroke = isFinal && frame.isNewBest ? 'var(--gold)' : 'var(--accent)';
  return (
    <g key={`${wire.fromLabel}-${wire.toLabel}`}>
      <line x1={wire.x1} y1={wire.y1} x2={wire.x2} y2={wire.y2} stroke={stroke} strokeWidth={isFinal ? 2.25 : 1.75} markerEnd={`url(#${markerId})`} />
      <text x={wire.labelX} y={wire.labelY} textAnchor="middle" fill={isFinal ? stroke : 'var(--text)'} fontSize="11" fontWeight={isFinal ? 700 : 600}>
        {wireSignalText(index, frame)}
      </text>
    </g>
  );
}

function renderStageNode(node: CircuitNodeLayout, stage: StageTelemetry, isNewBest: boolean): ReactNode {
  const borderColor = isNewBest ? 'var(--gold)' : 'var(--border)';
  const cx = node.x + node.width / 2;
  return (
    <g key={node.label}>
      <rect x={node.x} y={node.y} width={node.width} height={node.height} rx={8} fill="var(--surface)" stroke={borderColor} strokeWidth={isNewBest ? 2 : 1.25} />
      <text x={cx} y={node.y + 20} textAnchor="middle" fill="var(--text)" fontSize="13" fontWeight={700}>Amp {node.label}</text>
      <text x={cx} y={node.y + 40} textAnchor="middle" fill="var(--accent)" fontSize="11" fontWeight={600}>phase {stage.phase.toString()}</text>
      <text x={cx} y={node.y + 60} textAnchor="middle" fill="var(--muted)" fontSize="10.5">{stage.stepCount} steps · {stage.status}</text>
    </g>
  );
}

function renderFeedbackArc(layout: CircuitDiagramLayout, rounds: number, markerId: string): ReactNode {
  if (layout.feedbackPath === null) {
    return null;
  }
  return (
    <g>
      <path
        d={layout.feedbackPath}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={1.5}
        strokeDasharray="5 4"
        markerEnd={`url(#${markerId})`}
      />
      <text x={layout.feedbackLabelX} y={layout.feedbackLabelY} textAnchor="middle" fill="var(--muted)" fontSize="11">
        Feedback E → A ({rounds} rounds)
      </text>
    </g>
  );
}

/** Interactive 5-stage amplifier chain SVG schematic for Day 7 Part 1 & Part 2. */
export function AmplifierChainSvg({ frame, hasFeedbackLoop }: AmplifierChainSvgProps) {
  const markerId = useId();
  const layout = computeCircuitDiagramLayout(hasFeedbackLoop);

  return (
    <section className="card" style={{ marginBottom: 0 }}>
      <div className="day-header" style={{ marginBottom: '0.5rem' }}>
        <span>Amplifier Circuit Schematic</span>
        <div className="meta-row" style={{ margin: 0 }}>
          <span className="badge">Rounds: {frame.run.rounds}</span>
          <span className="badge">Total steps: {frame.run.totalSteps}</span>
          {frame.isNewBest && (
            <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
              New Best Signal
            </span>
          )}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        className="chart-svg"
        role="img"
        aria-label="Five-stage Intcode amplifier schematic"
      >
        <defs>
          <marker id={markerId} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="var(--accent)" />
          </marker>
        </defs>
        <text x={14} y={108} fill="var(--muted)" fontSize="11" fontWeight={700}>IN</text>
        <text x={830} y={108} fill="var(--text)" fontSize="11" fontWeight={700}>THR</text>
        {layout.wires.map((wire, index) => renderWire(wire, index, frame, markerId))}
        {renderFeedbackArc(layout, frame.run.rounds, markerId)}
        {layout.nodes.map((node, index) => renderStageNode(node, frame.run.stages[index]!, frame.isNewBest))}
      </svg>
    </section>
  );
}
