import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { getAssetUrl } from '../../database/assets';
import buildings from '../../database/buildings.json';
import items from '../../database/items.json';
import { useFactoryStore } from '../../store/useFactoryStore';

export default function PhysicalMachineNode({ data }) {
  const storeDirection = useFactoryStore(state => state.layoutDirection);
  const layoutDirection = data.layoutDirection || storeDirection || 'LR';
  const isVertical = layoutDirection === 'TB';

  const building = buildings[data.buildingId];
  const item = items[data.itemId];
  const clockSpeed = data.clockSpeed ?? 100;
  
  // В оригинале SCIM: зеленый контур для основных/высоких мощностей, оранжевый для частичных/стандартных
  const isGreenRing = clockSpeed >= 70;
  const ringColor = isGreenRing ? '#22c55e' : '#f97316';

  const targetPos = isVertical ? Position.Top : Position.Left;
  const sourcePos = isVertical ? Position.Bottom : Position.Right;

  const getInputHandleStyle = (idx, total) => {
    if (isVertical) {
      return { left: `${(idx + 1) * 100 / (total + 1)}%`, top: 4 };
    }
    return { top: `${(idx + 1) * 100 / (total + 1)}%`, left: 4 };
  };

  const getOutputHandleStyle = (idx, total) => {
    if (isVertical) {
      return { left: `${(idx + 1) * 100 / (total + 1)}%`, bottom: 4 };
    }
    return { top: `${(idx + 1) * 100 / (total + 1)}%`, right: 4 };
  };

  return (
    <div className="flex flex-col items-center justify-center relative select-none w-[150px] py-1">
      {/* Круглый узел станка в точности как в оригинале SCIM */}
      <div 
        className="w-20 h-20 rounded-full bg-[#181a20] flex items-center justify-center relative shadow-[0_4px_12px_rgba(0,0,0,0.8)] transition-transform hover:scale-105"
        style={{
          border: `3.5px solid ${ringColor}`,
          boxShadow: `0 0 10px ${ringColor}40`
        }}
      >
        {building?.icon && (
          <img 
            src={getAssetUrl(building.icon)} 
            alt={building.name} 
            className="w-14 h-14 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" 
            onError={e => (e.target.style.display = 'none')}
          />
        )}

        {/* Input Handles на окружности */}
        {data.inputs && data.inputs.map((inp, idx) => (
          <Handle 
            key={`in-${inp.itemId}-${idx}`} 
            type="target" 
            position={targetPos} 
            id={`in-${inp.itemId}`} 
            style={getInputHandleStyle(idx, data.inputs.length)} 
            className="w-2.5 h-2.5 !bg-[#f97316] !border-none opacity-80" 
          />
        ))}
        {(!data.inputs || data.inputs.length === 0) && (
          <Handle 
            type="target" 
            position={targetPos} 
            id="in-generic" 
            className="w-2.5 h-2.5 !bg-[#f97316] !border-none opacity-80" 
          />
        )}

        {/* Output Handles на окружности */}
        {data.outputs && data.outputs.map((out, idx) => (
          <Handle 
            key={`out-${out.itemId}-${idx}`} 
            type="source" 
            position={sourcePos} 
            id={`out-${out.itemId}`} 
            style={getOutputHandleStyle(idx, data.outputs.length)} 
            className="w-2.5 h-2.5 !bg-[#3b82f6] !border-none opacity-80" 
          />
        ))}
        {(!data.outputs || data.outputs.length === 0) && (
          <Handle 
            type="source" 
            position={sourcePos} 
            id="out-generic" 
            className="w-2.5 h-2.5 !bg-[#3b82f6] !border-none opacity-80" 
          />
        )}
      </div>

      {/* Подпись точно как в SCIM под кругом */}
      <div className="flex flex-col items-center text-center mt-2 leading-tight">
        <span className="text-xs font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
          {building?.name || 'Станок'} ({clockSpeed.toFixed(0)}%)
        </span>
        <span className="text-[11px] text-gray-300 font-normal drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
          ({item?.name || data.itemId})
        </span>
      </div>
    </div>
  );
}
