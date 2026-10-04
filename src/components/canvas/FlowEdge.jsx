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
  markerEnd,
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
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd}
        style={{ ...style, stroke: edgeColor, strokeWidth: edgeWidth, filter: edgeFilter }} 
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="bg-[#12161f]/90 px-2 py-0.5 rounded text-[11px] font-medium text-gray-200 border border-[#2a2e39]/60 shadow-sm flex items-center gap-1 whitespace-nowrap select-none"
          title={validation.message || 'Поток в норме'}
        >
          {data?.isOutput ? (
            <span className="font-mono text-amber-300 font-semibold">{rate.toFixed(1)} {isFluid ? 'м³/мин' : 'шт/мин'}</span>
          ) : (
            <>
              {item && <img src={getAssetUrl(item.icon)} alt="" className="w-3.5 h-3.5 object-contain" />}
              <span>{item?.name || data?.itemId} ({rate.toFixed(1)} {isFluid ? 'м³/мин' : 'шт/мин'})</span>
            </>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
