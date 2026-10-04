import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { getAssetUrl } from '../../database/assets';
import items from '../../database/items.json';
import { useFactoryStore } from '../../store/useFactoryStore';

export default function SplitterNode({ data }) {
  const storeDirection = useFactoryStore(state => state.layoutDirection);
  const layoutDirection = data.layoutDirection || storeDirection || 'LR';
  const isVertical = layoutDirection === 'TB';
  const [imgError, setImgError] = useState(false);

  const item = items[data.itemId];
  const isFluid = item?.type === 'fluid';
  const iconPath = isFluid 
    ? '/icons/Conveyor Supports/PipelineJunction.png' 
    : '/icons/Conveyor Supports/ConveyorSplitter.png';

  const targetPos = isVertical ? Position.Top : Position.Left;
  const sourcePos = isVertical ? Position.Bottom : Position.Right;

  return (
    <div className="flex flex-col items-center justify-center relative select-none w-[140px] py-1">
      {/* Target input handle (Вход) */}
      <Handle 
        type="target" 
        position={targetPos} 
        id="in" 
        className="w-2.5 h-2.5 !bg-[#f97316] !border-none opacity-80" 
      />

      {/* 3D Model / Icon как в оригинале SCIM */}
      <div className="relative flex items-center justify-center p-1">
        {!imgError ? (
          <img 
            src={getAssetUrl(iconPath)} 
            alt="Splitter" 
            className="w-14 h-14 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] transition-transform hover:scale-110" 
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-[#1a1d24] border-2 border-[#f97316] flex items-center justify-center text-2xl">
            🔀
          </div>
        )}
      </div>

      {/* Подпись точно как в SCIM: Название и Предмет в скобках */}
      <div className="flex flex-col items-center text-center mt-1 leading-tight">
        <span className="text-xs font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          {isFluid ? 'Трубный перекресток' : 'Конвейерный разветвитель'}
        </span>
        <span className="text-[11px] text-gray-300 font-normal drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          ({item?.name || data.itemId})
        </span>
      </div>

      {/* Source output handles (3 выхода по правилам игры) */}
      <Handle 
        type="source" 
        position={sourcePos} 
        id="out" 
        style={isVertical ? { left: '25%' } : { top: '25%' }}
        className="w-2.5 h-2.5 !bg-[#3b82f6] !border-none opacity-80" 
        title="Выход 1"
      />
      <Handle 
        type="source" 
        position={sourcePos} 
        id="out-1" 
        style={isVertical ? { left: '50%' } : { top: '50%' }}
        className="w-2.5 h-2.5 !bg-[#38bdf8] !border-none opacity-80" 
        title="Выход 2"
      />
      <Handle 
        type="source" 
        position={sourcePos} 
        id="out-2" 
        style={isVertical ? { left: '75%' } : { top: '75%' }}
        className="w-2.5 h-2.5 !bg-[#3b82f6] !border-none opacity-80" 
        title="Выход 3"
      />
      {/* Совместимость с предыдущими id */}
      <Handle 
        type="source" 
        position={sourcePos} 
        id="out-branch" 
        style={isVertical ? { left: '50%' } : { top: '50%' }}
        className="w-0 h-0 opacity-0 pointer-events-none" 
      />
    </div>
  );
}
