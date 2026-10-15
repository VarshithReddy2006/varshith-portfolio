import { memo } from 'react';
import { ariaGraph, groupColors } from '../three/ariaGraph';

const S = 64; // world → SVG units
const ry = -0.35;

/** Orthographic projection of the same graph data the 3D scene uses. */
const project = ([x, y, z]: [number, number, number]) => {
  const px = x * Math.cos(ry) + z * Math.sin(ry);
  const pz = -x * Math.sin(ry) + z * Math.cos(ry);
  return [px * S, -(y + pz * 0.12) * S] as const;
};

const pts = ariaGraph.nodes.map((n) => project(n.pos));

/** Static SVG version of the ARIA dependency graph (mobile / reduced motion / no WebGL). */
export const AriaGraphFallback = memo(function AriaGraphFallback() {
  const { nodes, edges } = ariaGraph;
  return (
    <svg viewBox="-380 -200 760 400" className="h-full w-full" aria-hidden>
      <defs>
        <radialGradient id="ag-glow">
          <stop offset="0" stopColor="#ffb866" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffb866" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g stroke="#e8c58a" strokeOpacity="0.22" strokeWidth="1">
        {edges.map(([a, b], i) => (
          <line key={i} x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]} />
        ))}
      </g>
      <g stroke="#ffe2b0" strokeOpacity="0.7" strokeWidth="1.4" strokeDasharray="3 14" className="animate-dash">
        {edges
          .filter(([a]) => nodes[a].major)
          .map(([a, b], i) => (
            <line key={i} x1={pts[a][0]} y1={pts[a][1]} x2={pts[b][0]} y2={pts[b][1]} />
          ))}
      </g>
      {nodes.map((n, i) =>
        n.major ? (
          <g key={n.id}>
            <circle cx={pts[i][0]} cy={pts[i][1]} r="26" fill="url(#ag-glow)" />
            <circle cx={pts[i][0]} cy={pts[i][1]} r="6.5" fill={groupColors[n.group]} />
            <text
              x={pts[i][0]}
              y={pts[i][1] - 13}
              textAnchor="middle"
              fontSize="10.5"
              fill="#c9c1b4"
              style={{ fontFamily: 'inherit' }}
            >
              {n.label}
            </text>
          </g>
        ) : (
          <circle key={n.id} cx={pts[i][0]} cy={pts[i][1]} r="2.4" fill="#8a8377" />
        ),
      )}
    </svg>
  );
});
