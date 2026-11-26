import type { LanPartySnapshot } from '../index';

const W = 680;
const H = 312;
const CX = W / 2;
const CY = H / 2;
const MAX_FULL_RING_NODES = 40;
const MAX_HALO_NODES = 32;

interface GraphLayout {
  readonly nodeIds: readonly number[];
  readonly positions: ReadonlyMap<number, readonly [number, number]>;
  readonly edges: readonly (readonly [number, number])[];
  readonly focused: boolean;
}

function placeRing(ids: readonly number[], radius: number, positions: Map<number, readonly [number, number]>): void {
  const n = ids.length;
  if (n === 1) {
    positions.set(ids[0]!, [CX + (radius > 90 ? radius : 0), CY]);
    return;
  }
  for (let i = 0; i < n; i += 1) {
    const angle = -Math.PI / 2 + (i / n) * Math.PI * 2;
    positions.set(ids[i]!, [CX + Math.cos(angle) * radius, CY + Math.sin(angle) * radius]);
  }
}

function collectHaloIds(snapshot: LanPartySnapshot, inner: readonly number[]): readonly number[] {
  const innerSet = new Set(inner);
  const haloSet = new Set<number>();
  for (const id of inner) {
    for (const nbr of snapshot.graph.neighbors(id)) {
      if (!innerSet.has(nbr)) haloSet.add(nbr);
    }
  }
  return [...haloSet].slice(0, MAX_HALO_NODES);
}

function buildLayout(snapshot: LanPartySnapshot): GraphLayout {
  const graph = snapshot.graph;
  const positions = new Map<number, readonly [number, number]>();
  if (graph.nodeCount <= MAX_FULL_RING_NODES) {
    const nodeIds = Array.from({ length: graph.nodeCount }, (_, i) => i);
    placeRing(nodeIds, 124, positions);
    return { nodeIds, positions, edges: graph.edges, focused: false };
  }
  const inner = snapshot.activeClique ? snapshot.activeClique.nodeIds : [0];
  const halo = collectHaloIds(snapshot, inner);
  placeRing(inner, inner.length <= 1 ? 0 : 54, positions);
  placeRing(halo, 128, positions);
  const nodeIds = [...inner, ...halo];
  const visible = new Set(nodeIds);
  const edges: [number, number][] = [];
  for (const u of nodeIds) {
    for (const v of graph.upperNeighbors(u)) if (visible.has(v)) edges.push([u, v]);
  }
  return { nodeIds, positions, edges, focused: true };
}

function EdgeLayer(props: { readonly layout: GraphLayout; readonly activeSet: ReadonlySet<number>; readonly complete: boolean }) {
  const activeColor = props.complete ? 'var(--ok)' : 'var(--gold)';
  return (
    <g>
      {props.layout.edges.map(([u, v]) => {
        const p1 = props.layout.positions.get(u)!;
        const p2 = props.layout.positions.get(v)!;
        const active = props.activeSet.has(u) && props.activeSet.has(v);
        return (
          <line
            key={`${u}-${v}`}
            x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]}
            stroke={active ? activeColor : 'var(--border)'}
            strokeWidth={active ? 2.4 : 1}
            strokeOpacity={active ? 0.95 : 0.8}
          />
        );
      })}
    </g>
  );
}

function NodeLayer(props: { readonly snapshot: LanPartySnapshot; readonly layout: GraphLayout; readonly activeSet: ReadonlySet<number> }) {
  const r = props.layout.nodeIds.length > 26 ? 11 : 13.5;
  const fontSize = props.layout.nodeIds.length > 26 ? 8.5 : 10;
  const activeFill = props.snapshot.isComplete ? 'var(--ok)' : 'var(--gold)';
  return (
    <g>
      {props.layout.nodeIds.map((id) => {
        const [x, y] = props.layout.positions.get(id)!;
        const name = props.snapshot.graph.nameOf(id);
        const active = props.activeSet.has(id);
        const isT = name.startsWith('t');
        const fill = active ? activeFill : isT ? 'var(--surface)' : 'var(--bg)';
        const stroke = active ? activeFill : isT ? 'var(--accent)' : 'var(--muted)';
        const textFill = active ? 'var(--surface)' : isT ? 'var(--accent)' : 'var(--text)';
        return (
          <g key={id}>
            {active && isT && <circle cx={x} cy={y} r={r + 3.2} fill="none" stroke="var(--accent)" strokeWidth={1.8} />}
            <circle cx={x} cy={y} r={r} fill={fill} stroke={stroke} strokeWidth={isT ? 2 : 1.2} />
            <text x={x} y={y + 3.4} textAnchor="middle" fontSize={fontSize} fontWeight={active || isT ? 700 : 500} fill={textFill}>
              {name}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** Interactive LAN graph SVG (full ring <= 40 nodes; focused 2-ring induced subgraph > 40). */
export function LanGraphSvg({ snapshot }: { readonly snapshot: LanPartySnapshot }) {
  const layout = buildLayout(snapshot);
  const activeSet = new Set(snapshot.activeClique ? snapshot.activeClique.nodeIds : []);
  const graph = snapshot.graph;
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', padding: '0.75rem' }}>
      <div className="meta-row" style={{ marginTop: 0, justifyContent: 'space-between', fontSize: '0.82rem' }}>
        <span>
          Nodes: <code>{graph.nodeCount}</code> · Edges: <code>{graph.edgeCount}</code> · Avg degree: <code>{graph.averageDegree.toFixed(1)}</code>
        </span>
        <span className="muted">
          {layout.focused ? `Focused 2-ring (${layout.nodeIds.length} / ${graph.nodeCount} nodes)` : 'Full ring topology'}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="LAN party clique graph" style={{ width: '100%', height: 'auto', display: 'block' }}>
        <EdgeLayer layout={layout} activeSet={activeSet} complete={snapshot.isComplete} />
        <NodeLayer snapshot={snapshot} layout={layout} activeSet={activeSet} />
      </svg>
      <div className="meta-row" style={{ marginBottom: 0, fontSize: '0.78rem', color: 'var(--muted)' }}>
        <span className="badge" style={{ borderColor: snapshot.isComplete ? 'var(--ok)' : 'var(--gold)', color: snapshot.isComplete ? 'var(--ok)' : 'var(--gold)' }}>
          Active clique: <code>{snapshot.activeClique ? snapshot.activeClique.password : 'none'}</code>
        </span>
        <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>t* node marker</span>
      </div>
    </div>
  );
}
