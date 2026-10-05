import React from 'react';
import { BaseEdge, getSmoothStepPath, EdgeLabelRenderer } from '@xyflow/react';
import { getAssetUrl } from '../../database/assets';

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
  const color = data?.color || '#f97316';
  const { trackIndex = 0, totalTracks = 1 } = data || {};

  // Разводим параллельные рёбра по вертикальным полосам (lanes).
  // Смещение по Y устраняет наложение рёбер между одной парой узлов.
  const isHorizontal = Math.abs(targetX - sourceX) >= Math.abs(targetY - sourceY);
  let adjTargetY = targetY;
  let adjTargetX = targetX;

  if (totalTracks === 1) {
    if (isHorizontal && Math.abs(targetY - sourceY) <= 28) {
      adjTargetY = sourceY;
    } else if (!isHorizontal && Math.abs(targetX - sourceX) <= 28) {
      adjTargetX = sourceX;
    }
  }

  const isSnapped = totalTracks === 1 && ((isHorizontal && Math.abs(targetY - sourceY) <= 28) || (!isHorizontal && Math.abs(targetX - sourceX) <= 28));
  const midY = (sourceY + adjTargetY) / 2;
  const laneSpacing = 18;
  const offset = (trackIndex - (totalTracks - 1) / 2) * laneSpacing;
  const centerY = isSnapped ? undefined : midY + offset;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    centerY,
    sourceX,
    sourceY,
    sourcePosition,
    targetX: adjTargetX,
    targetY: adjTargetY,
    targetPosition,
    borderRadius: 18,
  });

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{ ...style, stroke: color, filter: `drop-shadow(0 0 3px ${color}44)` }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
            opacity: style.opacity ?? 1,
            transition: style.transition || 'opacity 0.25s',
            borderColor: color,
          }}
          className="nodrag nopan bg-[#0b0d10] border rounded flex items-center gap-1.5 px-2 py-0.5 z-20 shadow-lg"
          title={data?.name}
        >
          {data?.icon && (
            <img src={getAssetUrl(data.icon)} alt={data?.name} className="w-4 h-4 object-contain" />
          )}
          <span className="font-bold text-[10px] tracking-wider" style={{ color }}>
            {data?.rate}/м
          </span>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
