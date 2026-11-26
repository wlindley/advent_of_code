import type { CompressedValveNetwork } from '../compressedNetwork';
import type { AgentRoute, AgentSnapshot, ValveTimelineFrame } from '../timeline';

const SVG_W = 640;
const SVG_H = 400;
const CX = 320;
const CY = 200;
const RING_R = 148;
const AGENT_COLORS = ['var(--accent)', 'var(--gold)'] as const;

interface Point { readonly x: number; readonly y: number; }

export interface ValveNetworkSvgProps {
  readonly compressed: CompressedValveNetwork;
  readonly routes: readonly AgentRoute[];
  readonly frame: ValveTimelineFrame;
}

function computeNodePositions(compressed: CompressedValveNetwork): readonly Point[] {
  const ringIndices: number[] = [];
  for (let i = 0; i < compressed.nodeCount; i++) {
    if (i !== compressed.startIndex) ringIndices.push(i);
  }
  const positions: Point[] = new Array(compressed.nodeCount);
  positions[compressed.startIndex] = { x: CX, y: CY };
  const count = ringIndices.length;
  for (let k = 0; k < count; k++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * k) / count;
    positions[ringIndices[k]!] = { x: CX + RING_R * Math.cos(angle), y: CY + RING_R * Math.sin(angle) };
  }
  return positions;
}

function RouteEdge(props: {
  readonly from: Point;
  readonly to: Point;
  readonly color: string;
  readonly active: boolean;
  readonly travelMinutes: number;
}) {
  const mx = (props.from.x + props.to.x) / 2;
  const my = (props.from.y + props.to.y) / 2;
  return (
    <g>
      <line
        x1={props.from.x} y1={props.from.y} x2={props.to.x} y2={props.to.y}
        stroke={props.color} strokeWidth={props.active ? 2.5 : 1.5}
        strokeOpacity={props.active ? 0.85 : 0.28} strokeDasharray={props.active ? undefined : '5 4'}
      />
      <rect x={mx - 11} y={my - 8} width={22} height={16} rx={4} fill="var(--surface)" stroke={props.color} strokeOpacity={props.active ? 0.85 : 0.35} />
      <text x={mx} y={my + 4} textAnchor="middle" fontSize={10} fontWeight={600} fill="var(--text)">{props.travelMinutes}m</text>
    </g>
  );
}

function RouteEdgesLayer(props: {
  readonly routes: readonly AgentRoute[];
  readonly positions: readonly Point[];
  readonly startIndex: number;
  readonly minute: number;
}) {
  return (
    <g>
      {props.routes.map((route, agentIdx) => {
        const color = AGENT_COLORS[agentIdx % AGENT_COLORS.length]!;
        let prev = props.startIndex;
        return route.schedule.steps.map((step) => {
          const fromIdx = prev;
          prev = step.valveIndex;
          if (fromIdx === step.valveIndex) return null;
          return (
            <RouteEdge
              key={`${route.label}-${fromIdx}-${step.valveIndex}`}
              from={props.positions[fromIdx]!}
              to={props.positions[step.valveIndex]!}
              color={color}
              active={props.minute > step.openedAtMinute - step.travelMinutes - 1}
              travelMinutes={step.travelMinutes}
            />
          );
        });
      })}
    </g>
  );
}

function ValveNodesLayer(props: {
  readonly compressed: CompressedValveNetwork;
  readonly positions: readonly Point[];
  readonly frame: ValveTimelineFrame;
}) {
  return (
    <g>
      {props.compressed.nodes.map((node, i) => {
        const pos = props.positions[i]!;
        const isStart = i === props.compressed.startIndex;
        const isOpen = i < props.compressed.positiveCount && (props.frame.openedMask & (1 << i)) !== 0;
        const openingIdx = props.frame.agents.findIndex((a) => a.status === 'opening' && a.toIndex === i);
        const stroke = openingIdx >= 0 ? AGENT_COLORS[openingIdx % AGENT_COLORS.length]! : isOpen ? 'var(--ok)' : 'var(--border)';
        return (
          <g key={node.name}>
            <circle
              cx={pos.x} cy={pos.y} r={isStart ? 22 : 20}
              fill={isOpen ? 'var(--ok)' : 'var(--surface)'} fillOpacity={isOpen ? 0.16 : 1}
              stroke={stroke} strokeWidth={openingIdx >= 0 || isOpen ? 2.5 : 1.5}
            />
            <text x={pos.x} y={node.flowRate > 0 ? pos.y - 2 : pos.y + 4} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--text)">{node.name}</text>
            {node.flowRate > 0 && (
              <text x={pos.x} y={pos.y + 11} textAnchor="middle" fontSize={10} fill={isOpen ? 'var(--ok)' : 'var(--accent)'} fontWeight={600}>+{node.flowRate}</text>
            )}
          </g>
        );
      })}
    </g>
  );
}

function agentCoords(agent: AgentSnapshot, positions: readonly Point[], idx: number, total: number): Point {
  const from = positions[agent.fromIndex]!;
  const to = positions[agent.toIndex]!;
  const t = agent.status === 'moving' ? agent.progress : 1;
  const spread = agent.fromIndex === agent.toIndex && total > 1 ? (idx - (total - 1) / 2) * 18 : 0;
  return { x: from.x + (to.x - from.x) * t + spread, y: from.y + (to.y - from.y) * t };
}

/** Interactive radial SVG diagram of compressed valves, route edges, and animated agents. */
export function ValveNetworkSvg({ compressed, routes, frame }: ValveNetworkSvgProps) {
  const positions = computeNodePositions(compressed);
  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      role="img"
      aria-label={`Valve network with ${compressed.positiveCount} positive valves at minute ${frame.minute}`}
      style={{ width: '100%', maxWidth: SVG_W, height: 'auto', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}
    >
      <RouteEdgesLayer routes={routes} positions={positions} startIndex={compressed.startIndex} minute={frame.minute} />
      <ValveNodesLayer compressed={compressed} positions={positions} frame={frame} />
      {frame.agents.map((agent, idx) => {
        const pt = agentCoords(agent, positions, idx, frame.agents.length);
        const color = AGENT_COLORS[idx % AGENT_COLORS.length]!;
        return (
          <g key={agent.label}>
            <circle cx={pt.x} cy={pt.y - 22} r={9} fill={color} stroke="var(--surface)" strokeWidth={1.5} />
            <text x={pt.x} y={pt.y - 18.5} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--surface)">
              {agent.label[0]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
