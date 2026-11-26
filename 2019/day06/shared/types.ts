export const ROOT_OBJECT = 'COM';

export interface OrbitEdge {
  readonly parent: string;
  readonly child: string;
}

export interface OrbitTransferRoute {
  readonly fromId: number;
  readonly toId: number;
  readonly lcaId: number;
  readonly pathNodeIds: readonly number[];
}

export interface DepthShellSummary {
  readonly depth: number;
  readonly nodeCount: number;
}

export interface HistogramBin {
  readonly depthStart: number;
  readonly depthEnd: number;
  readonly nodeCount: number;
  readonly orbitContribution: number;
}

export interface LayoutNode {
  readonly id: number;
  readonly label: string;
  readonly depth: number;
  readonly x: number;
  readonly y: number;
}

export interface LayoutEdge {
  readonly parentId: number;
  readonly childId: number;
}

export interface OrbitTreeLayout {
  readonly width: number;
  readonly height: number;
  readonly nodes: readonly LayoutNode[];
  readonly edges: readonly LayoutEdge[];
}
