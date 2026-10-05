import React from 'react';
import { BaseEdge, getBezierPath } from '@xyflow/react';

export default function BalancerCurvedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data
}) {
  const color = data?.color || '#3b82f6';
  const width = data?.strokeWidth || 3;
  const curvature = data?.curvature ?? 0.45;

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature
  });

  return (
    <>
      {/* Мягкое неоновое свечение под линией */}
      <path
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={width + 3}
        strokeOpacity={0.25}
        strokeLinecap="round"
      />
      {/* Основная плавная дуговая линия */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: color,
          strokeWidth: width,
          strokeLinecap: 'round',
          filter: `drop-shadow(0 0 4px ${color}80)`
        }}
      />
    </>
  );
}
