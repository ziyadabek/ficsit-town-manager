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
  const width = data?.strokeWidth || 2;
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
    <BaseEdge
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        ...style,
        stroke: color,
        strokeWidth: width,
      }}
    />
  );
}
