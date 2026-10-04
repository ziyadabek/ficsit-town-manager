import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { getAssetUrl } from '../../database/assets';
import items from '../../database/items.json';
import { useFactoryStore } from '../../store/useFactoryStore';

export default function MergerNode({ data }) {
  const storeDirection = useFactoryStore(state => state.layoutDirection);
  const layoutDirection = data.layoutDirection || storeDirection || 'LR';
  const isVertical = layoutDirection === 'TB';
  const [imgError, setImgError] = useState(false);

  const item = items[data.itemId];
  const isFluid = item?.type === 'fluid';
  const iconPath = isFluid 
    ? '/icons/Conveyor Supports/PipelineTJunction.png' 
    : '/icons/Conveyor Supports/ConveyorMerger.png';

  const targetPos = isVertical ? Position.Top : Position.Left;
  const sourcePos = isVertical ? Position.Bottom : Position.Right;

  return (
    <div className="flex flex-col items-center justify-center relative select-none w-[140px] py-1">
      {/* Target input handles */}
      <Handle 
        type="target" 
        position={targetPos} 
        id="in" 
        style={isVertical ? { left: '40%' } : { top: '40%' }}
        className="w-2.5 h-2.5 !bg-[#f97316] !border-none opacity-80" 
      />
      <Handle 
        type="target" 
        position={targetPos} 
        id="in-branch" 
        style={isVertical ? { left: '60%' } : { top: '60%' }}
        className="w-2.5 h-2.5 !bg-[#eab308] !border-none opacity-80" 
      />

      {/* 3D Model / Icon как в оригинале SCIM */}
      <div className="relative flex items-center justify-center p-1">
        {!imgError ? (
          <img 
            src={getAssetUrl(iconPath)} 
            alt="Merger" 
            className="w-14 h-14 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] transition-transform hover:scale-110" 
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-[#1a1d24] border-2 border-[#22c55e] flex items-center justify-center text-2xl">
            🔄
          </div>
        )}
      </div>

      {/* Подпись точно как в SCIM */}
      <div className="flex flex-col items-center text-center mt-1 leading-tight">
        <span className="text-xs font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          {isFluid ? 'Трубный тройник' : 'Конвейерный соединитель'}
        </span>
        <span className="text-[11px] text-gray-300 font-normal drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          ({item?.name || data.itemId})
        </span>
      </div>

      {/* Source output handle */}
      <Handle 
        type="source" 
        position={sourcePos} 
        id="out" 
        className="w-2.5 h-2.5 !bg-[#3b82f6] !border-none opacity-80" 
      />
    </div>
  );
}
