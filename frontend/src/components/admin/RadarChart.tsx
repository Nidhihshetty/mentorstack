"use client";
import React, { useMemo, useState } from 'react';

interface RadarChartProps {
  axes: string[]; // axis names
  points: Array<{ label: string; values: Record<string, number>; color?: string; }>; // normalized 0-100 values per axis
  size?: number;
}

// Simple SVG radar chart without external deps
export function RadarChart({ axes, points, size = 260 }: Readonly<RadarChartProps>) {
  const radius = size / 2 - 30;
  const center = { x: size / 2, y: size / 2 };
  const angleStep = (Math.PI * 2) / axes.length;
  const [hover, setHover] = useState<null | { label: string; axis: string; value: number; x: number; y: number }>(null);

  const axisPoints = axes.map((axis, i) => {
    const angle = -Math.PI / 2 + i * angleStep;
    return {
      axis,
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius
    };
  });

  const polygons = useMemo(() => {
    return points.map(pt => {
      const vs = axes.map((axis, i) => {
        const value = Math.min(100, Math.max(0, pt.values[axis] ?? 0));
        const pctRadius = (value / 100) * radius;
        const angle = -Math.PI / 2 + i * angleStep;
        const x = center.x + Math.cos(angle) * pctRadius;
        const y = center.y + Math.sin(angle) * pctRadius;
        return { axis, value, x, y };
      });
      return { label: pt.label, color: pt.color, vertices: vs, pointsAttr: vs.map(v => `${v.x},${v.y}`).join(' ') };
    });
  }, [points, axes, angleStep, radius, center.x, center.y]);

  return (
    <div style={{ width: size, height: size }} className="relative">
      <svg width={size} height={size} className="overflow-visible">
        {/* concentric grid */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <circle
            key={f}
            cx={center.x}
            cy={center.y}
            r={radius * f}
            className="stroke-teal-200 fill-transparent"
            strokeWidth={0.8}
          />
        ))}
        {/* axis lines */}
        {axisPoints.map(p => (
          <line
            key={p.axis}
            x1={center.x}
            y1={center.y}
            x2={p.x}
            y2={p.y}
            className="stroke-teal-300"
            strokeWidth={0.7}
          />
        ))}
        {/* polygons for each point */}
        {polygons.map((poly, idx) => (
          <g key={poly.label + idx}>
            <polygon
              points={poly.pointsAttr}
              stroke={poly.color || 'rgba(13,148,136,0.9)'}
              fill={poly.color ? poly.color.replace('0.9', '0.15') : 'rgba(13,148,136,0.15)'}
              strokeWidth={hover?.label === poly.label ? 3 : 2}
              className="transition-all duration-200"
            />
            {/* interactive vertices */}
            {poly.vertices.map(v => (
              <circle
                key={`${poly.label}-${v.axis}`}
                cx={v.x}
                cy={v.y}
                r={4}
                fill={poly.color || 'rgba(13,148,136,0.9)'}
                className="cursor-pointer opacity-80 hover:opacity-100"
                onMouseEnter={() => setHover({ label: poly.label, axis: v.axis, value: v.value, x: v.x, y: v.y })}
                onMouseLeave={() => setHover(null)}
              />
            ))}
          </g>
        ))}
        {/* axis labels */}
        {axisPoints.map(p => (
          <text
            key={p.axis}
            x={p.x}
            y={p.y}
            dy={p.y < center.y ? -6 : 14}
            textAnchor="middle"
            className="fill-gray-700 text-[11px] font-medium"
          >
            {p.axis}
          </text>
        ))}
      </svg>
      {/* Tooltip */}
      {hover && (
        <div
          className="absolute z-10 bg-white shadow-lg rounded-md px-2 py-1 text-[11px] text-gray-700 border border-gray-200"
          style={{ left: Math.min(size - 120, Math.max(6, hover.x + 8)), top: Math.min(size - 32, Math.max(6, hover.y + 8)) }}
        >
          <div className="font-semibold text-teal-700">{hover.label}</div>
          <div>{hover.axis}: <span className="font-semibold">{hover.value}</span></div>
        </div>
      )}
      {/* Legend */}
      <div className="absolute left-0 right-0 -bottom-6 flex flex-wrap justify-center gap-3">
        {points.slice(0, 6).map(pt => (
          <div key={pt.label} className="flex items-center gap-2 text-xs text-gray-600">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ background: pt.color || 'rgba(13,148,136,0.9)' }}
            />
            <span className="truncate max-w-[90px]" title={pt.label}>{pt.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RadarChart;
