import React from 'react';
import { BaseEdge, getSmoothStepPath, EdgeLabelRenderer } from '@xyflow/react';
import { validateLogistics } from '../../engine/logistics';
import items from '../../database/items.json';
import { getAssetUrl } from '../../database/assets';

export default function FlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data
}) {
  const baseOffset = 25;
  const step = 15;
  const slotIndex = data?.slotIndex || 0;
  const dynamicOffset = baseOffset + (slotIndex * step);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
    offset: dynamicOffset
  });

  const rate = data?.rate || 0;
  const item = items[data?.itemId];
  const isFluid = item?.type === 'fluid';
  const validation = validateLogistics(rate, isFluid);
  
  let edgeColor = isFluid ? '#3b82f6' : '#4a5568';
  let edgeWidth = 2;
  let edgeFilter = 'none';

  if (rate > 0) {
    if (isFluid) {
      edgeColor = '#3b82f6';
      if (rate > 300) {
        edgeWidth = 2.5;
        edgeFilter = 'drop-shadow(0 0 5px rgba(59, 130, 246, 0.4))';
      }
      if (validation.alert) {
        edgeColor = '#ef4444';
        edgeFilter = 'drop-shadow(0 0 5px rgba(239, 68, 68, 0.6))';
      }
    } else {
      edgeColor = '#fa9549'; 
      if (rate > 270) {
        edgeWidth = 2.5;
        edgeFilter = 'drop-shadow(0 0 5px rgba(250, 149, 73, 0.4))'; 
      }
      if (validation.alert && rate > 1200) {
        edgeColor = '#ef4444';
        edgeFilter = 'drop-shadow(0 0 5px rgba(239, 68, 68, 0.6))';
      }
    }
  }

  return (
    <>
      <BaseEdge path={edgePath} style={{ ...style, stroke: edgeColor, strokeWidth: edgeWidth, filter: edgeFilter }} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="bg-[#14171d] border border-[#2a2e39] rounded px-2 py-1 text-xs text-[#e1e1e6] flex flex-col items-center shadow-lg"
          title={validation.message || 'Flow OK'}
        >
          <div className="flex items-center gap-1">
            {item && <img src={getAssetUrl(item.icon)} alt={item.name} className="w-4 h-4" />}
            <span style={{ color: edgeColor }} className="font-bold">{rate.toFixed(1)}/m</span>
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">{validation.mk}</div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
