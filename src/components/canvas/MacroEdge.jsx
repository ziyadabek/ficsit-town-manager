import React from 'react';
import { BaseEdge, getSmoothStepPath, EdgeLabelRenderer } from '@xyflow/react';

export default function MacroEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) {
  const { trackIndex = 0, totalTracks = 1 } = data || {};
  const midY = (sourceY + targetY) / 2;
  const trackSpacing = 35; // 35px gap between lanes to accommodate labels nicely
  const offset = (trackIndex - (totalTracks - 1) / 2) * trackSpacing;
  const centerY = midY + offset;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    centerY,
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 15,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
            opacity: style.opacity ?? 1,
            transition: style.transition || 'opacity 0.3s'
          }}
          className="nodrag nopan bg-[#14171d] border border-[#f97316] rounded flex items-center gap-1.5 px-2 py-1 shadow-[0_0_10px_rgba(249,115,22,0.2)] z-20"
          title={data?.name}
        >
          {data?.icon && (
            <img src={data.icon} alt={data?.name} className="w-5 h-5 object-contain" />
          )}
          <span className="text-[#f97316] font-bold text-xs tracking-wider">
            {data?.rate}/м
          </span>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
