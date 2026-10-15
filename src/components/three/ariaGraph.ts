/**
 * ARIA dependency-graph data shared by the 3D scene and the SVG fallback.
 * Major nodes mirror ARIA's real pipeline; satellites stand in for source
 * modules feeding the index. Positions are deterministic.
 */
import { mulberry32 } from '../../lib/rng';

export type GroupId = 'ingest' | 'index' | 'graph' | 'retrieval' | 'insight' | 'serve';

export const groupColors: Record<GroupId, string> = {
  ingest: '#c9c1b4',
  index: '#e8c58a',
  graph: '#f5dcae',
  retrieval: '#b9a4ff',
  insight: '#ffb866',
  serve: '#e8c58a',
};

export const groupNames: Record<GroupId, string> = {
  ingest: 'Ingestion',
  index: 'Indexing',
  graph: 'Graphs',
  retrieval: 'Retrieval',
  insight: 'Intelligence',
  serve: 'Serving',
};

export interface GraphNode {
  id: string;
  label: string;
  group: GroupId;
  pos: [number, number, number];
  major: boolean;
}

const majors: Omit<GraphNode, 'major'>[] = [
  { id: 'repo', label: 'Git repository', group: 'ingest', pos: [-4.4, 0.4, 0.2] },
  { id: 'ast', label: 'Tree-sitter AST', group: 'ingest', pos: [-3.2, -0.6, -0.4] },
  { id: 'symbols', label: 'Symbol index', group: 'index', pos: [-1.7, 0.9, 0.5] },
  { id: 'api', label: 'API surface', group: 'index', pos: [-1.9, -1.6, 0.3] },
  { id: 'deps', label: 'Dependency graph', group: 'graph', pos: [-0.2, 1.8, -0.6] },
  { id: 'calls', label: 'Call graph', group: 'graph', pos: [0.1, -0.5, 0.9] },
  { id: 'nx', label: 'NetworkX', group: 'graph', pos: [0.6, 0.6, -1.3] },
  { id: 'qdrant', label: 'Qdrant', group: 'retrieval', pos: [-0.6, -2.3, -0.8] },
  { id: 'chroma', label: 'ChromaDB', group: 'retrieval', pos: [0.9, -2.0, 0.4] },
  { id: 'hybrid', label: 'Hybrid retrieval', group: 'retrieval', pos: [2.0, -1.0, -0.2] },
  { id: 'impact', label: 'Impact analysis', group: 'insight', pos: [2.1, 1.9, 0.4] },
  { id: 'risk', label: 'PR risk scoring', group: 'insight', pos: [3.4, 1.2, -0.7] },
  { id: 'chat', label: 'Repository chat', group: 'insight', pos: [3.2, -0.4, 0.8] },
  { id: 'api-server', label: 'FastAPI', group: 'serve', pos: [4.5, 0.3, 0] },
  { id: 'mcp', label: 'MCP server', group: 'serve', pos: [4.4, -1.7, -0.6] },
  { id: 'sse', label: 'SSE streaming', group: 'serve', pos: [4.9, 1.8, 0.6] },
  { id: 'llm', label: 'LLM failover', group: 'serve', pos: [3.0, -2.4, -0.4] },
  { id: 'obs', label: 'Observability', group: 'serve', pos: [5.6, -0.6, -0.8] },
];

export const majorEdges: [string, string][] = [
  ['repo', 'ast'],
  ['ast', 'symbols'],
  ['ast', 'api'],
  ['symbols', 'deps'],
  ['symbols', 'calls'],
  ['deps', 'nx'],
  ['calls', 'nx'],
  ['symbols', 'qdrant'],
  ['api', 'chroma'],
  ['qdrant', 'hybrid'],
  ['chroma', 'hybrid'],
  ['nx', 'hybrid'],
  ['nx', 'impact'],
  ['impact', 'risk'],
  ['hybrid', 'chat'],
  ['chat', 'llm'],
  ['api-server', 'chat'],
  ['api-server', 'mcp'],
  ['api-server', 'sse'],
  ['sse', 'chat'],
  ['mcp', 'hybrid'],
  ['risk', 'api-server'],
  ['obs', 'api-server'],
  ['llm', 'obs'],
];

function build() {
  const rnd = mulberry32(1337);
  const nodes: GraphNode[] = majors.map((m) => ({ ...m, major: true }));
  const edges: [number, number][] = majorEdges.map(([a, b]) => [
    nodes.findIndex((n) => n.id === a),
    nodes.findIndex((n) => n.id === b),
  ]);
  const anchors = ['ast', 'symbols', 'api', 'deps', 'calls', 'nx'];
  for (let i = 0; i < 34; i++) {
    const anchorId = anchors[i % anchors.length];
    const ai = nodes.findIndex((n) => n.id === anchorId);
    const a = nodes[ai].pos;
    const theta = rnd() * Math.PI * 2;
    const phi = Math.acos(2 * rnd() - 1);
    const r = 0.7 + rnd() * 0.9;
    nodes.push({
      id: `mod-${i}`,
      label: `module_${String(i + 1).padStart(2, '0')}.py`,
      group: nodes[ai].group,
      pos: [a[0] + r * Math.sin(phi) * Math.cos(theta), a[1] + r * Math.cos(phi) * 0.8, a[2] + r * Math.sin(phi) * Math.sin(theta)],
      major: false,
    });
    edges.push([nodes.length - 1, ai]);
    if (rnd() < 0.3) edges.push([nodes.length - 1, nodes.findIndex((n) => n.id === anchors[(i + 1) % anchors.length])]);
  }
  // Center the layout around the origin.
  const xs = nodes.map((n) => n.pos[0]);
  const ys = nodes.map((n) => n.pos[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  nodes.forEach((n) => (n.pos = [n.pos[0] - cx, n.pos[1] - cy, n.pos[2]]));
  return { nodes, edges };
}

export const ariaGraph = build();

export function neighborsOf(index: number) {
  const set = new Set<number>([index]);
  ariaGraph.edges.forEach(([a, b]) => {
    if (a === index) set.add(b);
    if (b === index) set.add(a);
  });
  return set;
}
