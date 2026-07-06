import { ACCENT, SLATE_700 } from "../../lib/tokens";

// Fixed SVG coordinate space — scales to fill container via width="100%"
const W = 360;
const H = 300;
const CX = 180;
const CY = 150;
const OUTER_R = 85;  // outer ring radius (viewBox units)
const LABEL_R = 112; // label anchor distance from center
const RINGS = 4;

/**
 * Dependency-free SVG polygon radar chart.
 * Renders N equally-spaced axes with concentric grid rings and a filled
 * data polygon. Purely static — no interactivity, no animation.
 *
 * @param {{ data: {name: string, count: number, fullMark: number}[], maxHeight?: number }} props
 */
export default function RadarChart({ data, maxHeight = 280 }) {
  if (!data || data.length === 0) return null;

  const N = data.length;
  const maxVal = data[0]?.fullMark || 1;

  // Angle for axis i — starts at top (−π/2), goes clockwise
  const angle = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / N;
  const px = (r, i) => CX + r * Math.cos(angle(i));
  const py = (r, i) => CY + r * Math.sin(angle(i));

  // Concentric grid rings (polygons matching the axis grid)
  const ringPoints = Array.from({ length: RINGS }, (_, k) => {
    const r = ((k + 1) / RINGS) * OUTER_R;
    return Array.from({ length: N }, (_, i) =>
      `${px(r, i).toFixed(1)},${py(r, i).toFixed(1)}`
    ).join(" ");
  });

  // Data polygon
  const dataPoints = data
    .map((d, i) => {
      const r = (d.count / maxVal) * OUTER_R;
      return `${px(r, i).toFixed(1)},${py(r, i).toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ maxHeight }}
      role="img"
      aria-label={`Radar chart of technology proficiency across ${N} areas`}
    >
      {/* Concentric grid rings */}
      {ringPoints.map((pts, k) => (
        <polygon
          key={k}
          points={pts}
          fill="none"
          stroke={SLATE_700}
          strokeWidth={1}
        />
      ))}

      {/* Axis spokes */}
      {Array.from({ length: N }, (_, i) => (
        <line
          key={i}
          x1={CX}
          y1={CY}
          x2={px(OUTER_R, i).toFixed(1)}
          y2={py(OUTER_R, i).toFixed(1)}
          stroke={SLATE_700}
          strokeWidth={1}
        />
      ))}

      {/* Data polygon: accent fill + stroke */}
      <polygon
        points={dataPoints}
        fill={ACCENT}
        fillOpacity={0.25}
        stroke={ACCENT}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />

      {/* Axis labels at perimeter */}
      {data.map((d, i) => {
        const lx = px(LABEL_R, i);
        const ly = py(LABEL_R, i);
        const cos = Math.cos(angle(i));
        const anchor =
          cos > 0.1 ? "start" : cos < -0.1 ? "end" : "middle";
        return (
          <text
            key={i}
            x={lx.toFixed(1)}
            y={ly.toFixed(1)}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize={10}
            fill="#4B4336"
          >
            {d.name}
          </text>
        );
      })}
    </svg>
  );
}
