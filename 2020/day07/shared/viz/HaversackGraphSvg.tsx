import {
  BagTraceFrame,
  DEFAULT_VISIBLE_NODES_PER_LAYER,
  layoutBagTraceFrame,
  PositionedBagColumn,
  PositionedBagNode,
  RoutedBagEdge,
} from '../index';

export interface HaversackGraphSvgProps {
  readonly frame: BagTraceFrame;
  readonly edgeVerb: string;
}

function truncateLabel(label: string, maxLen: number): string {
  return label.length > maxLen ? `${label.slice(0, maxLen - 1)}…` : label;
}

function nodeStroke(node: PositionedBagNode): string {
  if (node.isOrigin) return 'var(--gold)';
  if (node.isActive) return 'var(--accent)';
  return 'var(--border)';
}

function edgeStroke(edge: RoutedBagEdge): string {
  if (edge.isActive) return edge.isSkip ? 'var(--gold)' : 'var(--accent)';
  return 'var(--border)';
}

function BagEdgeView({ edge, edgeVerb }: { readonly edge: RoutedBagEdge; readonly edgeVerb: string }) {
  return (
    <path
      d={edge.pathD}
      fill="none"
      stroke={edgeStroke(edge)}
      strokeWidth={edge.isActive ? 2 : 1.25}
      strokeDasharray={edge.isSkip ? '5 3' : undefined}
      opacity={edge.isActive ? 0.95 : 0.7}
    >
      <title>{`${edge.fromColor} ${edgeVerb} ${edge.toColor} (×${edge.quantity.toString()})`}</title>
    </path>
  );
}

function BagNodeView({ node }: { readonly node: PositionedBagNode }) {
  const stroke = nodeStroke(node);
  return (
    <g transform={`translate(${node.x}, ${node.y})`}>
      <rect
        width={node.width}
        height={node.height}
        rx={7}
        fill="var(--surface)"
        stroke={stroke}
        strokeWidth={node.isOrigin || node.isActive ? 2 : 1.25}
      />
      <text x={10} y={18} fill="var(--text)" fontSize={12} fontWeight={600}>
        {truncateLabel(node.color, 18)}
      </text>
      <text x={10} y={33} fill={node.isOrigin ? 'var(--gold)' : 'var(--muted)'} fontSize={11}>
        {node.isOrigin ? 'target · ×1' : `weight · ×${node.weight.toString()}`}
      </text>
      <title>{`${node.color} (depth ${node.depth}, weight ${node.weight.toString()})`}</title>
    </g>
  );
}

function ColumnChrome({ col }: { readonly col: PositionedBagColumn }) {
  return (
    <g>
      <text
        x={col.x}
        y={24}
        fill={col.isActive ? 'var(--accent)' : 'var(--muted)'}
        fontSize={11}
        fontWeight={col.isActive ? 700 : 600}
      >
        {`Depth ${col.depth} (${col.totalCount})`}
      </text>
      {col.hiddenCount > 0 && (
        <g transform={`translate(${col.x}, ${col.pillY})`}>
          <rect width={148} height={26} rx={13} fill="var(--bg)" stroke="var(--border)" />
          <text x={74} y={17} textAnchor="middle" fill="var(--muted)" fontSize={11} fontWeight={600}>
            {`+${col.hiddenCount} more`}
          </text>
        </g>
      )}
    </g>
  );
}

/** Layered left-to-right SVG visualization of bag containment discovery. */
export function HaversackGraphSvg({ frame, edgeVerb }: HaversackGraphSvgProps) {
  const layout = layoutBagTraceFrame(frame, DEFAULT_VISIBLE_NODES_PER_LAYER);

  return (
    <svg
      className="chart-svg"
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      role="img"
      aria-label={`Layered bag graph up to depth ${frame.revealedDepth}`}
    >
      {!frame.targetPresent ? (
        <text x={layout.width / 2} y={layout.height / 2} textAnchor="middle" fill="var(--muted)" fontSize={13}>
          {`Target bag "${frame.targetColor}" not found in rules`}
        </text>
      ) : (
        <g>
          {layout.edges.map((edge) => (
            <BagEdgeView key={`${edge.fromColor}->${edge.toColor}`} edge={edge} edgeVerb={edgeVerb} />
          ))}
          {layout.columns.map((col) => (
            <ColumnChrome key={col.depth} col={col} />
          ))}
          {layout.nodes.map((node) => (
            <BagNodeView key={node.color} node={node} />
          ))}
        </g>
      )}
    </svg>
  );
}
